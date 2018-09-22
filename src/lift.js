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
export function lift(state$, eventSource$, func) {
  return state$.pipe(
    switchMap(state =>
      eventSource$.pipe(map(action => func(state, action)))
    )
  )
}
