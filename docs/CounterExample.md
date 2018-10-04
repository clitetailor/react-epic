# Add React Epic to React Counter App

First, to understand how React Epic works. I will tell you to forget everything about React, got a blank mind and start to think. In a pure logic, this is how we define a state machine work:

```jsx
let counter = 0

let increase = (state, action = 1) => state + action
let decrease = (state, action = 1) => state - action
let reset = (state, action) => 0
```

But this program cannot run because it doesn't have anything to bind with. The easiest way is to bind to the console:

```jsx
function render() {
  console.log(counter)
}

function setState(func) {
  counter = func(counter)
  render(counter)
}
```

So when we run the program, it will log out the result:

```jsx
setState(counter => increase(counter)) // Output: 1
setState(counter => increase(counter)) // Output: 2
setState(counter => decrease(counter)) // Output: 1
setState(counter => reset(counter)) // Output: 0
```

But then you will find it is not enough. For example, when you call an ajax. Can you put an ajax into `setState`. So we come up with another solution: RxJS

```jsx
let counter$ = new BehaviorSubject(0)

let increase$ = new Subject()
let decrease$ = new Subject()
let reset = new Subject()
```

To make it easier for you to bind pure logic into RxJS, i provide you with a lift operator. The following lines will demonstrate how it works:

```jsx
lift(
  state$,
  action$,
  (state, action) => state + action
).subscribe(state$)
```

So the `increase`, `decrease`, `reset` functions will be declare like this:

```jsx
import { lift } from 'react-epic'

lift(counter$, increase$, counter => counter + 1).subscribe(
  counter$
)
lift(counter$, decrease$, counter => counter - 1).subscribe(
  counter$
)
lift(counter$, reset$, () => 0).subscribe(counter$)
```

If you're familiar with RxJS, you can even do it better:

```jsx
import { merge, mapTo } from 'rxjs'

merge(
  lift(counter$, increase$, counter => counter + 1),
  lift(counter$, increase$, counter => counter - 1),
  reset.pipe(mapTo(0))
).subscribe(counter$)
```

Here is how we define the `render` function:

```jsx
counter$.subscribe(counter => console.log(counter))
```

And how we call the `setState`:

```jsx
increase$.next() // Output: 1
increase$.next() // Output: 2
decrease$.next() // Output: 1
reset$.next() // Output: 0
```

Reference:

- For more information about how to use lift, consider reading: [Lift Operator](LiftBehindTheScene.md)
- For more information about how to declare a function and make a function call in RxJS, consider reading: [Exection Context in RxJS](RxJSExecutionContext.md)

After this. You may wonder, how do we subscribe it from ReactDOM? The most easy way is:

```jsx
import { Subscribe } from 'react-epic'

render() {
  return (
    <Subscribe observer={this.counter$}>
      {counter => /* ... */}
    </Subscribe>
  )
}
```

## Store and DI

In the most cases you will only need to put the logic at the same place and then connect it with your component using HOC.

To do that, first we need to create the store.

```jsx
const store = {
  counter$: new BehaviorSubject(0),
  increase$: new Subject(),
  decrease$: new Subject(),
  reset$: new Subject()
}
```

And then define the app logic:

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
  ).subscribe(counter$)
```

Create a provider for your whole app:

```jsx
<Provider store={store} runEpic={counterEpic}>
  <AppRoot />
</Provider>
```

To connect your component you need to use `WithRx`:

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
