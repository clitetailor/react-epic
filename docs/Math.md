# Math and the Implemetation behind ReactiveX

Caution: The following lines contain math and math only! 🤣

```
(=) = {assignment or used to refer jump in pointer to execution code blocks on physical memory}

(:) = {an instance or a variable should belong to a type. or another word, force type checking on that variable}

(=>) = {refer a type is a subset of another type}

(.) = {Cartesian product of two sets}

T = {type of types}
A = {any type}
D = {duration type}
Time = {time type}
E = {event type or execution return code type}
F = {function types}
[] = {collection type}

Rx: T -> T
Rx = t0 -> [t0 . D]

# [A . D] is exactly Rx type. It is a collection of tuples. Each contains a value and a duration. When a stream is subscribed, it schedules to emit values based on the caculated durations. 

# Function to generate generic types
forall: (T -> T) -> T
forall = f0 ->
  {set of f0(t0) with every member t0 that belongs to T. Using Cartesian product only may not be adequate because the set of T is uncountable}

# Fact: `forall` is one of the hardest notation to understand in Haskell.

F = A -> ()

console.log: F
console.log = (x0) ->
  {log x0}

of: forall(X -> (X -> Rx(X)))
of = x0 -> [(x0, 0)]

DO = {duration operation type} =
  forall(X -> (Rx(X) . D -> Rx(X)))

delay: DO
delay = (rx0, d0) ->
  rx1 = map(rx0, (x0, d1) -> (x0, d0 + d1))
  return rx1

throttle: DO
throttle = {quite long to implement}

time: () -> Time
time = {get and return the current time value}

setTimeout: F . D -> ()
setTimeout = (f0, d0) ->
  t0 = time()
  t1 = t0 + d0
  {schedule to run f0 at t1}

subscribe: Rx(A) . F . Time -> ()
subscribe = (rx0, f0) ->
  forEach(rx0, (x0, d0) ->
    f1 = () -> f0(x0)
    setTimeout(f0, d0)
  )
```

ReactiveX is impure, not just because the interception of time. There was another reason make time impure. For example, what will happens if you do this:

```jsx
setTimeout(f0, -1000)
```

You don't have to guess. It runs f0 immediately. So the real implemetation of `setTimeout` is:

```
setTimeout = (f0, d0) ->
  t0 = time()
  d1 = d0 > 0 ? d0 : 0
  t1 = t0 + d1
  {schedule to run f0 at t1}
```

You know this is false positive. Why? Because of the minus operator?! That may be the cause of the problem. For example:

```
1 / x = x ^ (-1)
```

And when x = 0 the magic happens. So someone may add the notation IMHO:

```
(+) = {pure}
(-) = {impure}
0 = {magic}
```

Ofcourse paradox is just ... paradox. Time works different way with numbers. Or maybe we can only experience the positive effects of time. What we may want to experience in the future is: the console logs the number at the negative point of time. Which might never happens, at least for now. So our solution for such this kind of problem is to find the fine domains of acceptable logic when the truth can not happen:

| Categories | Positive | Negative |
| ---------- | :------: | :------: |
| True       |    +     |    -     |
| False      |    -     |    +     |

You can pick either one of the following strategy:

- Store the previous actions in memories, reduce the clock when `setTimeout` second param is negative, replay the actions in the correct order.
- Remove the action.
- Evaluate it immediately.
- Predict the unexcecuted code to log exactly. (Only happens to be true if the app lifetime is longer than the negative value)
- Throw an exception when someone calls `setTimeout`.
- Remove the `setTimeout` function.

To top: [Table of Contents](Wiki.md)
