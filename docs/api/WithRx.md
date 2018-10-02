# WithRx

Options schema for WithRx.

| Property        | Alias        | Required |            Default Value             | Description                                                 |
| --------------- | ------------ | :------: | :----------------------------------: | ----------------------------------------------------------- |
| initialState    | defaultValue |    -     |                  {}                  | The default value of the stream                             |
| mapStoreToState |              |    -     |              () => ({})              | Inject the store value into HOC state                       |
| mapStoreToProps |              |    -     |              () => ({})              | Bind store's actions to component props                     |
| mergeProps      |              |    -     | Object.assign(state, actions, props) | Merge the store state, actions and component props together |
| preload         |              |    -     |                 null                 | Preload the component with render prop                      |

## Example with WithRx:

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
