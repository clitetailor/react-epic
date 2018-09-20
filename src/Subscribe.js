import { Component, Children } from 'react'
import { Subject, combineLatest } from 'rxjs'

export function createSubscribe() {
  const propTypes = {}

  class Subscribe extends Component {
    constructor(props, context) {
      super(props, context)

      this.observerListener = new Subject()
      this.childrenListener = new Subject()

      this.state = {
        loaded: false,
        children: null
      }
    }

    componentDidMount() {
      this.subscription = combineLatest(
        this.observerListener,
        this.childrenListener
      )
        .pipe(switchMap(this.renderChildren))
        .subscribe(this.onStateChange)
    }

    renderChildren = ([observer, children]) =>
      observer.pipe(map(props => children(props)))

    onStateChange = children => {
      let newState = {
        children
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
      return this.state.loaded
        ? Children.only(this.state.children)
        : this.props.preload
          ? this.props.preload
          : Children.only(
              this.props.children(
                this.props.defaultValue ||
                this.props.initialState || // Some people may prefer intialState
                  {}
              )
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

      if (this.props.children !== prevProps.children) {
        this.childrenListener.next(nextProps.children)
      }
    }

    componentWillUnmount() {
      this.subscription.unsubscribe()

      // Try to clean up
      this.subscription = null
      this.observerListener = null
      this.childrenListener = null
    }
  }

  return Subscribe
}

export const Subscribe = createSubscribe()
