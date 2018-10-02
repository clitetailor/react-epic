import { combineLatest, isObservable } from 'rxjs'
import { map } from 'rxjs/operators'

import { isFunction } from './isFunction'

export function bindState(states) {
  const keys = Object.keys(states)

  for (const key of keys) {
    const state = states[key]
    if (!isFunction(state) && !isObservable(state)) {
      console.warn(
        `Invalid value ${state} for state ${key}. A state should be an Observable.`
      )
    }
  }

  return combineLatest(
    /**
     * Actually this line is caculated only once, everytime the context
     * changes. Which mostly occurs only once in our app.
     */
    ...keys.filter(key => isObservable(states[key])).map(key =>
      states[key].pipe(
        map(
          /**
           * This line cost is medium, one state is re-caculated
           * only and if only that state changes. That is the effect
           * of combineLastest.
           */
          state => ({ [key]: state })
        )
      )
    )
  ).pipe(
    map(
      /**
       * Only the cost of this line is expensive!
       */
      stateWrappers =>
        stateWrappers.reduce(
          (all, next) => Object.assign(all, next),
          {} // Avoid the reuse of one object.
        )
    )
  )
}
