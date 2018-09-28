import { switchMap, map, tap } from 'rxjs/operators'
import { makeHotWithLast } from './makeHot'

/**
 * Lift an operator (aka a reducer) into computational RxJS space. The
 * result might look something like this:
 *
 * ```js
 *
 *    lift(state$, action$, operator)
 *      .subscribe(state$)
 *
 * ```
 */
export function lift(state$, action$, func) {
  if (!func) {
    /**
     * Include fallback to the real semantic version of lift:
     *
     * ```js
     *
     *    lift(operator)(state$, action$)
     *      .subscribe(state$)
     *
     * ```
     */
    func = state$
    return (state$, action$) => lift(state$, action$, func)
  }

  return state$.pipe(
    switchMap(state =>
      action$.pipe(
        /**
         * Actions should be made to be hot for optimization.
         */
        makeHotWithLast(),
        map(action => func(state, action))
      )
    )
  )
}
