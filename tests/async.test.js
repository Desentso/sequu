const sequential = require("../")

const testFunc = i => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (i % 5 === 0) {
        reject(new Error("Divisible by 5, this is bad"))
      }
      resolve(i)
    }, 1)
  }) 
}

const testFuncNoTimeout = i => {
  return new Promise((resolve, reject) => {
    if (i % 5 === 0) {
      reject(new Error("Divisible by 5, this is bad"))
    }
    resolve(i)
  }) 
}

function flushPromises() {
  // Wait for promises running in the non-async timer callback to complete.
  // From https://stackoverflow.com/a/58716087/308237
  return new Promise(resolve => setImmediate(resolve));
}

const advanceTimers = async ms => {
  jest.advanceTimersByTime(ms)
  await flushPromises()
}

describe("Sequential async", () => {
  afterEach(() => {
    jest.resetAllMocks()
    jest.useRealTimers()
  })

  it("returns function response correctly", async () => {
    const callSequentially = sequential(testFunc, {waitTime: 10, retryWaitTime: 10})

    const response = await callSequentially([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])

    expect(response).toEqual([1, 2, 3, 4, 6, 7, 8, 9])
  })

  it("respects the wait time", async () => {
    jest.useFakeTimers()

    const callSequentially = sequential(testFuncNoTimeout, {waitTime: 100})

    const callSequentialFunc = callSequentially([1, 2, 3])

    expect(setTimeout).toHaveBeenCalledTimes(0)

    await advanceTimers(100)
    expect(setTimeout).toHaveBeenCalledTimes(1)

    // If we wait only 10 ms setTimeout should still be waiting
    await advanceTimers(10)
    expect(setTimeout).toHaveBeenCalledTimes(1)

    // Waiting 90 ms more, means setTimeout should be called
    await advanceTimers(90)
    expect(setTimeout).toHaveBeenCalledTimes(2)

    await advanceTimers(100)
    expect(setTimeout).toHaveBeenCalledTimes(3)

    callSequentialFunc.then(response => {
      expect(response).toEqual([1, 2, 3])
    })
  })

  it("respects random wait time", async () => {
    jest.useFakeTimers()

    const mockMath = Object.create(global.Math)
    mockMath.random = () => 1
    global.Math = mockMath

    const min = 100
    const max = 200
    const callSequentially = sequential(testFuncNoTimeout, {randomWaitTime: [min, max]})

    const callSequentialFunc = callSequentially([1, 2, 3])

    expect(setTimeout).toHaveBeenCalledTimes(0)

    await advanceTimers(max)
    expect(setTimeout).toHaveBeenCalledTimes(1)

    await advanceTimers(max)
    expect(setTimeout).toHaveBeenCalledTimes(2)

    await advanceTimers(max)
    expect(setTimeout).toHaveBeenCalledTimes(3)

    callSequentialFunc.then(response => {
      expect(response).toEqual([1, 2, 3])
    })
  })

  it("respects random wait time as boolean", async () => {
    jest.useFakeTimers()

    const mockMath = Object.create(global.Math)
    mockMath.random = () => 1
    global.Math = mockMath

    const min = 100 // defaults when using boolean
    const max = 1000 // defaults when using boolean
    const callSequentially = sequential(testFuncNoTimeout, {randomWaitTime: true})

    const callSequentialFunc = callSequentially([1, 2, 3])

    expect(setTimeout).toHaveBeenCalledTimes(0)

    await advanceTimers(max)
    expect(setTimeout).toHaveBeenCalledTimes(1)

    await advanceTimers(max)
    expect(setTimeout).toHaveBeenCalledTimes(2)

    await advanceTimers(max)
    expect(setTimeout).toHaveBeenCalledTimes(3)

    callSequentialFunc.then(response => {
      expect(response).toEqual([1, 2, 3])
    })
  })

  it("respects wait time function", async () => {
    jest.useFakeTimers()

    const waitTime = jest.fn(params => 500)
    const callSequentially = sequential(testFuncNoTimeout, {waitTime})

    const callSequentialFunc = callSequentially([1, 2, 3])

    expect(setTimeout).toHaveBeenCalledTimes(0)

    await advanceTimers(500)
    expect(setTimeout).toHaveBeenCalledTimes(1)

    await advanceTimers(500)
    expect(setTimeout).toHaveBeenCalledTimes(2)

    await advanceTimers(500)
    expect(setTimeout).toHaveBeenCalledTimes(3)

    expect(waitTime).toHaveBeenCalledTimes(3)

    callSequentialFunc.then(response => {
      expect(response).toEqual([1, 2, 3])
    })
  })

  it("respects default wait time if function returns falsy", async () => {
    jest.useFakeTimers()

    const waitTime = jest.fn(params => undefined)
    const callSequentially = sequential(testFuncNoTimeout, {waitTime})

    const callSequentialFunc = callSequentially([1, 2, 3])

    expect(setTimeout).toHaveBeenCalledTimes(0)

    await advanceTimers(100)
    expect(setTimeout).toHaveBeenCalledTimes(1)

    await advanceTimers(100)
    expect(setTimeout).toHaveBeenCalledTimes(2)

    await advanceTimers(100)
    expect(setTimeout).toHaveBeenCalledTimes(3)

    expect(waitTime).toHaveBeenCalledTimes(3)

    callSequentialFunc.then(response => {
      expect(response).toEqual([1, 2, 3])
    })
  })

  it("respects retryWaitTime", async () => {
    jest.useFakeTimers()

    const callSequentially = sequential(testFuncNoTimeout, {retryWaitTime: 100})

    const callSequentialFunc = callSequentially([5])

    expect(setTimeout).toHaveBeenCalledTimes(0)

    await advanceTimers(100)
    expect(setTimeout).toHaveBeenCalledTimes(1)

    // If we wait only 10 ms setTimeout should still be waiting
    await advanceTimers(10)
    expect(setTimeout).toHaveBeenCalledTimes(1)

    // Waiting 90 ms more, means setTimeout should be called
    await advanceTimers(90)
    expect(setTimeout).toHaveBeenCalledTimes(2)

    await advanceTimers(100)
    expect(setTimeout).toHaveBeenCalledTimes(3)

    await advanceTimers(100)
    expect(setTimeout).toHaveBeenCalledTimes(4)

    await advanceTimers(100)
    expect(setTimeout).toHaveBeenCalledTimes(5)

    callSequentialFunc.then(response => {
      expect(response).toEqual([])
    })
  })

  it("respects random retry wait time", async () => {
    jest.useFakeTimers()

    const mockMath = Object.create(global.Math)
    mockMath.random = () => 1
    global.Math = mockMath

    const min = 100 
    const max = 500
    const callSequentially = sequential(testFuncNoTimeout, {randomRetryWaitTime: [min, max]})

    const callSequentialFunc = callSequentially([5])

    expect(setTimeout).toHaveBeenCalledTimes(0)

    await advanceTimers(max)
    expect(setTimeout).toHaveBeenCalledTimes(2)

    await advanceTimers(max)
    expect(setTimeout).toHaveBeenCalledTimes(3)

    await advanceTimers(max)
    expect(setTimeout).toHaveBeenCalledTimes(4)

    await advanceTimers(max)
    expect(setTimeout).toHaveBeenCalledTimes(5)

    callSequentialFunc.then(response => {
      expect(response).toEqual([])
    })
  })

  it("respects random retry wait time when using boolean", async () => {
    jest.useFakeTimers()

    const mockMath = Object.create(global.Math)
    mockMath.random = () => 0
    global.Math = mockMath

    const min = 100 // Default
    const max = 1000 // Default
    const mockTestFunc = jest.fn(i => new Promise((resolve, reject) => {
      if (i % 5 === 0) {
        reject(new Error("Divisible by 5, this is bad"))
      }
      resolve(i)
    }))

    const callSequentially = sequential(mockTestFunc, {randomRetryWaitTime: true})

    const callSequentialFunc = callSequentially([5])

    jest.runOnlyPendingTimers()
    await flushPromises()
    expect(mockTestFunc).toHaveBeenCalledTimes(1)

    await advanceTimers(min)
    expect(mockTestFunc).toHaveBeenCalledTimes(2)

    await advanceTimers(min)
    expect(mockTestFunc).toHaveBeenCalledTimes(3)

    await advanceTimers(min)
    expect(mockTestFunc).toHaveBeenCalledTimes(4)

    await advanceTimers(min)
    expect(mockTestFunc).toHaveBeenCalledTimes(5)

    callSequentialFunc.then(response => {
      expect(response).toEqual([])
    })
  })

  it("respects retryWaitTime function", async () => {
    jest.useFakeTimers()

    const retryWaitTimeFunc = jest.fn((err, params) => 200)
    const mockTestFunc = jest.fn(i => new Promise((resolve, reject) => {
      if (i % 5 === 0) {
        reject(new Error("Divisible by 5, this is bad"))
      }
      resolve(i)
    }))
    const callSequentially = sequential(mockTestFunc, {retryWaitTime: retryWaitTimeFunc})

    const callSequentialFunc = callSequentially([5])

    jest.runOnlyPendingTimers()
    await flushPromises()
    expect(mockTestFunc).toHaveBeenCalledTimes(1)

    await advanceTimers(200)
    expect(mockTestFunc).toHaveBeenCalledTimes(2)

    await advanceTimers(200)
    expect(mockTestFunc).toHaveBeenCalledTimes(3)

    await advanceTimers(200)
    expect(mockTestFunc).toHaveBeenCalledTimes(4)

    await advanceTimers(200)
    expect(mockTestFunc).toHaveBeenCalledTimes(5)

    callSequentialFunc.then(response => {
      expect(response).toEqual([])
    })
  })

  it("uses default retry wait time if func returns falsey", async () => {
    jest.useFakeTimers()

    const retryWaitTimeFunc = jest.fn((err, params) => undefined)
    const mockTestFunc = jest.fn(i => new Promise((resolve, reject) => {
      if (i % 5 === 0) {
        reject(new Error("Divisible by 5, this is bad"))
      }
      resolve(i)
    }))
    const callSequentially = sequential(mockTestFunc, {retryWaitTime: retryWaitTimeFunc})

    const callSequentialFunc = callSequentially([5])

    jest.runOnlyPendingTimers()
    await flushPromises()
    expect(mockTestFunc).toHaveBeenCalledTimes(1)

    await advanceTimers(2000)
    expect(mockTestFunc).toHaveBeenCalledTimes(2)

    await advanceTimers(2000)
    expect(mockTestFunc).toHaveBeenCalledTimes(3)

    await advanceTimers(2000)
    expect(mockTestFunc).toHaveBeenCalledTimes(4)

    await advanceTimers(2000)
    expect(mockTestFunc).toHaveBeenCalledTimes(5)

    callSequentialFunc.then(response => {
      expect(response).toEqual([])
    })
  })

  it("retries correct amount of times", async () => {
    jest.useFakeTimers()
    const logErrorMock = jest.fn()
    const callSequentially = sequential(
      testFuncNoTimeout, 
      {waitTime: 100, retryWaitTime: 100, maxRetries: 3, logError: logErrorMock}
    )

    const callSequentialFunc = callSequentially([1, 5])

    expect(setTimeout).toHaveBeenCalledTimes(0)

    jest.clearAllTimers()
    await flushPromises()
    expect(setTimeout).toHaveBeenCalledTimes(1)

    await advanceTimers(100)
    expect(setTimeout).toHaveBeenCalledTimes(2)

    await advanceTimers(100)
    expect(setTimeout).toHaveBeenCalledTimes(3)

    await advanceTimers(100)
    expect(setTimeout).toHaveBeenCalledTimes(4)

    expect(logErrorMock.mock.calls.length).toEqual(3)

    callSequentialFunc.then(response => {
      expect(response).toEqual([1])
    })
  })

  it("continues when continueParallel is set", async () => {
    jest.useFakeTimers()
    const logErrorMock = jest.fn((func, offset, params, err) => {})
    const mockTestFunc = jest.fn(i => new Promise((resolve, reject) => {
      if (i % 5 === 0) {
        reject(new Error("Divisible by 5, this is bad"))
      }
      resolve(i)
    }))
    const callSequentially = sequential(
      mockTestFunc, 
      {waitTime: 100, retryWaitTime: 100, maxRetries: 3, continueParallel: true, logError: logErrorMock}
    )

    const callSequentialFunc = callSequentially([1, 5, 3])

    jest.runOnlyPendingTimers()
    await flushPromises()
    expect(mockTestFunc).toHaveBeenCalledTimes(1)

    await advanceTimers(100)
    expect(mockTestFunc).toHaveBeenCalledTimes(2)

    await advanceTimers(100) // 5 fails but 3 continues at same time
    expect(mockTestFunc).toHaveBeenCalledTimes(4)

    await advanceTimers(100)
    expect(mockTestFunc).toHaveBeenCalledTimes(5)

    await advanceTimers(100)
    expect(mockTestFunc).toHaveBeenCalledTimes(6)

    expect(logErrorMock).toHaveBeenCalledTimes(3)

    callSequentialFunc.then(response => {
      expect(response).toEqual([1])
    })
  })
  
  it("calls logSuccess", async () => {
    const mockLogSuccess = jest.fn((func, offset, params, response) => {})
    const callSequentially = sequential(testFunc, {waitTime: 10, logSuccess: mockLogSuccess})

    const response = await callSequentially([1, 2, 3])

    expect(response).toEqual([1, 2, 3])
    expect(mockLogSuccess.mock.calls.length).toEqual(3)
    expect(mockLogSuccess.mock.calls[0]).toEqual([testFunc, 0, 1, 1])
    expect(mockLogSuccess.mock.calls[1]).toEqual([testFunc, 1, 2, 2])
    expect(mockLogSuccess.mock.calls[2]).toEqual([testFunc, 2, 3, 3])
  })

  it("calls logFailure", async () => {
    const mockLogFailure = jest.fn((func, offset, params, err) => {})
    const callSequentially = sequential(testFunc, {retryWaitTime: 10, logFailure: mockLogFailure})

    const response = await callSequentially([5])

    expect(response).toEqual([])
    expect(mockLogFailure.mock.calls.length).toEqual(1)
    expect(mockLogFailure.mock.calls[0]).toEqual([testFunc, 0, 5, new Error("Divisible by 5, this is bad")])
  })

  it("accepts multiple params", async () => {
    const testfuncMultipleParams = (a,b,c) => {
      return new Promise(resolve => {
        resolve(c)
      })
    }
    const callSequentially = sequential(testfuncMultipleParams, {waitTime: 10})

    const response = await callSequentially([[1,2,3], [4,5,6], [7,8,9]])

    expect(response).toEqual([3, 6, 9])
  })

  it("accepts array params", async () => {
    const testfuncArray = arr => {
      return new Promise(resolve => {
        resolve(arr)
      })
    }
    const callSequentially = sequential(testfuncArray, {waitTime: 10})

    const response = await callSequentially([[[1,2,3]], [[4,5,6]], [[7,8,9]]])

    expect(response).toEqual([[1,2,3], [4,5,6], [7,8,9]])
  })
})