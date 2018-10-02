# Add React Epic to React Counter App

Counter App is the easiest app to demonstrate how state machine works. Here is one of its implementation:

```jsx
export class CounterApp extends Component {
  state = {
    counter: 0
  }

  increase = () =>
    this.setState({ counter: this.state.counter + 1 })

  // ...
}
```

If you notice, the app logic is much more simpler:

```jsx
let counter = 0

const increase = state => state + 1
const decrease = state => state - 1
const reset = () => 0
```

So to lift the app logic up to the RxJS and React DOM, here is how we do it:

```jsx
export class CounterApp extends Component {
  counter$ = new BehaviorSubject(0)

  increase$ = new Subject()
  decrease$ = new Subject()
  reset$ = new Subject()

  componentDidMount() {
    this.subscription = combineSubscriptions([
      lift(
        this.counter$,
        this.increase$,
        counter => counter + 1
      ).subscribe(this.counter$),
      lift(
        this.counter$,
        this.decrease$,
        counter => counter - 1
      ).subscribe(this.counter$),
      this.reset$.pipe(mapTo(0)).subscribe(this.counter$)
    ])
  }

  componentWillUnmount() {
    this.subscription.unsubscribe()
  }
}
```

Note: There was one operator `lift`. Which i will discuss later on the Chapter of [Lift Behind the Scene](LiftBehindTheScene.md).

Or you can even do it better:

```jsx
  componentDidMount() {
    this.subscription = merge(
      lift(
        this.counter$,
        this.increase$,
        counter => counter + 1
      ),
      lift(
        this.counter$,
        this.decrease$,
        counter => counter - 1
      ),
      this.reset$.pipe(mapTo(0))
    ).subscribe(this.counter$)
  }
```

And here is how we bind it back to React DOM:

```jsx
export class CounterApp extends Component {
  state = {
    counter: 0
  }

  increase = bindAction(this.increase$)
  decrease = bindAction(this.decrease$)
  reset = bindAction(this.reset)

  render() {
    return (
      <Subscribe
        observer={bindState({ counter: this.counter$ })}
        intialState={this.state}
      >
        {({ counter }) => ...}
      </Subscribe>
    )
  }
}
```

## Store and shared state

What if you want to store the state app somewhere far. Where you can access it later at any other place?

Here is how we lift the state up to the store:

```jsx
function createStore() {
  return {
    counter$: new BehaviorSubject(0),
    increase$: new Subject(),
    decrease$: new Subject(),
    reset$: new Subject()
  }
}
```

And here is how we define the app logic:

```jsx
const counterEpic = ({
  counter$,
  increase$,
  decrease$,
  reset$
}) =>
  merge(
    lift(counter$, increase$, counter => counter + 1),
    lift(counter$, decrease$, counter => counter - 1),
    reset$.pipe(mapTo(0))
  )
    .pipe(
      catchError(err, caught) => caught // Don't forget to handle error
    )
    .subscribe(counter$)
```

And we bind the store and the app logic to the top of your app:

```jsx
<Provider store={createStore()} runEpics={[counterEpic]}>
  <CounterApp />
</Provider>
```

And you can inject whatever you like:

```jsx
@WithRx({
  mapStateToProps: state => ({ counter: state.counter$ }),
  mapActionsToProps: actions => ({
    increase: actions.increase$,
    decrease: actions.decrease$,
    reset: actions.reset
  })
})
export class CounterApp extends Component {
  render() {
    const { counter, increase, decrease, reset } = this.props
    // ...
  }
}
```

Or you can inject and bind it yourself:

```jsx
@Inject(({ counter$, increase$, decrease$, reset$ }) => ({
  counter$,
  increase$,
  decrease$,
  reset$
}))
export class CounterApp extends Component {
  counter$ = this.props.counter$
  // ...
}
```

That's it! This is a very Rapid Recipe of how to add RxJS to your React App using React Epic.

For more information on how to Handling Error go to next Chapter: [Handling Error](HandlingError.md)

To top: [Table of Contents](Wiki.md)

Or you can jump to [React Epic Breakdown Cookbook](BreakdownCookbook.md)
