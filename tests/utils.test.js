const {
  getHash,
  getRandomIn,
  callInMs,
  getParams,
} = require("../src/utils")

describe("getHash", () => {
  it("valid for strings", () => {
    expect(typeof getHash("abc")).toBe("string")
    expect(typeof getHash("")).toBe("string")
    expect(typeof getHash("test 123 \n abc \n123")).toBe("string")
  })

  it("valid for numbers", () => {
    expect(typeof getHash(123)).toBe("string")
    expect(typeof getHash(-123)).toBe("string")
    expect(typeof getHash(0)).toBe("string")
    expect(typeof getHash(10000000000000000)).toBe("string")
  })

  it("valid for booleans", () => {
    expect(typeof getHash(true)).toBe("string")
    expect(typeof getHash(false)).toBe("string")
  })

  it("valid for arrays", () => {
    expect(typeof getHash([1,2,3])).toBe("string")
    expect(typeof getHash(["1", "2", "3"])).toBe("string")
    expect(typeof getHash([[1,2,3], [2,3], [999, 222]])).toBe("string")
    expect(typeof getHash([1,2,3])).toBe("string")
  })

  it("valid for objects", () => {
    expect(typeof getHash({a: 2, b: 6, c: 3})).toBe("string")
    expect(typeof getHash({a: "2", b: "6", c: "3"})).toBe("string")
    expect(typeof getHash({a: [1, 2], b: [6, 7], c: [3, 7]})).toBe("string")
    expect(typeof getHash({a: {aa: "b"}, b: {c: 6}, c: {d: 3}})).toBe("string")
  })

  it("valid for undefined, null", () => {
    expect(typeof getHash(null)).toBe("string")
    expect(typeof getHash(undefined)).toBe("string")
    expect(typeof getHash(NaN)).toBe("string")
    expect(typeof getHash()).toBe("string")
  })
})

describe("getRandomIn", () => {
  it("returns at minimum the min value", () => {
    const mockMath = Object.create(global.Math)
    mockMath.random = () => 0
    global.Math = mockMath

    const min = 100
    const max = 500
    expect(getRandomIn(min, max)).toEqual(min)
  })

  it("returns at maximum the max value", () => {
    const mockMath = Object.create(global.Math)
    mockMath.random = () => 1
    global.Math = mockMath

    const min = 100
    const max = 500
    expect(getRandomIn(min, max)).toEqual(max)
  })

  it("returns value between min and max", () => {
    const mockMath = Object.create(global.Math)
    mockMath.random = () => 0.5
    global.Math = mockMath

    const min = 100
    const max = 500
    expect(getRandomIn(min, max)).toEqual(min + ((max - min) * 0.5))
  })
})

describe("getParams", () => {
  it("returns array if not array", () => {
    expect(getParams("abc")).toEqual(["abc"])
    expect(getParams(1)).toEqual([1])
    expect(getParams({a: 2, b: 3})).toEqual([{a: 2, b: 3}])
  })

  it("returns params unchanged if already array", () => {
    expect(getParams(["abc"])).toEqual(["abc"])
    expect(getParams([1])).toEqual([1])
    expect(getParams([{a: 2, b: 3}])).toEqual([{a: 2, b: 3}])
  })

  it("returns array of arrays unchanged", () => {
    expect(getParams([["abc"]])).toEqual([["abc"]])
    expect(getParams([[1], [2, 3]])).toEqual([[1], [2, 3]])
    expect(getParams([[{a: 2, b: 3}, {d: 6}], [{bb: 2}]])).toEqual([[{a: 2, b: 3}, {d: 6}], [{bb: 2}]])
  })
})

describe("callInMs", () => {
  it("calls function in provided waitTime", () => {
    jest.useFakeTimers()
    const mockFunc = jest.fn()
    const waitTime = 500
    
    const call = callInMs(mockFunc, waitTime)

    expect(mockFunc).toHaveBeenCalledTimes(0)

    call("abc")

    jest.advanceTimersByTime(300)

    expect(mockFunc).toHaveBeenCalledTimes(0)

    jest.advanceTimersByTime(200)

    expect(mockFunc).toHaveBeenCalledTimes(1)
  })

  it("calls function with provided args", () => {
    jest.useFakeTimers()
    const mockFunc = jest.fn()
    const waitTime = 500
    
    const call = callInMs(mockFunc, waitTime)

    expect(mockFunc).toHaveBeenCalledTimes(0)

    call("abc", "test")

    jest.advanceTimersByTime(500)

    expect(mockFunc).toHaveBeenCalledTimes(1)
    expect(mockFunc).toHaveBeenCalledWith("abc", "test")
  })
})