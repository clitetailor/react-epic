import React, { Component } from 'react'
import { mount, shallow } from 'enzyme'
import { noop } from 'rxjs'

import { WithRx, Provider } from '../src/WithRx'

@WithRx(
  ({ counter }) => ({ counter }),
  ({ increase, decrease, reset }) => ({
    increase,
    decrease,
    reset
  })
)
export class CounterApp extends Component {
  render() {
    const {
      counter,
      increase = noop,
      decrease = noop,
      reset = noop
    } = this.props
    return (
      <div>
        <p id="counter">{counter}</p>
        <button id="increase" onClick={increase}>
          Increase
        </button>
        <button id="decrease" onClick={decrease}>
          Decrease
        </button>
        <button id="reset" onClick={reset}>
          Reset
        </button>
      </div>
    )
  }
}

export function createMountPoint(store = {}, epic = noop) {
  return mount(
    <Provider store={store} runEpics={[epic]}>
      <CounterApp />
    </Provider>
  )
}

export function createShallowPoint(store = {}, epic = noop) {
  return shallow(
    <Provider store={store} runEpics={[epic]}>
      <CounterApp />
    </Provider>
  )
}
