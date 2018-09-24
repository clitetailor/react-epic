import { Component, createContext, createElement } from 'react'
import { Subscription } from 'rxjs'
import hoistStatics from 'hoist-non-react-statics'

import { Subscribe } from './Subscribe'
import { combineSubscriptions } from './combineSubscriptions'
import { bindState } from './bindState'
import { bindActions } from './bindActions'

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

export function WithRx({
  defaultValue,
  initialState,
  preload,
  mapStateToProps = defaultMapToProps,
  mapActionsToProps = defaultMapToProps,
  mergeProps = defaultMergeProps
}) {
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