import { isObservable, noop } from 'rxjs'

import { isFunction } from './isFunction'

export function bindActions(actions, ...args) {
  const keys = Object.keys(actions)

  for (const key of keys) {
    const action = actions[key]
    if (!isFunction(action) && !isObservable(action)) {
      console.warn(
        `Invalid value ${action} for action ${key}. An action need to be either a Function or an Observable.`
      )
    }
  }

  return Object.assign(
    keys
      .filter(key => {
        const action = actions[key]

        if (isFunction(action) || isObservable(action)) {
          return true
        }
        return false
      })
      .reduce(
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

  if (isObservable(action)) {
    return action.next.bind(action)
  }

  console.warn(
    `Action ${action} need to be a Function or an Observable`
  )

  return noop
}
