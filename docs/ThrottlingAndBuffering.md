# Throttling and Buffering State and Actions

There is a hard case that you want to `throttle` a stream but not based on time but based on its previous value. There's another name for it `distinctUntilChange`. It is so easy that you can `distinctUntilChange` and `throttle` for distinguished values. But what if what you want is reversed. For example, if you want to `throttle` the same values in 5 seconds and you want to let it being duplicated after 5 seconds. It's a very hard case.

So if the value is the same, we will throttle the stream. If not we will emit the value immediatly. The problem come up with another question is how to seperate the stream when the value stay the same. The operator is quite the same with `filter` that is `partition` but `partition` only return two streams. The other solution is to use `reduce` but `reduce` only take effect on completed stream.

So i come up with some thing more static. The same old friend `switchMap`. The stream will be switched if the value is distinct:

```jsx
actions.pipe(
  distinctUntilChange(),
  switchMap(a => actions)
)
```

Remember if you stream is not hot by default you may need to optimize your stream using `share`:

```jsx
actions.pipe(
  share()
)
```

And then `throttle` that stream for 5 seconds:

```jsx
actions.pipe(
  share()
  distinctUntilChange(),
  switchMap(a =>
    actions.pipe(
      share(),
      throttle(5000)
    )
  )
)
```

Next Chapter: [Cascading Problem in React Epic](CascadingUpdate.md)
