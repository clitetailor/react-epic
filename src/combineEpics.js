import { combineSubscriptions } from './combineSubscriptions'

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
  return store =>
    combineSubscriptions(
      Object.keys(epics).map(key => epics[key](store[key]))
    )
}
