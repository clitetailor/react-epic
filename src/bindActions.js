export function bindActions(actions, ...args) {
  return Object.assign(
    Object.keys(actions).reduce(
      (all, name) =>
        Object.assign(all, {
          [name]: bindActions(actions[name])
        }),
      {}
    ),
    ...args
  )
}

export function bindAction(action) {
  action.next.bind(action)
  return action
}
