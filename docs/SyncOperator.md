# Sync Operator

When you come to React Epic you might wonder what the Sync Operator is. It comes from a optimize problem, for example:

```jsx
let action$ = of(1, 2, 3, 4, 5)
```

And when you lift the actions into a reducer the problem might happen:

```jsx
switchMap(state =>
  action$.map(action => reducer(state, action))
)
```

The action may be repeated. It may not repeat due to the use of `switchMap` but there is no guaranteer that the action is not over updating and spamming the state. So the sync operator only do one thing: It cleans up previous emitted values so that it can not store actions by such using cold Subjects.

```jsx
const subject = new Subject()
const source = of(1, 2, 3, 4, 5).pipe(
  concat(subject),
  sync()
)

/**
 *  Output 6 only instead of 1, 2, 3, 4, 5, 6.
 */
source.subscribe(val => console.log(val))

subject.next(6)
```

Or if you use `ReplaySubject`:

```jsx
const action$ = new ReplaySubject()

action$.next(2)
action$.next(4)

/**
 *  Output 6, 8 only instead of 2, 4, 6, 8.
 */
action$.pipe(sync()).subscribe(val => console.log(val))

action$.next(6)
action$.next(8)
```

I have planned to embed `sync` into `lift` function once but it seems not to be adequate because someone may want to update the state with a list of actions and it's not optimal to keep a lot closures just to optimize some intial emitted values. It only seems to suitable with DOM when you may want to buffered some states before being rendered. So use it with a caution.
