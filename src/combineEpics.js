import { Subscription } from 'rxjs'

/**
 * Combine an object of epics into one subscription. For example:
 *
 * ```js
 *
 *    combineEpics({
 *      counter: counterEpic,
 *      todos: todosEpic
 *    })
 *
 * ```
 */
export function combineEpics(epics) {
  return store => {
    const subscriptions = Object.keys(epics).map(key =>
      epics[key](store[key])
    )

    return new Subscription(() => unsubscribeAll(subscriptions))
  }
}

export function unsubscribeAll(subscriptions) {
  subscriptions.forEach(subscription =>
    subscription.unsubscribe()
  )
}
