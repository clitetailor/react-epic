# Execution Context: Stream vs Function

Sometimes when you try to implement a simple ajax method, you might find yourself in a situation. You don't know how to register the ajax call correctly or whether to register it locally or globally:

```jsx
const refetchTodos = () => ajax.get('/todos')
```

In this chapter, We will show you about the technique and how to use it efficently.

## The different between Stream and Function

In RxJS, we use stream so frequently that we always try to convert a function into a stream. But the main different between a Stream and a Function we may not really know. To illustrate the differences, we have a small example:

```jsx
const subscription = combineLastest(input1$, input2$, input3).pipe(
  /* Operators */
).subscribe(output$)

function (input1, input2, input3) {
  /* Instructions */
  return output
}
```

So as we see, there are two main differences between a stream and a function:

- The sources and the targets of a stream are usually explicit. In constrast, the inputs and the outputs of a function are arbitrary.
- A function is lazy, it only execute correctly if all its input informations have been filled in. Meanwhile, stream is reactive, only one of its sources need to be changed to trigger the stream change.

It means that when a stream has already been declared, it's unlikely to change its input and output sources. But a function is different, it will be called once at a time on different inputs and different outputs.

Another explanation is: The technique of RxJS is to execute a set of functions repeatly on different inputs and outputs. To do this, we need to lock the input and the output sources of a stream.

In summary, function is lazy and stream is reactive. Depend on what we need that we decide to use stream or function.

## The transition between Function and Stream

A stream is not totaly reactive. I has to be lazy at some point. For example a subject only emit a value when someone call `next`. To illustrate here is the diagram:

```text
function ---> function --> subject.next --> operators --> subscribe -->   function
\----------v---------/     \               \----v----/            /     \----v-----/
   function context         \           function context         /    function context
                             \------------------v---------------/
                                          stream context
```

## Convert a Function to RxJS style

There're two thing we have to notice about a function. One is its declaration. The second is how to call it.

```jsx
// Function declaration
function myFunction(input1, input2, input3, input4) {
  /* Instructions */
  return output
}

// Function call
const var5 = myFunction(var1, var2, var3, var4)
```

It's the same method works with stream. For a stream, We will also need a stream declaration and a way to trigger that stream runs.

```jsx
// Stream declaration
input1$
  .pipe(
    switchMap(input1 =>
      input2$.pipe(map(operator.bind(null.input1)))
    )
  )
  .subscribe(output$)

// Trigger stream runs
input1$.next(var1)
input2$.next(var2)
```

## Nested Function Call / Nested Stream Triggering / Nest Stream Function Call

One of the most powerful feature is higher-order-function. With higher-order-function, we can perform much more higher level of logic.

```jsx
function higherFunction(someFunction) {
  return someFunction()
}
```

In RxJS, we can do the same thing with Subject:

```jsx
const register$ = new Subject()
register$.subscribe(action$ => action$.next())

register$.next(action1$)
```

We can also have mix the benefit of both function and stream together:

```jsx
const register$ = new Subject()
register$.pipe(throttle(1000)).subscribe(someFunction => {
  output$.next(someFunction())
})

register$.next(action)
```

## Examples

The first example, we will recap the way we make an ajax call. Using function only, here is what we got:

```jsx
const todos = []

// Function declaration
refetchTodo() {
  fetch('/todos').then(newTodos => {
    todos = newTodos
  })
}

// Function call
refetchTodo()
```

Translate it to RxJS, then we got:

```jsx
const fetchApi = api => ajax.get(api)

const todos$ = new BehaviorSubject([])
const refetchTodos$ = new Subject()

// Declaring the stream
refetchTodos$
  .pipe(
    throttle(1000),
    switchMap(() => fetchApi('/todo'))
  )
  .subscribe(todos$)

// Trigger stream runs
refetchTodos$.next()
```

The second example is about process queue. Imagine here is how our process queue works:

```jsx
const queue = []
let timeout = null

// Function declarations
function processQueue() {
  if (!timeout && queue.length) {
    queue.shift()() // Nested function call

    timeout = setTimeout(() => {
      timeout = null
      processQueue()
    }, 1000)
  }
}

function queuePush(func) {
  queue.push(func)
  processQueue()
}

function register(func) {
  queuePush(func)
}

// Function calls
register(fetchTodos)
register(processTodos)
register(addTodo)
```

```jsx
// Stream declaration
const register$ = new Subject()
register$.pipe(throttle(1000)).subscribe(stream => {
  stream.next() // Nested stream trigger
})

// Trigger stream runs
register$.next(refetchTodos$)
register$.next(processTodos$)
register$.next(addTodo$)
```

The third example is quite tricky. The third example is about how to lock some background tasks when some modal is being shown:

```jsx
let lock = false

// Function declarations
function performBackgroundTask(task) {
  if (!lock) {
    task()
  }
}

function openModal() {
  lock = true
}

function closeModal() {
  lock = false
}

openModal()
performBackgroundTask(playVideo)
```

Here is how we define it in RxJS:

```jsx
const lock$ = merge(
  of(false),
  openModal$.pipe(mapTo(true)),
  closeModal$.pipe(mapTo(false))
)

const backgroundTask$ = new Subject()

lock$
  .pipe(
    switchMap(lock =>
      backgroundTask$.pipe(takeWhile(() => !lock))
    )
  )
  .subscribe(task => task())

openModal$.next()
backgroundTask$.next(playVideo)
```
