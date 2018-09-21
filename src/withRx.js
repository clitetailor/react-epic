import { Component, createContext, createElement } from 'react'
import hoistStatics from 'hoist-non-react-statics'
import { Subject, combineLatest } from 'rxjs'

import { Subscribe } from './Subscribe'

const { Provider: ContextProvider, Consumer } = createContext()

export class Provider extends Component {
  combineEpics(tail, head) {
    return function(arg) {
      return tail(head(arg))
    }
  }

  render() {
    return createElement(
      ContextProvider,
      {
        /**
         * This line execution should be pure. Otherwise,
         * bad things may happen!
         */
        value: this.props.runEpics.reduce(this.combineEpics)(
          this.props.store || {}
        )
      },
      this.props.children
    )
  }
}

export function defaultMergeProps(state, props, originalProps) {
  return Object.assign({}, state, props, originalProps)
}

export function withRx({
  defaultValue,
  initialState,
  preload,
  mapStoreToState,
  mapStoreToProps,
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
            observer: mapStoreToState(context),
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
            mapStoreToProps(context),
            this.props
          )
        )
      }
    }

    return RxWrapper
  }
}
