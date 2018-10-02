/**
 * Check whether the target object is function. Don't use `isFunction`
 * from util because this is not purely a node library.
 */
export function isFunction(func) {
  return (
    func && {}.toString.call(func) === '[object Function]'
  )
}
