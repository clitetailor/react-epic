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

Now, its time to answer each question, one by one. The first question: how to register the ajax call:

```jsx
const fetchApi = api => ajax.get(api)

const todos$ = new BehaviorSubject([])
const refetchTodos$ = new Subject()

refetchTodos$
  .pipe(
    throttle(1000),
    switchMap(() => fetchApi('/todo'))
  )
  .subscribe(todos$)
```

What if we want some enhancements. For example, any ajax call need to be throttle 1s before it's called:

```jsx
const fetchApi = api => ajax.get(api)

const todos$ = new BehaviorSubject([])
const refetchTodos$ = new Subject()
refetchTodos.subscribe(todos$)

const refetchAccount$ = new Subject()

const register$ = new Subject()
register$.pipe(throttle(1000)).subscribe(action => action())

register$.next(refetchTodos$.next.bind(refetchTodos$))
register$.next(refetchAccount$.next.bind(refetchAccount$))
```
