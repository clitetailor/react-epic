import { combineLatest, map } from 'rxjs'

export function bindState(states) {
  return combineLatest(
    /**
     * Actually this line is caculated only once, everytime the context
     * changes. Which mostly occurs only once in our app.
     */
    Object.keys(states).map(key =>
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
