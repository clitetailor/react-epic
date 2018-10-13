import React, { createContext } from 'react'
import { Subscription } from 'rxjs'
import hoistStatics from 'hoist-non-react-statics'

import { Subscribe } from './Subscribe'
import { combineSubscriptions } from './combineSubscriptions'
import { bindState } from './bindState'
import { bindActions } from './bindActions'
import { isFunction } from './isFunction'

const { Provider: ContextProvider, Consumer } = createContext()

export class Provider extends React.Component {
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
    return (
      <ContextProvider value={this.props.store}>
        {this.props.children}
      </ContextProvider>
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
    class RxWrapper extends React.Component {
      constructor(props) {
        super(props)

        this.state = {
          childProps: this.props
        }
      }

      render() {
        return <Consumer>{this.renderContext}</Consumer>
      }

      renderContext = context => {
        return (
          <Subscribe
            initialState={defaultValue || initialState}
            preload={preload}
            observer={bindState(mapStateToProps(context))}
            context={context}
          >
            {this.renderObserver}
          </Subscribe>
        )
      }

      renderObserver = (storeState, { context }) => {
        return (
          <WrappedComponent
            {...mergeProps(
              storeState,
              bindActions(mapActionsToProps(context)),
              this.props
            )}
          />
        )
      }
    }

    return hoistStatics(RxWrapper, WrappedComponent)
  }
}
