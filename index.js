const {
  getHash,
  getRandomIn,
  callInMs,
  getParams,
} = require("./utils")

const loopItems = (func, data, options, resolve) => {
  const logFailure = (offset, params, err) => {
    if (options.logFailure) {
      options.logFailure(func, offset, params, err)
    } else {
      options.log(`${func.name} failed for params: ${JSON.stringify(params)}, offset: ${offset}, err: ${err}`)
    }
  }

  const logError = (offset, params, err) => {
    if (options.logError) {
      options.logError(func, offset, params, err)
    } else {
      options.log(`${func.name} failed, retrying for params: ${JSON.stringify(params)}, offset: ${offset}, err: ${err}`)
    }
  }

  const logSuccess = (offset, params, response) => {
    if (options.logSuccess) {
      options.logSuccess(func, offset, params, response)
    } else {
      options.log(`${func.name} succeeded for params: ${JSON.stringify(params)}, offset: ${offset}`)
    }
  }


  const returnedData = []
  const done = {}
  let doneAmount = 0
  const retries = {}

  const setDone = offset => {
    if (!(offset in done)) {
      done[offset] = 1
      doneAmount += 1
    }
  }


  const handleSuccess = (offset, response) => {
    returnedData.push(response)
    setDone(offset)
    next(data[offset + 1])(offset + 1)
    logSuccess(offset, data[offset], response)
  }

  const handleFail = (offset, error) => {
    const params = data[offset]
    const hash = getHash(params)

    if (!(hash in retries)) {
      retries[hash] = 0
    }

    retries[hash] += 1
    
    if (retries[hash] <= options.maxRetries) {
      logError(offset, params, error)
      retry(error, params)(offset)
      if (options.continueParallel && !done[offset + 1]) {
        next(data[offset + 1])(offset + 1)
      }
    } else {
      logFailure(offset, params, error)
      setDone(offset)
      next(data[offset + 1])(offset + 1)
    }
  }


  const callItemSync = (offset = 0) => {
    if (done[offset]) {
      return
    }
    if (offset > data.length - 1 && doneAmount === data.length) {
      resolve(returnedData)
      return
    }
    if (offset > data.length - 1) return

    try {
      const response = func.apply(null, getParams(data[offset]))
      handleSuccess(offset, response)
    } catch(err) {
      handleFail(offset, err)
    }
    
  }

  const callItemAsync = (offset = 0) => {
    if (done[offset]) {
      return
    }
    if (offset > data.length - 1 && doneAmount === data.length) {
      resolve(returnedData)
      return
    }
    if (offset > data.length - 1) return

    func.apply(null, getParams(data[offset]))
      .then(response => {
        handleSuccess(offset, response)
      })
      .catch(err => {
        handleFail(offset, err)
      })
  }

  const callItem = options.async
    ? callItemAsync
    : callItemSync
  

  const next = (params) => typeof options.waitTime === "function"
    ? callInMs(callItem, options.waitTime(params) || DEFAULT_WAIT_TIME) 
    : options.randomWaitTime
      ? Array.isArray(options.randomWaitTime)
        ? callInMs(callItem, getRandomIn(options.randomWaitTime[0], options.randomWaitTime[1]))
        : callInMs(callItem, getRandomIn(100, 1000))
      : callInMs(callItem, options.waitTime)
  const retry = (err, params) => typeof options.retryWaitTime === "function"
    ? callInMs(callItem, options.retryWaitTime(err, params) || DEFAULT_RETRY_WAIT_TIME) 
    : options.randomRetryWaitTime
      ? Array.isArray(options.randomRetryWaitTime)
        ? callInMs(callItem, getRandomIn(options.randomRetryWaitTime[0], options.randomRetryWaitTime[1]))
        : callInMs(callItem, getRandomIn(100, 1000))
      : callInMs(callItem, options.retryWaitTime)

  callItem(0)
}

const DEFAULT_WAIT_TIME = 100
const DEFAULT_RETRY_WAIT_TIME = 2000

const DEFAULT_OPTIONS = {
  async: true, // bool
  waitTime: DEFAULT_WAIT_TIME, // int, func
  retryWaitTime: DEFAULT_RETRY_WAIT_TIME, // int, func
  randomWaitTime: false, // bool, [min, max]
  randomRetryWaitTime: false, // bool, [min, max]
  continueParallel: false, // bool
  maxRetries: 5, // int
  loggingEnabled: false, // bool
  log(msg) {if (this.loggingEnabled) {console.log(msg)}}, // str => void
  // other possible options
  // logError: (func, offset, params, err) => void
  // logSuccess: (func, offset, params, response) => void
  // logFailure: (func, offset, params) => void
}

const sequential = (functionToCall, options={}) => data => {
  const mergedOptions = {
    ...DEFAULT_OPTIONS,
    ...options
  }

  return new Promise((resolve, reject) => {
    loopItems(functionToCall, data, mergedOptions, resolve)
  })
} 

module.exports = sequential
