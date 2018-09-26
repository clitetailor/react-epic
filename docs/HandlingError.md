# Handling Error

The fact is if there is any of your stream breakdown with an error, the whole system can go wrong. Here is a simple example of how your system can go down hopelessly without any expectation:

```jsx
number$.pipe(
  map(number => 10 / number) // throw Division by Zero
).subscribe(...)
```

That why handling error is so important in RxJS. Sadly, I haven't found any global way to declare error handler in React Epic. So in a long run, we have to handle error manually:

```jsx
number$.pipe(
  map(number => 10 / number),
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

We can take the advantage of the technique. For example, when an ajax request fails, you can delay it for 5 minute before the request stream can be reset:

```jsx
const errorHandler = catchError((err, resetStream) => {
  return of(delay(5 * 60000)).pipe(concat(resetStream))
})
```

However, I will say that even error handler can be failed and the line of handling error or is quite blurry sometimes. So make sure that you added an error handler and not overthinking how to handle the error!

Next Chapter: [Common Mistakes](CommonMistakes.md)

To top: [Table of Contents](Wiki.md)
