# Handling Error

The fact is if there is any of your stream breakdown with an error, the whole system can be going wrong. Here is a simple example of how your system can going down hopelessly without any expectation:

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

In the above example, everything was fine. Except, the stream will be suspended and cannot be reset it if any exception is thrown. Here is the reason why. When you type:

```jsx
return of(err)
```

You replace the current stream with a stream of an error object. That's why the stream break down and freezed. At the time i write this post. The RxJS `catchError` operator already been written, but haven't been deployed yet, so a lot of people failed at handling errors in RxJS. 

So here is a simple work around on how to handle the error in RxJS:

```jsx
const errorHandler = catchError((err, resetStream) => {
  /**
   * Reporting the error, then return the fallback value if there's any.
   * Finally reset the stream.
   */
  return of(fallbackValue).pipe(concat(resetStream))
})
```

We can take the advantage of the technique. For example, when the ajax request failed, you can delay it for 5 minute before the request stream can be reset:

```jsx
const errorHandler = catchError((err, resetStream) => {
  return of(delay(5 * 60000)).pipe(concat(resetStream))
})
```

However, even error handler can be failed. So make sure that you are not overthinking of how handling error work!

Next: [React Epic Breakdown Cookbook](BreakdownCookbook.md)
