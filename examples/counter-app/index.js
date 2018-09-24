import React from 'react'
import ReactDOM from 'react-dom'
import { BehaviorSubject, Subject, merge } from 'rxjs'
import { mapTo, catchError, tap } from 'rxjs/operators'

import { Provider, WithRx } from '../../src/WithRx'
import { lift } from '../../src/lift'
import { combineEpics } from '../../src/combineEpics'

export function counterStore() {
  return {
    counter$: new BehaviorSubject(0),
    increase$: new Subject(),
    decrease$: new Subject(),
    reset$: new Subject()
  }
}

export const defaultErrorHandler = catchError((err, caught) => {
  console.trace(err)
  return caught
})

export function createStore() {
  return {
    counterStore: counterStore()
  }
}

export const counterEpic = ({
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
    .pipe(defaultErrorHandler)
    .subscribe(counter$)

const rootEpic = combineEpics({
  counterStore: counterEpic
})

@WithRx(
  ({ counterStore }) => ({
    counter: counterStore.counter$
  }),
  ({ counterStore }) => ({
    increase: counterStore.increase$,
    decrease: counterStore.decrease$,
    reset: counterStore.reset$
  })
)
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
  <Provider store={createStore()} runEpic={rootEpic}>
    <CounterApp />
  </Provider>,
  document.querySelector('#root')
)
