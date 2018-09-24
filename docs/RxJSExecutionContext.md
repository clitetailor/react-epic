# Execution Context in RxJS

Sometimes when you try to implement a simple ajax and you might meet a problem. You don't know how to register it or should you register it locally or globally:

```jsx
const refetchTodos = () => ajax.get('/todos')
```

Another example of execution context is when you open a new tab, your execution context is that new tab. But when you open a modal, so every streams on that new tab should be blocked and wait for streams on that modal to be completed before it is resumed again after the modal is closed. So how do we stimulate this pattern in RxJS?

I will tell you another story. That time, i was listening to a lecture of the subject of Algorithmic. The teacher told us about the problems on the way we solve a problem. He said to solve the problem, we should know what is the input and the output of the problem first. Some people usually represent the solution to a problem without showing clear about what are the inputs and the outputs of the problem. But sadly these such a bunch of mistakes we meet all the time. So i come back to the problem with a list new of inputs and outputs. The input of the problems is a list of streams that we want to disable and enable whenever we want, a stream of opening events and another stream of closing events. That's it. The way we disable and enable a stream is to use `takeWhile`. Unhappily, there's no short solution for this (I checked RxJS issues and only see workarounds. It seems like they don't want to make any other unnecessary implementation of this operator). So here is a workaround:

```jsx
const toggleStream = merge(
  of(true),
  // Pause the source stream on modal execution context.
  openingModalStream.pipe(mapTo(false)),
  // Resume the source stream when the modal is closed.
  closingModalStream.pipe(mapTo(true))
)

const interceptedStream = toggleStream.pipe(
    switchMap(toggle => source.pipe(
      takeWhile(() => toggle)
    ))
  )
)
```

As we have learned, the `switchMap` operator is static and the source stream is dynamic. The only that we wish for is to have a imperative version of this simple operator, what actually i can provide you:

```jsx
const toggle = (toggle$, initialValue) => source =>
  merge(of(initialValue), toggle$).pipe(
    switchMap(toggle => source.pipe(takeWhile(() => toggle)))
  )
```

So that you can use it easily:

```jsx
source.pipe(toggle(toggleStream, true))
```

The first problem is quite different. Given a local stream and a shared stream. The shared stream is throttle for 5 seconds. Everytime we click the button, we register the local stream to the shared stream. When the stream is accepted, the shared stream will notify the local stream to make an ajax to the server. So the implementation may look like this:

```jsx
const register$ = new Subject()
register$
  .pipe(throttle(5000))
  .subscribe(subject => subject.next())

const refetchTodos$ = new Subject()
refetchTodos$
  .pipe(switchMap(() => ajax.get('/todos')))
  .subscribe(todos$)

function register() {
  register$.next(this.refetchTodo$)
}
```

There was actually another problem that blocked me from the real solution. That is how to unsubscribe the local stream at the local component. Actually as i have said we don't even need to unsubscribe it due to the use of `<Subscribe />`. But the most of us usually being treated into the ideal of using HOC so it will do the rest stuff for us or we can have a consistency implementation of all components. Actually i can provide you with a HOC that provide the local state for you. But it's not worth. Here is the reason why:

```js
@WithRx2(localStore, runEpic, mapStateToProps, mapActionsToProps, mergeProps, initialStateOrPreload, ...blaBlaBla)
```

As you might see the api will look much more complicated. Especially, when you connect with a shared state. It seems to far more expensive than we already have now:

```jsx
export App extends Component {
  state = {
    intialState
  }

  state$ = new BehaviorSubject(this.state.initialState)

  action$ = bindAction(new Subject)

  componentDidMount() {
    this.subscription = combineSubscriptions(
      merge(
        /* ... */
      ).subscribe(this.state$)
    )
  }

  render() {
    return (
      <Subscribe
        observer={this.state$}
        initialState={this.state.initialState}
      >
        {state => /* ... */}
      </Subscribe>
    )
  }

  componentWillUnmount() {
    this.subscription.unsubscribe()
  }
}
```

So i make a hard decision here is to keep the old `WithRx` api and let us do such things manually with the use of `<Subscribe />`

To top: [Table of Contents](Wiki.md)

Or: [Go back to Home Page](../README.md)
