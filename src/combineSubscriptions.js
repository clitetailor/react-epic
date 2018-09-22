import { Subscription } from 'rxjs'

export function combineSubscriptions(subscriptions) {
  return subscriptions.reduce(
    (all, next) => all.add(next),
    new Subscription()
  )
}
