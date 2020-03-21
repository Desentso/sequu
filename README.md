# Sequential
Sequential is a package to make calling a function sequentially easier. It includes thing like retries and custom wait times. For example let's say you need to fetch data with 100 different parameters, and you want to not get e.g. rate-limited or otherwise wait a bit before calling the next function. You can use sequential to call the function sequentially with your data and wait 100 ms everytyime in between, and let's say 2 of your calls fail, sequential will automatically retry those.


# Example

```javascript
const sequential = require("sequential")

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

const callSequentially = sequential(testFunc, {waitTime: 200})
callSequentially([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  .then(response => {
    console.log(response) // [1, 2, 3, 4, 6, 7, 8, 9]
  })
```

# Documentation


