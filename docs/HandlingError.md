# Handling Error

The fact is if there is any of your stream breakdown with an error, the whole system can go wrong. Here is a simple example of how your system can go down hopelessly without any expectation:

```jsx
function divide(a, b) {
  if (b === 0) {
    /**
     * Just for example. Which might return Infinity in reality for
     * the sake of JS god.
     */
    throw new Error('Division by Zero')
  }
  return 10 / b
}

number$.pipe(
  map(number => divide(1, number))
).subscribe(...)
```

That why handling error is so important in RxJS. Sadly, I haven't found any global way to declare error handler in React Epic. So in a long run, we have to handle error manually:

```jsx
number$.pipe(
  map(number => divide(1, number)),
  errorHandler
).subscribe(...)
```

But handling errors the wrong way can be troublesome:

```jsx
const errorHandler = catchError(err => {
  // Reporting the error then emit it
  return of(err)
})
```

In the above example, everything is fine. Except, the stream will be suspended and cannot resume if any exception is thrown at runtime. Here is the reason why. As usual you will type:

```jsx
return of(err)
```

without understanding how it works. By that way, you replace the current stream with a stream of the error object you handle. That's why the stream will be freezed after you handle the first error. At the time i write this post, the document about RxJS `catchError` operator already been written, but haven't been deployed yet, so a lot of people failed at how to handle error in RxJS.

So here is a simple work around on how to handle the error in RxJS:

```jsx
const errorHandler = catchError((err, resetStream) => {
  /**
   * Reporting the error, then return the fallback value if there's any.
   * Finally resume the stream.
   */
  return of(fallbackValue).pipe(concat(resetStream))
})
```

But using this way, we can not reset the state of the stream if we plan to use `scan` or `throttle`. So the way to deal with `catchError` without interfere the source stream is to lift the stream into nested stream using `mergeMap`:

```jsx
source.pipe(
  throttle(1000),
  mergeMap(x =>
    of(x).pipe(
      map(x => divide(1, x)),
      catchError(err => {
        // Report the error and return the fallback value
        return of(0)
      })
    )
  )
)
```

However, the first case is still clean if we don't plan to store any state in the stream but still keep the stream flat.

For a conclusion, I will say that even error handler can be failed and the line of handling error or is quite blurry sometimes. So make sure that you added an error handler and not overthinking how to handle the error!

Next Chapter: [Common Mistakes](CommonMistakes.md)

To top: [Table of Contents](Wiki.md)
