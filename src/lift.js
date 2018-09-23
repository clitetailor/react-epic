import { switchMap, map } from 'rxjs/operators'

/**
 * Lift an operator (aka a reducer) into computational RxJS space. The
 * result might look something like this:
 *
 * ```js
 *
 *    lift(state$, action$, reducer)
 *      .subscribe(state$)
 *
 * ```
 */
export function lift(...args, func) {
  if (args.length === 2) {
    return lift(func)(...args)
  }
  return state$.pipe(
    switchMap(state =>
      action$.pipe(map(action => func(state, action)))
    )
  )
}
