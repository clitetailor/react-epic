import { isFunction } from './isFunction'

export function bindActions(actions, ...args) {
  return Object.assign(
    Object.keys(actions).reduce(
      (all, name) =>
        Object.assign(all, {
          [name]: bindAction(actions[name])
        }),
      {}
    ),
    ...args
  )
}

export function bindAction(action) {
  if (isFunction(action)) {
    /**
     * Support method bindings. For example, you might want to have
     * different ajax calls for each event stream instead of relying on
     * one single global stream source:
     *
     * ```js
     *
     *    function fetch(api) {
     *      return ajax.get(api)
     *    }
     *
     *    this.refetch$.pipe(
     *      switchMap(() => this.props.fetch(api))
     *    ).subscribe(this.todos$)
     *
     * ```
     */
    return action
  }
  return action.next.bind(action)
}
