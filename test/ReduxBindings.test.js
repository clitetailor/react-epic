import { createStore } from 'redux'
import { Subject, merge, from } from 'rxjs'
import { expect } from 'chai'
import { pluck } from 'rxjs/operators'

import { createAction } from '../src/createAction'

import { createMountPoint } from './CounterApp'

describe('ReduxBindings', () => {
  describe('CounterApp', () => {
    it('should bind to Redux correctly', () => {
      const clickCounts = Array.from({ length: 3 }, (v, k) => k)

      function createEpicStore(store) {
        const store$ = from(store)

        return {
          counter: store$.pipe(pluck('counter')),
          increase: new Subject(),
          decrease: new Subject(),
          reset: new Subject(),
          store
        }
      }

      const counterEpic = ({ store, increase, decrease }) => {
        return merge(
          createAction(increase, () => ({
            type: 'INCREMENT'
          })),
          createAction(decrease, () => ({
            type: 'DECREMENT'
          }))
        ).subscribe(action => store.dispatch(action))
      }

      clickCounts.map(clickCount => {
        function counter({ counter = 0 } = {}, action) {
          switch (action.type) {
            case 'INCREMENT': {
              return { counter: counter + 1 }
            }
            case 'DECREMENT': {
              return { counter: counter - 1 }
            }
            default:
              return { counter }
          }
        }

        const store = createStore(counter)

        const wrapper = createMountPoint(
          createEpicStore(store),
          counterEpic
        )

        const increaseButton = wrapper.find('#increase')
        const counterNode = wrapper.find('#counter')

        for (let i = 0; i < clickCount; ++i) {
          increaseButton.prop('onClick')()
        }
        expect(Number.parseInt(counterNode.text())).to.be.equal(
          clickCount
        )
      })
    })
  })
})
