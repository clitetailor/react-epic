import { combineSubscriptions } from './combineSubscriptions'
import { isFunction } from './isFunction'

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
export function combineEpics(...args) {
  return store =>
    combineSubscriptions(
      args.map(epics => {
        if (isFunction(epics)) {
          /**
           * Support shared root epic
           */
          return epics(store)
        }

        return combineSubscriptions(
          Object.keys(epics).map(key => epics[key](store[key]))
        )
      })
    )
}
