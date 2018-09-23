# API Reference

React Epic provides two ways to subscribe to a stream: By either using `<Subscribe />` or providing a component with a HOC via `withRx`. Furthermore, there're three utilities to work with state and actions binding are `bindState`, `bindAction` and `bindActions`.

## Subscribe

Options schema for Subscribe.

| Property     | Alias        | Required | Default Value | Description                                                                                                                                                 |
| ------------ | ------------ | :------: | :-----------: | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| initialState | defaultValue |    -     |      {}       | Default value of the stream. Before the stream emit the first value. If no preload is provided, it will provide children render prop with its default state |
| preload      |              |    -     |     null      | If `preload` is provided, it will try to render with `preload` render prop first                                                                            |
| observer     |              |   true   |               | The stream to observe from                                                                                                                                  |
| children     |              |   true   |               | The main render prop. Rendered when stream values are emitted                                                                                               |

### Example with Subscribe

```jsx
export class Counter extends Component {
  state = {
    counter: 0
  }

  counter$ = new BehaviorSubject(0)

  render() {
    return (
      <Subscribe
        observer={counter$}
        defaultValue={this.state.counter}
      >
        {counter => (
          <p>
            <b>Counter: </b>
            {counter}
          </p>
        )}
      </Subscribe>
    )
  }
}
```

## Provider

Options schema for Provider.

| Property | Alias | Required | Default Value | Description                              |
| -------- | ----- | :------: | :-----------: | ---------------------------------------- |
| store    |       |    -     |      {}       | Provide the app with a store             |
| runEpic  |       |    -     |       -       | Run store epic                           |
| runEpics |       |    -     |       -       | Run store epics if there're many of them |

### Example with Provider

```jsx
<Provider store={createStore()} runEpics={[counterEpic]}>
  <CounterApp />
</Provider>
```

## HOC or Dependency Injection

Options schema for WithRx.

| Property        | Alias        | Required |            Default Value             | Description                                                 |
| --------------- | ------------ | :------: | :----------------------------------: | ----------------------------------------------------------- |
| initialState    | defaultValue |    -     |                  {}                  | The default value of the stream                             |
| mapStoreToState |              |    -     |              () => ({})              | Inject the store value into HOC state                       |
| mapStoreToProps |              |    -     |              () => ({})              | Bind store's actions to component props                     |
| mergeProps      |              |    -     | Object.assign(state, actions, props) | Merge the store state, actions and component props together |
| preload         |              |    -     |                 null                 | Preload the component with render prop                      |

### Example with WithRx:

```jsx
@WithRx({
  initialState: {
    counter: 0
  },
  mapStateToProps: ({ counter$ }) => ({ counter: counter$ }),
  mapActionsToProps: ({ increase$, decrease$, reset$ }) => ({
    increase: increase$,
    decrease: decrease$,
    reset: reset$
  })
})
export class CounterApp extends Component {
  /* ... */
}
```

Next: [Handling Error](HandlingError.md)
