import { Component, createContext, createElement } from 'react'
import hoistStatics from 'hoist-non-react-statics'
import { Subject, combineLatest } from 'rxjs'

import { Subscribe } from './Subscribe'

const { Provider: ContextProvider, Consumer } = createContext()

export class Provider extends Component {
  constructor(props) {
    super(props)

    this.state = {
      store: props.store || {}
    }
  }

  componentDidMount() {
    this.setState({
      store: this.props.runEpics.reduce(this.combineEpics)(
        this.store
      )
    })
  }

  combineEpics = (tail, head) => arg => tail(head(arg))

  render() {
    return createElement(ContextProvider, {
      value: this.state.store
    })
  }
}

export function withRx({
  defaultValue,
  preload,
  mapStoreToState,
  mapStoreToProps,
  mergeProps
}) {
  return function wrappedWithRx(WrappedComponent) {
    class RxWrapper extends Component {
      constructor(props) {
        super(props)

        this.propsListener = new Subject()

        this.state = {
          childProps: this.props
        }
      }

      componentDidMount() {
        this.subscription = this.propsListener.subscribe()
      }

      render() {
        return <Consumer>{this.subscribeFromContext}</Consumer>
      }

      subscribeFromContext = context => {
        return createElement(
          Subscribe,
          {
            defaultValue,
            preload,
            observer: combineLatest(
              mapStoreToState(context),
              this.propsListener
            )
          },
          this.subscribeFromObserver
        )
      }

      subscribeFromObserver = ([storeState, props]) =>
        createElement(
          WrappedComponent,
          mergeProps(
            storeState,
            mapStoreToProps(context),
            props
          )
        )

      componentDidUpdate(nextProps) {
        if (this.props !== nextProps) {
          this.propsListener.next(nextProps)
        }
      }

      componentWillUnmount() {
        this.subscription.unsubscribe()
      }
    }

    return hoistStatics(RxWrapper, WrappedComponent)
  }
}
