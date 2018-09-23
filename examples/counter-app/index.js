import React from 'react'
import ReactDOM from 'react-dom'
import { BehaviorSubject, Subject, merge } from 'rxjs'
import { mapTo } from 'rxjs/operators'

import { Provider, WithRx } from '../../src/WithRx'
import { lift } from '../../src/lift'

export function createStore() {
  return {
    counter$: new BehaviorSubject(0),
    increase$: new Subject(),
    decrease$: new Subject(),
    reset$: new Subject()
  }
}

export const counterEpic = ({ counter$, increase$ }) =>
  merge([
    lift(counter$, increase$, counter => counter + 1),
    lift(counter$, decrease$, counter => counter - 1),
    reset$.pipe(mapTo(0))
  ]).subscribe(counter$)

@WithRx({
  initialState: {
    counter: 0
  },
  mapStateToProps: ({ counter$ }) => ({
    counter: counter$
  }),
  mapActionsToProps: ({ increase$, decrease$, reset$ }) => ({
    increase: increase$,
    decrease: decrease$,
    reset: reset$
  })
})
export class CounterApp extends React.Component {
  render() {
    const { counter, increase, decrease, reset } = this.props
    return (
      <div>
        <p>
          <b>Counter: </b>
          {counter}
        </p>
        <button onClick={decrease}>-</button>
        <button onClick={increase}>+</button>
        <button onClick={reset}>Reset</button>
      </div>
    )
  }
}

ReactDOM.render(
  <Provider store={createStore()} runEpics={[counterEpic]}>
    <CounterApp />
  </Provider>,
  document.querySelector('#root')
)
