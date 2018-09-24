/**
 * Bridging between React Epic and Redux.
 *
 * ```jsx
 *
 *    createAction(action$, func, store.dispatch.bind(store))
 *
 * ```
 *
 * Other application is to map from action to state directly:
 *
 * ```jsx
 *
 *    createAction(action$, () => 0).subscribe(state$)
 *
 * ```
 */
function createAction(action$, func, dispatch) {
  if (!dispatch) {
    return action$.pipe(map(func))
  }

  return action$.pipe(map(func)).subscribe(dispatch)
}
