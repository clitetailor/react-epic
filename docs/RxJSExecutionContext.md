# Execution Context in RxJS

Sometimes when you try to implement a simple ajax method, you might find yourself in a situation. You don't know how to register the ajax call correctly or whether to register it locally or globally:

```jsx
const refetchTodos = () => ajax.get('/todos')
```

In this chapter, We will show you about the technique and how to use it efficently.

## The Mechanism

Before i show you how to apply the techique of Execution Context into RxJS. I will guild you to the mechanical of Execution Context using Function first. This is a small demonstration:

```jsx
function first(input1, input2, input3, input4) {
  // This is the execution context of the function first
}
```

I will call it the first-order function. You might have an ideal, what if you can put a execution context into another execution context:

```jsx
function second(input1, input2, input3, input4) {
  // This is the execution context of the second function
  return first(input1, input2, input3, input4) // Execute another context
}
```

So how Function and RxJS can be similar to each other. Here is an example of how a function declaration looks like in RxJS:

```jsx
combineLastest(input1$, input2$, input3$, input4$)
  .pipe(...instructions)
  .subscribe(output$)
```

But the way we make a function call is quite different. The function is called whenever one of its input is dispatched:

```jsx
input1$.next(value1)
input2$.next(value2)
```

And the way they return is different too:

```jsx
subscribe(output$)

subscribe(ouput => {
  /* ... */
})
```

One more thing you may need to know is how to make a nesting function call. First, you need to pass a function into another function:

```jsx
// Function style
second(first)

// RxJS style
second$.next(first$)
```

And then we run it by calling it inside its wrapper:

```jsx
// Function style
function second(first) {
  first()
}

// RxJS style
second$.subscribe(first$ => {
  first$.next()
})
```

## Examples

One of the most important thing you need to know is how to apply Execution Context technique into your situation and how to do that. So in the first problem, it's very easy if you want to register the function locally:

```jsx
// Function declaration
first$.pipe(mergeMap(() => ajax.get('/api'))).subscribe(state$)

// Second is to make a function call
first$.next(value)
```

So how do we register it globally. To describe the use case, here is a problem for example. If you want that every ajax call need to be throttled for 5 seconds before you can make a new ajax. You may do something like this:

```jsx
let processQueue = []

function registerAjaxCall(ajax) {
  processQueue.push(ajax)
}

setInterval(() => {
  if (processQueue.length) {
    processQueue.shift()()
  }
}, 5000)

function getApi() {
  ajax.get('/api').then(output => {
    /* ... */
  })
}

registerAjaxCall(getApi)
```

The same thing will work with RxJS:

```jsx
let queue = new Subject()
queue.pipe(throttle(5000)).subscribe(output => output.next())

let getApi = new Subject()
getApi
  .pipe(mergeMap(() => ajax.get('/api')))
  .subscribe(output => {
    /* ... */
  })

queue.next(getApi)
```

That is much more simpler!

## Resource Coordination

The above example is just one technique to lock down on resource. There's another example i can show you:

```jsx
function second(first) {
  static lock = false
  if (lock === false) {
    lock = true
    first()
    lock = false
  } else {
    return
  }

  // Perform alternative tasks
}
```

So that when the `first` is being called, the `second` can not be called again (recursive call for example) until the `first` release the resources. You know this might never happen in JS but this might happen in RxJS. For example, when you switch to a new tab, the context now is that new tab. But when open the modal, you want that every events on the tab need to be locked until the modal is closed. How do you stimulate that model?

The solution is to use `skipWhile` or `takeWhile` because it works the same way with `if`:

```jsx
let lock = false

second.pipe(skipWhile(() => lock)).subscribe(first => {
  lock = true
  first.next()
  lock = false
})
```

For the modal example, your implementation can be more specific:

```jsx
const lock = merge(
  openModal.pipe(mapTo(true)),
  closeModal.pipe(mapTo(false))
)

lock
  .pipe(
    switchMap(_lock => tabEvent.pipe(skipWhile(() => _lock)))
  )
  .subscribe(_tabEvent => {
    /* ... */
  })
```
