# Common Mistakes

## Using merge the wrong way

This is one of my worst nightmare with RxJS (which might cause even error handler to be failed on debugging):

```jsx
merge([stream1, stream2]) // Wrong

merge(stream1, stream2) // Correct
```

But you actually has to notice it is different with `combineSubscriptions`:

```jsx
combineSubscriptions([sub1, sub2])
```

So i provide you with the fallback API so that you can use it the both way to make it consistency.

## Null Pointer Exception

You might think that it is ok if you don't use either `initialState` or `preload` param. The fact that's in most of you cases the state is flat so you may not experience this kind of effects. But it might be a great problem if you have deep nesting states. So Null Pointer Exception is no exception in your app. Remember to always check Null Pointer Exception or to use ESNext Proposal Optional Chaining Operator for convenient.

## Render Props

I believe that most of us won't fail this (with a caution: don't forget to optimize the app that ended up in production):

```jsx
// Bad

render() {
  return (
    <Subscribe>
      {(props) => {}}
    </Subscribe>
  )
}

// Good

render() {
  return (
    <Subscribe>
      {this.renderProps}
    </Subscribe>
  )
}

renderProps = (props) => {
  return /* ... */
}
```
