import { Subscription } from 'rxjs'

export function combineSubscriptions(...subscriptions) {
  return subscriptions.reduce((all, next) => {
    if (Array.isArray(next)) {
      all.add(combineSubscriptions(...next))
      return all
    }

    all.add(next)
    return all
  }, new Subscription())
}
