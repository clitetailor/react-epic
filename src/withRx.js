import { Component, createContext, createElement } from 'react'
import { Subscription } from 'rxjs'
import hoistStatics from 'hoist-non-react-statics'

import { Subscribe } from './Subscribe'
import { combineSubscriptions } from './combineSubscriptions'
import { bindState } from './bindState'
import { bindActions } from './bindActions'
import { isFunction } from './isFunction'

const { Provider: ContextProvider, Consumer } = createContext()

export class Provider extends Component {
  constructor(props) {
    super(props)

    this.subscription = new Subscription()
  }

  componentDidMount() {
    if (this.props.runEpic) {
      this.subscription.add(
        this.props.runEpic(this.props.store)
      )
    }

    if (this.props.runEpics) {
      this.subscription.add(
        combineSubscriptions(
          this.props.runEpics.map(epic =>
            epic(this.props.store)
          )
        )
      )
    }
  }

  render() {
    return createElement(
      ContextProvider,
      {
        value: this.props.store
      },
      this.props.children
    )
  }

  componentWillUnmount() {
    this.subscription.unsubscribe()
  }
}

export function defaultMergeProps(state, props, originalProps) {
  return Object.assign({}, state, props, originalProps)
}

export function defaultMapToProps() {
  return {}
}

export function WithRx(
  initialDefaultValue,
  initialMapStateToProps,
  initialMapActionsToProps,
  initialMergeProps,
  extraOptions
) {
  let withRxOptions

  if (isFunction(initialDefaultValue)) {
    withRxOptions = {}

    withRxOptions.mapStateToProps = initialDefaultValue
    if (initialMapStateToProps) {
      withRxOptions.mapActionsToProps = initialMapStateToProps
    }
    if (initialMapActionsToProps) {
      withRxOptions.mergeProps = initialMapActionsToProps
    }

    if (initialMergeProps) {
      extraOptions = initialMergeProps
      Object.assign(withRxOptions, extraOptions)
    }
  } else if (isFunction(initialMapStateToProps)) {
    // Default version of WithRx

    withRxOptions = {
      initialState: initialDefaultValue,
      mapStateToProps: initialMapStateToProps,
      mapActionsToProps: initialMapActionsToProps,
      mergeProps: initialMergeProps
    }

    if (extraOptions) {
      Object.assign(withRxOptions, extraOptions)
    }
  } else {
    withRxOptions = initialDefaultValue

    if (initialMapStateToProps) {
      extraOptions = initialMapStateToProps
      Object.assign(withRxOptions, extraOptions)
    }
  }

  /**
   * Version with first preload argument is considered unsafe so if you
   * want to use preload, use the first version with extraOptions.
   */

  const {
    defaultValue,
    initialState,
    preload,
    mapStateToProps = defaultMapToProps,
    mapActionsToProps = defaultMapToProps,
    mergeProps = defaultMergeProps
  } = withRxOptions

  return function wrappedWithRx(WrappedComponent) {
    class RxWrapper extends Component {
      constructor(props) {
        super(props)

        this.state = {
          childProps: this.props
        }

        this.subscribeFromContext = this.subscribeFromContext.bind(
          this
        )
        this.subscribeFromObserver = this.subscribeFromObserver.bind(
          this
        )
      }

      render() {
        return createElement(
          Consumer,
          null,
          this.subscribeFromContext
        )
      }

      subscribeFromContext(context) {
        return createElement(
          Subscribe,
          {
            initialState: defaultValue || initialState,
            preload,
            observer: bindState(mapStateToProps(context)),
            args: [context]
          },
          this.subscribeFromObserver
        )
      }

      subscribeFromObserver(storeState, context) {
        return createElement(
          WrappedComponent,
          mergeProps(
            storeState,
            bindActions(mapActionsToProps(context)),
            this.props
          )
        )
      }
    }

    return RxWrapper
  }
}
