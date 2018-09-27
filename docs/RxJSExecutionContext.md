# Execution Context in RxJS

Sometimes when you try to implement a simple ajax method, you might find yourself in a situation. You don't know how to register the ajax call correctly or whether to register it locally or globally:

```jsx
const refetchTodos = () => ajax.get('/todos')
```

Another example i want to tell about the meaning of execution context is when you open a new tab, your execution context will be that new tab. But when you open a new modal on that new tab, so every streams on that new tab should be blocked and wait for streams on that modal to be completed before it can be resumed. How do we stimulate this model in RxJS?

Let me tell you a story. Recently i registered to an Algorithmic class and the teacher told us about one problem. That is when we represent the solution to a problem, we often forget to show clearly about the inputs and the outputs of that problem. But sadly these such these bunch of mistakes we meet all the time. So i come back with the problem and this time i come up with a list of inputs and outputs. The inputs of the problem are a list of streams that we want to disable and enable, a stream of opening events and a stream of closing events on modal. So that is how we stimulate the execution context. The way we disable and enable a stream is to use `takeWhile`. Unhappily, there's no short implemetation for this kind of problem (I checked RxJS issues and only see workarounds. It seems like they don't want to make any other unnecessary implementation of this operator). So here is a workaround:

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

As we have learned, the `switchMap` operator is static and the source stream is dynamic. The only thing that we wish for is to have a imperative version of this operator, what actually i can provide you:

```jsx
const toggle = (toggle$, initialValue) => source =>
  merge(of(initialValue), toggle$).pipe(
    switchMap(toggle => source.pipe(takeWhile(() => toggle)))
  )
```

So that you can use it easily in one line:

```jsx
source.pipe(toggle(toggleStream, true))
```

However, the RxJS implemetation of operator is much more complex. They're trying to convert every n order logic functions of into OOP style i think (They have their reason behind this). Functional closure is quite complicated than OOP though.

The first problem seems to be different. Given a local stream and a shared stream. The shared stream is throttle for 5 seconds. Everytime we click the button, we register the local stream to the shared stream. When the stream is accepted, the shared stream will notify the local stream to make an ajax to the server. So the implementation may look like this:

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

## Only Relationship Matters

You will think that there's a principal pattern here. Like what i have made with the reducer. There's no principal pattern in this case. The first example show the dependence of the source stream on the shared stream based on `throttle`. The second example shows the dependence of the parent execution context on its children execution context based on `takeWhile` relation. So the only relations between these two problems is the relations. It will be the principle on your design choice. Choosing this operator over another operator one problem is just the need of which kind of relationship you want to stimultate and how do you stimultate it.

## Local Store doesn't Exists

There was actually another problem that blocked me from the clarity is that how to unsubscribe the local stream at the local component. Actually as i have said we don't even need to unsubscribe the stream on `componentWillUnmount` due to the use of `<Subscribe />`. But the most of us usually being treated into the ideal of using HOC so it will do the rest stuffs for us and we can have a consistency implementation of the all components. Actually i can provide you with a HOC that provide the local state for you. But it's not worth. Here is the reason why:

```js
@WithRx2(localStore, runEpic, mapStateToProps, mapActionsToProps, mergeProps, initialStateOrPreload, ...blaBlaBla)
```

As you might see the api will look much more complicated. Especially, when you connect with a shared state. It seems to far more expensive than we already have now. So the greatest solution i think is to subscribe the relations manually and then manually unsubscribe it:

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

So i make a hard decision here is to keep the old `WithRx` implementation so that it can let us move forward with the use of `<Subscribe />`

Next Chapter: [Throttling And Buffering](ThrottlingAndBuffering.md)

To top: [Table of Contents](Wiki.md)
