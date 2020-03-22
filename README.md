# Sequu
Sequu is a package to make calling a function sequentially easier. It includes thing like retries and custom wait times. For example let's say you need to fetch data with 100 different parameters, and you want to not get e.g. rate-limited or otherwise wait a bit before calling the next function. You can use Sequu to call the function sequentially with your data and wait 100 ms everytyime in between, and let's say 2 of your calls fail, Sequu will automatically retry those.


# Example

```javascript
const sequu = require("sequu")

const testFunc = i => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (i % 5 === 0) {
        reject(new Error("Divisible by 5, this is bad"))
      }
      resolve(order)
    }, 10)
  }) 
}

const callSequentially = sequu(testFunc, {waitTime: 200})
callSequentially([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  .then(response => {
    console.log(response) // [1, 2, 3, 4, 6, 7, 8, 9]
  })
```

# Documentation

## API

`sequu(functionToCall: Function, options: Object) => func(params: Array) => Promise`
> Returns a function that you should call with the params for each individual call. For example if your function is console.log and you want to call it with "abc", "test", "123" you would call the function with ["abc", "test", "123"]. Calling the second function returns a promise that will be resolved when all calls have succeeded or all retries have been exhausted. The resolve value will contain the individual responses as an array.

> Func can be any function, if it's a synchronous function you should pass `async: false` in the options.

#### Simple examples
```javascript
// Calls `fetch` with "https://example.com", "https://google.com" every 500 ms, and in case of failure waits 2000 ms, and retries maximum of three times
const fetchSequentially = sequu(fetch, {waitTime: 500, retryWaitTime: 2000, maxRetries: 3})
fetchSequentially(["https://example.com", "https://google.com"])
    .then(responses => {
        // Do something with responses
    })
```

```javascript
// Calls `console.log` with "abc", "test", "123" every 200 ms
const logSequentially = sequu(console.log, {waitTime: 200, async: false})
logSequentially(["abc", "test", "123"])
  .then(responses => {
    // For sync functions this will contain the responses as well
  })
```

### Options

| Name             | Description           | Valid Types  | Default value |
| -----------------|:----------------------|:-------------| :-------------|
| `async`            | If you pass in a synchronous function this should be set to false. Otherwise it should be true. | boolean | `true` |
| `waitTime`         | How long sequu should wait between calls, in milliseconds | int or function ((params: any) => int) | `100` |
| `retryWaitTime`    | How long sequu should wait between retries, in milliseconds | int or function ((err: Error, params: any) => int) | `2000` |
| `maxRetries`       | How many times individual function call will be retried | int | `5` |
| `randomWaitTime`   | Random wait time between min and max, or if true wait time will be between 100, 1000 | boolean or array [min: int, max: int] | `false` |
| `randomRetryTime`  | Random wait time between min and max, or if true wait time will be between 100, 1000 | boolean or array [min: int, max: int] | `false` |
| `continueParallel` | If set to true, and in case of failure sequu will continue to the next call, and run retries in parallel. If set to false sequu will wait for retry to complete or exhaust maxRetries | boolean | `false` |
| `loggingEnabled`   | Should sequu call the log function. NOTE: this doesn't affect any of the the logError, logSuccess, and logFailure functions that you pass in | boolean | `false` |
| `log`              | This will be called for all logging | function (msg: string => void) | `console.log` |
| `logError`         | This will be called whenever any function call fails. This will be called for each individual error/retry | (func: function, offset: int, params: any, err: Error) => void | `customFunc` |
| `logSuccess`       | This will be called when individual function call succeeds | (func: function, offset: int, params: any, response: any) => void | `customFunc` |
| `logFailure`       | This will be called when max retries are exceeded for an individual function call | (func: function, offset: int, params: any) => void | `customFunc` |
