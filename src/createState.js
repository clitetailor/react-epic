import { map, isObservable, Observable } from 'rxjs'

import { bindState } from './bindState'
import { isFunction } from './isFunction'

function createState(state$, func) {
  if (!isObservable(state$)) {
    /**
     * Support Redux Store
     */
    if (state$ && isFunction(state$.subscribe)) {
      return new Observable(observer => {
        state$.subscribe(state => observer.next(state))
      })
    }

    throw new Error('state$.subscribe is not a function')
  }

  return bindState({ state$ }).pipe(
    map(({ state$ }) => func(state$))
  )
}
