const sequential = require("../")

const testFuncSync = i => {
  if (i % 5 === 0) {
    throw new Error("Divisible by 5, this is bad")
  }
  return i
}

describe("Sequential sync", () => {
  afterEach(() => {
    jest.resetAllMocks()
    jest.useRealTimers()
  })

  it("returns function response correctly", async () => {
    const callSequentially = sequential(testFuncSync, {async: false, waitTime: 10, retryWaitTime: 10})

    const response = await callSequentially([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])

    expect(response).toEqual([1, 2, 3, 4, 6, 7, 8, 9])
  })

  it("respects the wait time", async () => {
    jest.useFakeTimers()

    const callSequentially = sequential(testFuncSync, {async: false, waitTime: 100})

    const callSequentialFunc = callSequentially([1, 2, 3])

    // It calls next immediately because of no promise wait
    expect(setTimeout).toHaveBeenCalledTimes(1)

    jest.runOnlyPendingTimers()
    expect(setTimeout).toHaveBeenCalledTimes(2)

    // If we wait only 10 ms setTimeout should still be waiting
    jest.advanceTimersByTime(10)
    expect(setTimeout).toHaveBeenCalledTimes(2)

    // Waiting 90 ms more, means setTimeout should be called
    jest.advanceTimersByTime(90)
    expect(setTimeout).toHaveBeenCalledTimes(3)

    callSequentialFunc.then(response => {
      expect(response).toEqual([1, 2, 3])
    })
  })

  it("respects retryWaitTime", async () => {
    jest.useFakeTimers()

    const callSequentially = sequential(testFuncSync, {async: false, retryWaitTime: 100})

    const callSequentialFunc = callSequentially([5])

    // It calls next immediately because of no promise wait
    expect(setTimeout).toHaveBeenCalledTimes(1)

    jest.runOnlyPendingTimers() // Reset the timers
    expect(setTimeout).toHaveBeenCalledTimes(2)

    // If we wait only 10 ms setTimeout should still be waiting
    jest.advanceTimersByTime(10)
    expect(setTimeout).toHaveBeenCalledTimes(2)

    // Waiting 90 ms more, means setTimeout should be called
    jest.advanceTimersByTime(90)
    expect(setTimeout).toHaveBeenCalledTimes(3)

    jest.advanceTimersByTime(100)
    expect(setTimeout).toHaveBeenCalledTimes(4)

    jest.advanceTimersByTime(100)
    expect(setTimeout).toHaveBeenCalledTimes(5)

    callSequentialFunc.then(response => {
      expect(response).toEqual([])
    })
  })

  it("retries correct amount of times", async () => {
    jest.useFakeTimers()
    const logErrorMock = jest.fn()
    const mockTestFuncSync = jest.fn(x => testFuncSync(x))
    const callSequentially = sequential(
      mockTestFuncSync, 
      {async: false, waitTime: 100, retryWaitTime: 100, maxRetries: 3, logError: logErrorMock}
    )

    const callSequentialFunc = callSequentially([1, 5])

    // It calls next immediately because of no promise wait
    expect(mockTestFuncSync).toHaveBeenCalledTimes(1)

    jest.advanceTimersByTime(100)
    expect(mockTestFuncSync).toHaveBeenCalledTimes(2)

    jest.advanceTimersByTime(100)
    expect(mockTestFuncSync).toHaveBeenCalledTimes(3)

    jest.advanceTimersByTime(100)
    expect(mockTestFuncSync).toHaveBeenCalledTimes(4)

    expect(logErrorMock.mock.calls.length).toEqual(3)

    callSequentialFunc.then(response => {
      expect(response).toEqual([1, undefined]) // mock fucn returns undefined always
    })
  })

  it("continues when continueParallel is set", async () => {
    jest.useFakeTimers()
    const logErrorMock = jest.fn()
    const mockTestFuncSync = jest.fn(x => testFuncSync(x))
    const callSequentially = sequential(
      mockTestFuncSync, 
      {async: false, waitTime: 100, retryWaitTime: 1000, maxRetries: 3, continueParallel: true, logError: logErrorMock}
    )

    const callSequentialFunc = callSequentially([1, 5, 3])

     // It calls next immediately because of no promise wait
    expect(mockTestFuncSync).toHaveBeenCalledTimes(1)

    jest.runOnlyPendingTimers()
    expect(mockTestFuncSync).toHaveBeenCalledTimes(2) // 5 and 3 running at the same time

    jest.advanceTimersByTime(100) // 5 fails again
    expect(mockTestFuncSync).toHaveBeenCalledTimes(3)

    jest.advanceTimersByTime(100)
    expect(mockTestFuncSync).toHaveBeenCalledTimes(3)

    jest.advanceTimersByTime(800)
    expect(mockTestFuncSync).toHaveBeenCalledTimes(4)

    jest.advanceTimersByTime(1000)
    expect(mockTestFuncSync).toHaveBeenCalledTimes(5)


    expect(logErrorMock.mock.calls.length).toEqual(3)

    callSequentialFunc.then(response => {
      expect(response).toEqual([1])
    })
  })
  
  it("calls logSuccess", async () => {
    const mockLogSuccess = jest.fn((func, offset, params, response) => {})
    const callSequentially = sequential(testFuncSync, {async: false, waitTime: 10, logSuccess: mockLogSuccess})

    const response = await callSequentially([1, 2, 3])

    expect(response).toEqual([1, 2, 3])
    expect(mockLogSuccess).toHaveBeenCalledTimes(3)
    expect(mockLogSuccess.mock.calls[0]).toEqual([testFuncSync, 0, 1, 1])
    expect(mockLogSuccess.mock.calls[1]).toEqual([testFuncSync, 1, 2, 2])
    expect(mockLogSuccess.mock.calls[2]).toEqual([testFuncSync, 2, 3, 3])
  })

  it("calls logFailure", async () => {
    const mockLogFailure = jest.fn((func, offset, params, response) => {})
    const callSequentially = sequential(testFuncSync, {async: false, retryWaitTime: 10, logFailure: mockLogFailure})

    const response = await callSequentially([5])

    expect(response).toEqual([])
    expect(mockLogFailure).toHaveBeenCalledTimes(1)
    expect(mockLogFailure.mock.calls[0]).toEqual([testFuncSync, 0, 5, new Error("Divisible by 5, this is bad")])
  })

  it("accepts multiple params", async () => {
    const testfuncMultipleParams = (a,b,c) => {
      return c
    }
    const callSequentially = sequential(testfuncMultipleParams, {async: false, waitTime: 10})

    const response = await callSequentially([[1,2,3], [4,5,6], [7,8,9]])

    expect(response).toEqual([3, 6, 9])
  })

  it("accepts array params", async () => {
    const testfuncArray = arr => {
      return arr
    }
    const callSequentially = sequential(testfuncArray, {async: false, waitTime: 10})

    const response = await callSequentially([[[1,2,3]], [[4,5,6]], [[7,8,9]]])

    expect(response).toEqual([[1,2,3], [4,5,6], [7,8,9]])
  })
})