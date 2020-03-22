const getHash = data => {
  return data === undefined
    ? "undefined"
    : JSON.stringify(data)
}

const getRandomIn = (min, max) => (
  min + (Math.round(Math.random() * (max - min)))
)

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

module.exports = {
  getHash,
  getRandomIn,
  callInMs,
  getParams,
}