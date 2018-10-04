# Quick API Overview

## React Bindings

### `<Subscribe />`

Render an Observable into ReactDOM nodes:

```jsx
<Subscribe observer={observable} initialValue="None">
  {value => <p>{value}</p>}
</Subscribe>
```

### bindAction

Render a RxJS Subject into Component method:

```jsx
increase = bindAction(increase$)
```

## Dependency Injection

### `<Provider />`

Provide the store context to your React App:

```jsx
<Provider store={store} runEpic={rootEpic}>
  <AppRoot />
</Provider>
```

### WithRx

Inject store's state and actions into Component:

```jsx
@WithRx(
  ({ counter$ }) => ({ counter: counter$ }),
  ({ increase$, decrease$, reset$ }) => ({
    increase: increase$,
    decrease: decrease$,
    reset: reset$
  })
)
export class CounterComponent extends React.Component {
  render() {
    const { counter, increase, decrease, reset } = this.props
    return (
      <div>
        <p>{counter}</p>
        <button onClick={increase}>Increase</button>
        <button onClick={decrease}>Decrease</button>
        <button onClick={reset}>Reset</button>
      </div>
    )
  }
}
```

## Epic

### lift

Lift operator provide a way to lift a reducer like operator up into RxJS operator.

```jsx
const reducer = (state = 0, action) => {
  switch (action) {
    case 'INCREMENT':
      return state + 1
    case 'DECREMENT':
      return state - 1
    case 'RESET':
      return 0
    default:
      return state
  }
}

const liftedReducer = lift(reducer)
liftedReducer(state$, action$)
```

It can be use for direct subscription from state source and action source also:

```jsx
lift(state$, action$, reducer).subscribe()
```
