import React, { Component } from 'react'
import { BehaviorSubject, Subject, merge } from 'rxjs'
import { mapTo } from 'rxjs/operators'
import { mount } from 'enzyme'
import { expect } from 'chai'

import { lift } from '../src/lift'
import { createMountPoint } from './CounterApp'
import { WithRx, Provider } from '../src/WithRx'

import sinon from 'sinon'

describe('WithRx', () => {
  describe('CounterApp', () => {
    it('should perform a cascading update', () => {
      const initialStates = Array.from(
        { length: 10 },
        (v, k) => k
      )

      for (const initialState of initialStates) {
        function createStore() {
          return {
            counter: new BehaviorSubject(initialState),
            increase: new Subject(),
            decrease: new Subject(),
            reset: new Subject()
          }
        }

        const wrapper = createMountPoint(createStore())
        const counterNode = wrapper.find('#counter')

        expect(Number.parseInt(counterNode.text())).to.be.equal(
          initialState
        )
      }
    })

    it('should perform state updates', () => {
      const initialCounter = 0

      function createStore() {
        return {
          counter: new BehaviorSubject(initialCounter),
          increase: new Subject(),
          decrease: new Subject(),
          reset: new Subject()
        }
      }

      const counterEpic = ({
        counter,
        increase,
        decrease,
        reset
      }) =>
        merge(
          lift(counter, increase, counter => counter + 1),
          lift(counter, decrease, counter => counter - 1),
          reset.pipe(mapTo(0))
        ).subscribe(counter)

      const wrapper = createMountPoint(
        createStore(),
        counterEpic
      )

      const increaseCount = 100
      const increaseButton = wrapper.find('#increase')
      const counterNode = wrapper.find('#counter')

      for (let i = 0; i < increaseCount; ++i) {
        increaseButton.prop('onClick')()
      }

      expect(Number.parseInt(counterNode.text())).to.be.equal(
        initialCounter + increaseCount
      )
    })

    it('should show warning when an action is undefined', () => {
      function createStore() {
        return {}
      }

      const stub = sinon.stub(console, 'warn')

      @WithRx(
        () => ({}),
        () => ({ action1: undefined, action2: undefined })
      )
      class ExampleApp extends Component {
        render() {
          return <div />
        }
      }

      const wrapper = mount(
        <Provider store={createStore()}>
          <ExampleApp />
        </Provider>
      )

      expect(stub.callCount).to.be.equal(2)

      console.warn.restore()
    })

    it('should show warning when a state is undefined', () => {
      function createStore() {
        return {}
      }

      const stub = sinon.stub(console, 'warn')

      @WithRx(
        () => ({
          state1: {},
          state2: {}
        }),
        () => ({})
      )
      class ExampleApp extends Component {
        render() {
          return <div />
        }
      }

      const wrapper = mount(
        <Provider store={createStore()}>
          <ExampleApp />
        </Provider>
      )

      expect(stub.callCount).to.be.equal(2)

      console.warn.restore()
    })
  })
})
