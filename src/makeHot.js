import { takeLast, finalize } from 'rxjs/operators'

/**
 *  Return a collection contains only the last item from cold stream
 */
export function coldTakeLast(cold) {
  return cold.pipe(
    finalize(),
    takeLast()
  )
}

export function makeHotWithLastItem(cold) {
  const subject = new Subject()

  /**
   * Subject swallows Observable cold items.
   */
  let bridgeToColdSub

  let refs = 0
  return new Observable(observer => {
    /**
     * when there's new subscription. If no hot sub is created. This
     * subscribe for hot items from cold stream.
     */
    if (refs === 0) {
      bridgeToColdSub = cold.subscribe(subject)
    }
    refs++

    /**
     * Subscribe for the latest item from cold stream.
     */
    let coldSub = coldTakeLast(cold).subscribe(val => {
      observer.next(val)
      bridgeToColdSub = null
      coldSub.unsubscribe()
    })

    /**
     * Subject only emits items come after subscription. Every
     * subscription has its own hot sub.
     * 
     * The `hotSub` is subscribed later than the `coldSub` in order
     * not to make last item being duplicated.
     */
    const hotSub = subject.subscribe(observer)

    return () => {
      /**
       * When a subscription is teardown, its hotSub is teared-down too.
       */
      hotSub.unsubscribe()

      refs--
      /**
       * When there's no more subscriptions then the bridgeToColdSub can be
       * teared-down too.
       */
      if (refs === 0) {
        bridgeToColdSub.unsubscribe()
        bridgeToColdSub = null
      }
    }
  })
}
