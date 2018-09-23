# Lift Behind the Scene

After several chapters of Getting Started and React Epic in Action, you might wonder why there's another chapter on what the `lift` function is and how it works.

The fact that we have discussed and use `lift` operator so frequent that we haven't have chance to take a look back and breakdown on what `lift` operator really is. So here is how we start:

My first ideal of the `lift` function is simple, is to create a function generator for lifting pure logic functions into RxJS. So i come up with two functions without actually knowing clearly how it works:

```jsx
function lift(func) {
  return (...args$) =>
    combineLatest(...args$).pipe(map(args => func(...args)))
}

function lift(func) {
  return (...args$, lastArg$) => {
    const lastFunc = () => lastArg$.pipe(
      map(lastArg => func(...args, lastArg))
    )

    return args$.reduce(
      ([accumFunc, accumArgs], nextArg$) => nextArg$.pipe(
          switchMap(nextArg => accumFunc(...accumArgs, nextArg))
      ),
      [lastFunc, []]
    )
  }
}
```

I know, the second lift is so miraculous. But it can not against the fact that the second lift is the correct one for my situation. You may question me why.

The fact is both of the lift function has their point of view about how a lifted function should be. To take a look closer, let consider an example of three arguments function.

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

So i take more time investigate deeper into the effect of these three functions and the result is fantasy. `combineLatest` will emit everytime any of the arguments does. So i will consider it fully dynamic. What about `switchMap` and `map`? I consider `switchMap` static and `map` dynamic. This may a little bit tricky against the fact that `switchMap` change everytime the argument emits a value. Consider the following example:

```jsx
todos$
  .pipe(
    switchMap(todos =>
      addTodo$.pipe(map(newTodo => todos.concat([newTodo])))
    )
  )
  .subscribe(todos$)
```

People usually tends to be tricked into the ideal that this is a loop but it doesn't.

I will tell you something. The change doesn't result in emitting values. In another word, it tell the stream that arg1 and arg2 has changed but does not emit values. The real stream emits values comes from arg3. That why i consider `switchMap` is static and `map` is dynamic.

So why does this important. If you notice, the above `todos` and `addTodo` will stretch across all other state machine pattern. What is the state machine pattern formally? And if you have another notice, why we have two nesting `switchMap` in the three argument example.

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

If you notice, we don't care how many nesting `switchMap` are there, the final result will only depend on the last argument. The same think work with `map` (You can have multiple nesting map either). So how to compact it? It's easy:

```jsx
combineLatest(arg1$, arg2$).pipe(
  switchMap(([arg1, arg2]) =>
    arg3$.pipe(map(arg3 => func(arg1, arg2, arg3)))
  )
)
```

So the final form will only contain two arguments. And if you have three or more arguments, depends on which arguments need to emit values, we can combine them together! For example:

```jsx
const liftedOperator = lift(someOperator)

liftedOperator(
  combineLatest(arg1$, arg2$),
  combineLatest(arg3$, arg4$)
)
```

To make you better understand of how it works, i will better rewrite it implementation with **Ninja Comments**:

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

Huh, what the heck! Your eyes not blur and you are seeing what i'm showing you is another reducer. Does it reminds you of Redux? Are you missing something? The fact is that all application implementations contains two things: the app own state and the external actions (or outer event space). The fact, it's not remind me of Redux but Haskell State. I have had a hard time take a deep investigation into Haskell State and don't understand anything about how it works and why it even exists! Then i come up with one diagram that helps me a little about understading it:

So if i'm not wrong, the lift function work the same way with `runState` (Please correct me if i'm wrong). So if you don't might, i might translate the following piece of code:

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

Actually you will see i embedded state and action arguments into lift arguments. Someone might love this, someone might hate this because it breaks the semantic meaning of lift operator. But i still take it because it is my decide choice (And i live with it). It is the rare case that your operator don't stick with your target of your state and your action. And reusing such this kind of operators might be troublesome that lead to the misconception that: They all the same. So for example one may edit this operator for convenient but don't know that it might break other functions. Reusing it is not hard, you already had the operator by the way. There's two ways to overcome this. The first is to relift the operator

```jsx
lift(state$, action$, operator)
```

The second way is to wrap it so that the other ones know what are they doing and you know what are you doing, too:

```jsx
function liftedOperator(state$, action$) {
  return lift(state$, action$, operator)
}
```

It can be cleaner but troublesome if you rewrite the following way all the times:

```jsx
lift(operator)(state$, action$).subscribe(state$)
```

Like:

```jsx
lift(operator(state$, action$)).subscribe(state$)
```

And the truth is you usually rewrite it all the times. Each time for each epic, than to lift an operator for once and use it across epics. Fun fact: The first one is still very additive to me because it is good in semantic so i leave both ways valid! 🤣

- The good: I leave you defind your own way of how to use it.
- The bad: You may come up with unecessary performance impact.
- The ugly: This might lead to inconsistency implementation of your app.

Best of both world:

- Using `lift(state$, action$, operator)` in almost all of your epic.
- Only using `const liftedOperator = lift(func)` when necessary.

## More on State and Actions

"Don't use lift if you don't really know what it does". Just kidding, we have so far discuss and use `lift` so frequent in our document but our app still looks good and works like a charm. But what i wanna tell you is different. What i want to tell you is not whether your app works fine or not, but how much you understand about the architecture **behind the scene** of the lift operator **behind your app**. For example:

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

```md
state = initialState + action + action + ... + action
                      \-------------v---------------/
                            a list of actions
```

So that you know how the interval function works. It works by two things, the initial counter, and the clock tick event:

```jsx
currentClockCounter = initialCounterNumber + numberOfTicks
```

And state may combine of states and actions may combine of actions. That's how your app still works good if you have a good design architecture. So you know what you are doing. Cheers! 🍻
