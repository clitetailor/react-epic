import { Component, Children } from 'react'
import { Subject } from 'rxjs'
import { switchMap } from 'rxjs/operators'

export function createSubscribe() {
  class Subscribe extends Component {
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
        .pipe(switchMap(observer => observer))
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
      const args = this.props.args || []
      return this.state.loaded
        ? this.props.children(
            this.state.childProps,
            /**
             * This actually solve the problem of passing context around.
             */
            ...args
          )
        : this.props.preload
          ? this.props.preload()
          : this.props.children(
              this.props.defaultValue ||
              this.props.initialState || // Some people may prefer initialState
                {},
              ...args
            )
    }

    componentDidUpdate(prevProps) {
      if (this.props.observer !== prevProps.observer) {
        /**
         * Remember change in observer may not trigger onStateChange.
         * Hint: Only observer contains values does.
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
