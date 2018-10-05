import React from 'react'
import { Subject } from 'rxjs'
import { switchMap, distinctUntilChanged } from 'rxjs/operators'
import { syncWithLast } from './sync'

export function createSubscribe() {
  class Subscribe extends React.Component {
    constructor(props) {
      super(props)

      this.observerListener = new Subject()

      this.state = {
        loaded: false,
        childProps:
          props.defaultValue || props.initialState || {}
      }

      this.onStateChange = this.onStateChange.bind(this)
    }

    componentDidMount() {
      this.subscription = this.observerListener
        .pipe(
          switchMap(observer => observer.pipe(syncWithLast())),
          /**
           * Provide some sort of memoization.
           *
           * TODO: Providing options for enhanced memoization on
           * `<Subscribe />`
           */
          distinctUntilChanged()
        )
        .subscribe(this.onStateChange)

      this.observerListener.next(this.props.observer)
    }

    onStateChange(childProps) {
      let newState = {
        childProps
      }

      if (!this.state.loaded) {
        newState.loaded = true
      }

      this.setState(newState)
    }

    /**
     * Always have to remember to render the props safetly. See Caveats:
     * https://reactjs.org/docs/render-props.html#using-props-other-than-render
     */
    render() {
      const {
        preload,
        children,
        defaultValue = {},
        initialState = defaultValue, // Some people may prefer initialState
        ...rest
      } = this.props
      const { childProps, loaded } = this.state
      return loaded
        ? children(
            childProps,
            /**
             * This actually solve the problem of passing context params
             * around.
             */
            rest
          )
        : this.props.preload
          ? preload()
          : children(initialState, rest)
    }

    componentDidUpdate(prevProps) {
      if (this.props.observer !== prevProps.observer) {
        /**
         * Remember change in observer may not trigger onStateChange.
         * Hint: Only observer contains new values does.
         */
        this.observerListener.next(nextProps.observer)
      }
    }

    componentWillUnmount() {
      this.subscription.unsubscribe()

      // Try to clean up
      this.subscription = null
      this.observerListener = null
    }
  }

  return Subscribe
}

export const Subscribe = createSubscribe()
