export function isFunction(func) {
  return (
    func && {}.toString.call(func) === '[object Function]'
  )
}
