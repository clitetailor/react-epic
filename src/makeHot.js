import { Subject, Observable } from 'rxjs'
import { finalize, takeLast } from 'rxjs/operators'

export function takeLastFromCold(cold) {
  return cold.pipe(
    finalize(),
    takeLast()
  )
}

/**
 * Working around over RxJS `publish` and `multicast` operators.
 * For example, the following lines should not log anything:
 *
 * ```js
 *
 *    of(1, 2, 3, 4).pipe(shared()).subscribe(val => console.log(val))
 *
 * ```
 */
export function makeHot() {
  return cold => {
    const proxy = new Subject(undefined)

    let coldSub
    let refs = 0
    return new Observable(observer => {
      /**
       * When there's a new subscription. If no hot sub is created then
       * the the cold sub will be created. This allow app to resume from
       * closed.
       */
      if (refs === 0) {
        /**
         * Evaluate all the previous items to make cold stream hot.
         */
        coldSub = cold.subscribe(proxy)
      }
      ++refs

      /**
       * Subject only emits items come after subscription. Every
       * subscription has its own hot sub.
       *
       * The `hotSub` is subscribed later than the `coldSub` in order
       * not to make last item being duplicated.
       */
      const hotSub = proxy.subscribe(observer)

      /**
       * Don't forget to take the last item from cold stream.
       */
      takeLastFromCold(cold).subscribe(observer)

      let connected = true

      return () => {
        /**
         * Check whether the subscription has been teardown before.
         */
        if (connected === true) {
          --refs
          connected = false
          /**
           * When a subscription is teardown, its hotSub is teared-down
           * too.
           */
          hotSub.unsubscribe()

          /**
           * When there's no more subscriptions then the `coldSub` can
           * be teared-down too.
           */
          if (refs === 0) {
            coldSub.unsubscribe()
            coldSub = null
          }
        }
      }
    })
  }
}
