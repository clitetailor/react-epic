# Lift Behind the Scene

After several chapters of Getting Started and React Epic in Action, you might wonder why there's another chapter on what the `lift` function is and how it works.

The fact that we have discussed and use `lift` operator so frequent that we haven't have chance to take a look back and breakdown on what `lift` operator really is. So here is how we start:

My first ideal of the `lift` function is simple, is to create a function for lifting the pure logic functions into RxJS. So i come up with two functions without actually knowing clearly how it works:

```jsx
function lift(func) {
  return (...args$) =>
    combineLatest(...args$).pipe(map(args => func(...args)))
}

function lift(func) {
  return (...args$, lastArg$) => {
    const lastFunc = (...accumArgs) => lastArg$.pipe(
      map(lastArg => func(...accumArgs, lastArg))
    )

    return args$.reduce(
      (accumFunc, nextArg$) => accumArgs => nextArg$.pipe(
        switchMap(nextArg => accumFunc(...accumArgs, nextArg))
      ),
      lastFunc
    )([])
  }
}
```

I know, the second lift is so miraculous. But it can not against the fact that the second is the correct one for my situation. You may question me why.

The fact is both of the lift functions have their point of view about how a lifted function should be. To take a look closer, let consider an example of three arguments functions:

```jsx
function lift(func) {
  return (arg1$, arg2$, arg3$) =>
    combineLatest(arg1$, arg2$, arg3$).pipe(
      map(args => func(...args))
    )
}

function lift(func) {
  return (arg1$, arg2$, arg3$) =>
    arg1$.pipe(
      switchMap(arg1 =>
        arg2$.pipe(
          switchMap(arg2 =>
            arg3$.pipe(map(arg3 => func(arg1, arg2, arg3)))
          )
        )
      )
    )
}
```

What is the different between `combineLatest` and the combination of `switchMap` and `map`. Why we only run `map` on the last argument?

So i take more time investigate deeper into the effect of these three functions and the result is fantasy. `combineLatest` will emit everytime any of these arguments emits a value. So i will consider it's fully dynamic. What about `switchMap` and `map`? I consider `switchMap` is static and `map` is dynamic. This may a little bit tricky against the fact that `switchMap` changes everytime its argument emits a value. Consider the following example:

```jsx
todos$
  .pipe(
    switchMap(todos =>
      addTodo$.pipe(map(newTodo => todos.concat([newTodo])))
    )
  )
  .subscribe(todos$)
```

People usually tends to be tricked into the ideal that this is a loop. But it doesn't.

I will tell you something. The change doesn't result in emitting values. In another word, it tell the stream that arg1 and arg2 has changed but does not emit values. The real stream that emits values comes from arg3. That why i consider `switchMap` is static and `map` is dynamic.

So why does this important. If you notice, the above pattern of `todos` and `addTodo` will stretch across all other state machine pattern. What is the state machine pattern formally? And if you have another notice, why we have two nesting `switchMap` in the three argument example?

The fact is in the offical implementation of lift function there're only two arguments:

```jsx
function lift(func) {
  return (arg1$, arg2$) =>
    arg1$.pipe(
      switchMap(arg1 =>
        arg2$.pipe(map(arg2 => func(arg1, arg2)))
      )
    )
}
```

If you notice, we don't care how many nesting `switchMap` are there, the final result will only depend on the last argument. The same think works with `map` (You can have multiple nested `map` either). So how to compact it? It's easy:

```jsx
combineLatest(arg1$, arg2$).pipe(
  switchMap(([arg1, arg2]) =>
    arg3$.pipe(map(arg3 => func(arg1, arg2, arg3)))
  )
)
```

So the final form will only contain two arguments. And if you have three or more arguments, depends on which argument that emits values, we can combine them together! For example:

```jsx
const liftedOperator = lift(someOperator)

liftedOperator(
  combineLatest(arg1$, arg2$),
  combineLatest(arg3$, arg4$)
)
```

To make you better understand of how it works, i will better rewrite its implementation with **Ninja Comments**:

```jsx
function lift(reducer) {
  return (state$, action$) =>
    state$.pipe(
      switchMap(state =>
        action$.pipe(map(action => reducer(state, action)))
      )
    )
}
```

Huh, what the heck! This sounds familiar! 🤔 Does it reminds you of Redux? Are you missing something? The fact is that all application implementations consist of two things: the app own state and the external actions (or outer event space). The fact, it's not remind me of Redux but Haskell State. I have had a hard time taking deep investigation into Haskell State and don't understand anything about how it works and why it even exists! Then i come up with one diagram that helps me a bit about understading it:

```
                   -> state1
runState --->     /          \
                 /            v
              state4        state2
                 ^           /
getState <---     \         /
                   state3 <-
```

Haskell states run inside a closure (a state loop), `runState` project values and actions into state loop. It triggers the state change, toggle between states. And finally, with some kind of magical way, `getState` project the state value out of the loop.

So if i'm not wrong, the lift function works the same way with `runState` (Please correct me if i'm wrong). So if you don't might, i will translate the following piece of code:

```jsx
addTodo$.next('Have a breakfast')
addTodo$.next('Go to school')
saveTodos$.next()
```

Into Haskell implementation:

```haskell
do
  todos <- state
  todos `addTodo` "Have a breakfast"
  todos `addTodo` "Go to school"
  saveTodo todos
  pure (todos)
```

Actually you will see i embedded state and action arguments into lift for convenient somewhere in my document. The real meaning of these is an operator always comes with an event source and i want to lift the operator into RxJS Subject than a noraml RxJS operator. If you wonder, the lift function is smart so that writing the lift function in the both ways are valid:

```jsx
lift(state$, action$, operator)

const RxJSOperator = lift(operator)
```

There's only one caveat is this might lead to the inconsistency of your source code. So the best recommendation is to use the embedded version all the time and only use the original semantic version when necessary.

## More on State and Actions

"Don't use lift operator if you don't really know what it does". Just kidding, we have so far discuss and use `lift` so frequent in our document but our app still looks good and works like a charm. But what i wanna tell you is different. What i want to tell you is not whether your app works fine or not, but how much you understand about the architecture **behind the scene** of the lift operator **behind your app**. For example:

```jsx
const clock$ = interval(1000)
```

Is it even considered a state by the way? What the state really is? You often see that that output of the reducer (a state and an action) is a state (not an action) Why? Because our intuition says that state is static and action is dynamic so that the result should be dynamic? Should we put the result of an reducer into another reducer? If yes so where should we put it into? The state or the action?

It looks like the question the sum of an odd number and an even number is an odd and an even. The fact if you breakdown on the reducer implementation, you might missing something:

```jsx
function reducer(state = initialState, action) {
  switch (action) {
    ...
    return state
  }
}
```

So here we come up with a formular of what state really is:

```
state = initialState + action + action + ... + action
                      \-------------v----------------/
                            a list of actions
```

So that you know how the interval function works. It works by two things, the initial counter, and the clock tick event:

```jsx
currentClockCounter = initialCounterNumber + numberOfTicks
```

However, there will be much more complicated situations than this one so for more information about the hard cases in RxJS, please visit the next chapter: [Execution Context in RxJS](RxJSExecutionContext.md).

To top: [Table of Contents](Wiki.md)
