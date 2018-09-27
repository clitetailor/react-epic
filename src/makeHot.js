import { BehaviorSubject } from 'rxjs'

/**
 * Working around over RxJS `publishBehavior` and `multicast` operators.
 * For example, the following lines should not log anything:
 *
 * ```js
 *
 *    of(1, 2, 3, 4).pipe(shared()).subscribe(val => console.log(val))
 *
 * ```
 */
export function makeBehaviorHot() {
  return cold => {
    const proxy = new BehaviorSubject()

    let coldSub

    let refs = 0
    return new Observable(observer => {
      /**
       * Ưhen there's a new subscription. If no hot sub is created. This
       * subscribe for hot items from cold stream.
       */
      if (refs === 0) {
        coldSub = cold.subscribe(proxy)
      }
      refs++

      /**
       * Subject only emits items come after subscription. Every
       * subscription has its own hot sub.
       *
       * The `hotSub` is subscribed later than the `coldSub` in order
       * not to make last item being duplicated.
       */
      const hotSub = proxy.subscribe(observer)

      return () => {
        /**
         * When a subscription is teardown, its hotSub is teared-down too.
         */
        hotSub.unsubscribe()

        refs--
        /**
         * When there's no more subscriptions then the `coldSub` can be
         * teared-down too.
         */
        if (refs === 0) {
          coldSub.unsubscribe()
          coldSub = null
        }
      }
    })
  }
}
