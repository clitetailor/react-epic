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
  return action.next.bind(action)
}
