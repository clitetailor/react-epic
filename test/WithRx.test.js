import { BehaviorSubject, Subject, merge } from 'rxjs'
import { mapTo } from 'rxjs/operators'
import { expect } from 'chai'

import { lift } from '../src/lift'
import { createMountPoint } from './CounterApp'

describe('WithRx', () => {
  describe('CounterApp', () => {
    it('should perform a cascading update', () => {
      function createStore() {
        return {
          counter: new BehaviorSubject(0),
          increase: new Subject(),
          decrease: new Subject(),
          reset: new Subject()
        }
      }

      const wrapper = createMountPoint(createStore())
      const counterNode = wrapper.find('#counter')

      expect(Number.parseInt(counterNode.text())).to.be.equal(0)
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

      const increaseCount = 1000
      const increaseButton = wrapper.find('#increase')
      const counterNode = wrapper.find('#counter')

      for (let i = 0; i < increaseCount; ++i) {
        increaseButton.prop('onClick')()
      }

      expect(Number.parseInt(counterNode.text())).to.be.equal(
        initialCounter + increaseCount
      )
    })
  })
})
