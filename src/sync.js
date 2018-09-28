import { Observable, ReplaySubject, Subject } from 'rxjs'

/**
 * Make an Observable fully forget all about the previous emitted values.
 */
export function sync() {
  return source => {
    const proxy = new Subject()

    let sourceSubscription
    let refs = 0
    return new Observable(observer => {
      /**
       * When there's a new subscription. If there's no refs the source
       * subscription will be created and being synced. This allow app
       * to resume from closed.
       */
      if (refs === 0) {
        /**
         * Evaluate all the previous items from source and listen for
         * new values.
         */
        sourceSubscription = source.subscribe(proxy)
      }
      ++refs

      /**
       * Subscribe for synced values from proxy.
       */
      const proxySubscription = proxy.subscribe(observer)

      let connected = true

      return () => {
        /**
         * Check whether the subscription has been teardown before.
         */
        if (connected === true) {
          --refs
          connected = false
          /**
           * When a subscription is teardown, its `proxySubscription` is
           * teardown too.
           */
          proxySubscription.unsubscribe()

          /**
           * When there's no more subscription then the `sourceSubscription`
           * can be teardown too.
           */
          if (refs === 0) {
            sourceSubscription.unsubscribe()
            sourceSubscription = null
          }
        }
      }
    })
  }
}

/**
 * Sync with the source stream, replay a number of previous items.
 */
export function syncAndReplay(count) {
  return source => {
    const proxy = new ReplaySubject(count)

    let sourceSubscription
    let refs = 0
    return new Observable(observer => {
      /**
       * When there's a new subscription. If there's no refs the source
       * subscription will be created and being synced. This allow app
       * to resume from closed.
       */
      if (refs === 0) {
        /**
         * Evaluate all the previous items from source and listen for
         * new values.
         */
        sourceSubscription = source.subscribe(proxy)
      }
      ++refs

      /**
       * Subscribe for synced values from proxy.
       */
      const proxySubscription = proxy.subscribe(observer)

      let connected = true

      return () => {
        /**
         * Check whether the subscription has been teardown before.
         */
        if (connected === true) {
          --refs
          connected = false
          /**
           * When a subscription is teardown, its `proxySubscription` is
           * teardown too.
           */
          proxySubscription.unsubscribe()

          /**
           * When there's no more subscription then the `sourceSubscription`
           * can be teardown too.
           */
          if (refs === 0) {
            sourceSubscription.unsubscribe()
            sourceSubscription = null
          }
        }
      }
    })
  }
}

/**
 * Sync with the source stream, and replay the last item.
 */
export const syncWithLast = syncAndReplay.bind(1)
