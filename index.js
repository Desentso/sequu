
const getHash = data => {
  return JSON.stringify(data)
}

const callInMs = (func, waitTime) => (...args) => {
  setTimeout(() => {
    func(...args)
  }, waitTime)
}

const getParams = params => (
  Array.isArray(params)
    ? params
    : [params]
)


const loopItems = (func, data, options, resolve) => {
  const logFailure = (offset, params) => {
    if (options.logFailure) {
      options.logFailure(func, offset, params)
    } else {
      options.log(`${func.name} failed for params: ${JSON.stringify(params)}, offset: ${offset}`)
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
    next(offset + 1)
    logSuccess(offset, data[offset], response)
  }

  const handleFail = (offset, error) => {
    logError(offset, data[offset], err)
    const hash = getHash(data[offset])

    if (!(hash in retries)) {
      retries[hash] = 0
    }

    retries[hash] += 1
    
    if (retries[hash] <= options.maxRetries) {
      
      retry(offset)
      if (options.continueParallel) {
        next(offset + 1)
      }
    } else {
      logFailure(offset, data[offset])
      setDone(offset)
      next(offset + 1)
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
  

  const next = callInMs(callItem, options.waitTime)
  const retry = callInMs(callItem, options.retryWaitTime)


  callItem(0)
}

const DEFAULT_OPTIONS = {
  async: true,
  waitTime: 100,
  retryWaitTime: 2000,
  continueParallel: false,
  maxRetries: 5,
  loggingEnabled: false,
  log(msg) {if (this.loggingEnabled) {console.log(msg)}},
  // other possible options
  // errorWaitTime: error => int
  // logError: (func, offset, params, err) => void
  // logSuccess: (func, offset, params, response) => void
  // logFailure: (func, offset, params) => void
}

const call = (functionToCall, options={}) => data => {
  const mergedOptions = {
    ...DEFAULT_OPTIONS,
    ...options
  }

  return new Promise((resolve, reject) => {
    loopItems(functionToCall, data, mergedOptions, resolve)
  })
} 

module.exports = call
