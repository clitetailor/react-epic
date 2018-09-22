# React Epic Breakdown Cookbook

Note:

- The article is long (286 lines exactly) but it's worth to read so enjoy! 🤣
- These following knowledges come from Haskell community, what i do is just to create this library.

To come to the basic React Epic breakdown, we come back to the basic simple React Counter example app. Imagine we have this app wire-frame:

```jsx
export class Counter extends Component {
  state = {
    counter: 0
  }

  render() {
    return (
      <div>
        <p>
          <b>Counter: </b>
          {this.state.counter}
        </p>
        <button onClick={this.increase}>+</button>
        <button onClick={this.decrease}>-</button>
        <button onClick={this.reset}>Reset</button>
      </div>
    )
  }

  increase = () =>
    this.setState({
      counter: this.state.counter + 1
    })

  decrease = () =>
    this.setState({
      counter: this.state.counter - 1
    })

  reset = () =>
    this.setState({
      counter: 0
    })
}
```

If you notice, the app logic is much dead simpler than we think:

```jsx
const counter = 0

const increase = counter => counter + 1
const decrease = counter => counter - 1
const reset = counter => 0
```

As you might think "Oh great, so why we don't put that off and just lift the operators into the computational space of React DOM?!" - Hint: it's called `binding method` - "Is that much more easier? We don't even need RxJS?!"

It is only half of the truth, there's one condition: Your app don't contain any side effects. For example:

```js
const refreshTodos = () => refetchTodos().then(setState)
```

Now, everything is different, you have to decouple both three layers: logic layer, side-effect layer, and React DOM layer all together.

But first, let try to lift the logic into React DOM first. Our app might look like this in the end:

```jsx
function Counter({ counter, increase, decrease, reset }) {
  return (
    <div>
      <p>
        <b>Counter: </b>
        {counter}
      </p>
      <button onClick={increase}>+</button>
      <button onClick={decrease}>-</button>
      <button onClick={reset}>Reset</button>
    </div>
  )
}
```

If you notice, our current `increase` might change to something like this:

```jsx
const counter = hoc.state.counter

const increase = () => hoc.setState(increase)
const decrease = () => hoc.setState(decrease)
const reset = () => hoc.setState(reset)
```

So this is what actually how we lift the operator up:

```jsx
function lift(func) {
  return () => hoc.setState(func)
}
```

So to sum up, here is what we want in pure computation. Is that right?

```jsx
@lift({ counter: 0 }, {
  increase: ({ counter }) => ({ counter: counter + 1 }),
  decrease: ({ counter }) => ({ counter: counter - 1 }),
  reset: () => ({ counter: 0 })
})
function Counter({ counter, increase, decrease, reset }) {
  return (
    <div>
      <p>
        <b>Counter: </b>
        {counter}
      </p>
      <button onClick={increase}>+</button>
      <button onClick={decrease}>-</button>
      <button onClick={reset}>Reset</button>
    </div>
  )
}
```

## React: The Good, The Bad & The Ugly

The complexity of `lift` is to lift each logic function up, plus, rebind these functions back to React DOM. It's costly, yes. In the future, instead of using HOC, we might want React to run `setState` automatically for us:

```jsx
export class Counter extends Component {
  state = {
    counter: 0
  }

  increase() {
    ++this.state.counter
  }

  decrease() {
    --this.state.counter
  }

  reset() {
    this.state.counter = 0
  }

  render() {
    return (
      <div>
        <p>
          <b>Counter: </b>
          {this.state.counter}
        </p>
        <button onClick={this.increase}>+</button>
        <button onClick={this.decrease}>-</button>
        <button onClick={this.reset}>Reset</button>
      </div>
    )
  }
}
```

And maybe, this one either:

```jsx
export class Counter extends Component {
  state = {
    todos: []
  }

  async refetchTodos = () => {
    let todos = await fetch(...)
    this.state.todos = todos
  }

  render() {
    return (
      <div>
        <ul>{this.state.todos.map(todo => <li>{todo}</li>)}</ul>
        <button onClick={this.refetchTodos}>Refetch</button>
      </div>
    )
  }
}
```

Actually, Angular has done better than React at this point. But then, after ask thousand of questions about how the architecture should be, we might want to call `setState` at some points. Like we call `ngZone.run` in Angular.

## Lifting the logic up

So here is how we do it by putting the RxJS layer between logic layer and React DOM layer:

```jsx
const counter$ = new BehaviorSubject(0)

increaseEvent$.subscribe(increase$(counter$))
decreaseEvent$.subscribe(decrease$(counter$))
resetEvent$.subscribe(reset$(counter$))
```

And then bind it to our React DOM:

```jsx
@withRx({
  initialState,
  mapStateToProps: ({ counter$ }) => bindState({ counter }),
  mapActionsToProps: ({ increase$, decrease$, reset$ }) => bindActions({ increase: increase$, decrease: decrease$, reset: reset$ })
})
export class Counter extends Component { ... }
```

As you might see, the lift operator might be various and not consistency. So i will have to design something good, applicative to the current situation. If you notice, every operator we want to lift is in the shape of a reducer. It all come with a state and an event source. So here is our ideal lift operator for our situation:

```jsx
function lift(state$, eventSource$, func) {
  return state$.pipe(
    switchMap(state =>
      eventSource$.pipe(map(data => func(state, data)))
    )
  )
}
```

## What about Redux?

Redux is not bad at all. Actually, i have hated Redux before but now i love it. There are two things Redux force us to do (not Redux does for us as many people confuse). Encapsulate the events stream so that we can recreate the actions stream on remote server and replay it (not undo it. the real undo is to caculate the previous state based on the current state. so that we have to do is to reverse the reducer and the actions stream to archive the real undo. what we usually do is to store the reference to the previous states and unpop it). The second is to put things together so that you have to design the system in its very own core. From inside out (not outside in).

The problems come to Redux is first, you can not lift the side-effects into Redux yourself. That why we need Redux Saga, Redux Observable, etc. The second problem come to Redux is that it is so costly to encapsulate all the actions stream to make a good business modal. Actuallly most of us don't need it, what we almost need is to encapsulate mostly of our actions (not every actions).

So there's two solution to overcome this. The first solution is to lift Redux into React Epic. The second solution is to lift RxJS into Redux. Can it be?!

The answer is yes. Imagine this is the reducer and how it swallows the actions stream:

```js
function counterReducer({
  counter = new BehaviorSubject(0),
  increase = new Subject()
}, action) {
  switch (action) {
    case INCREASE: {
      increase.next(action.value)
      return state
    }
  }
}

function counterMiddleware = store => {
  const { counter, increase } = store.getState()

  counter.pipe(
    switchMap(_counter => increase.map(() => _counter + 1))
  )

  return next => action => next(action)
}
```

And we **still** have to subscribe the state using React Epic (Sorry about the **still** word):

```jsx
return (
  <Subscribe observer={this.props.counter}>
    {_counter => { ... }}
  </Subscribe>
)
```

The second way, you know, is to write the epics and bind it to **HOC**

```jsx
function createStore() {
  return {
    counter$: new BehaviorSubject([])
    increase$: new Subject()
  }
}

const counterEpic = ({ counter$, increase$ }) =>
  lift(counter$, increase$, counter => counter + 1).subscribe(
    counter$
  )
```

But you may miss Redux some day. So be clear and thoughtful, just don't be overwhelming (That would probably what we don't want you to be). Enjoy! 😄
