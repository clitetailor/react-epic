# Subscribe

Options schema for Subscribe.

| Property     | Alias        | Required | Default Value | Description                                                                                                                                                 |
| ------------ | ------------ | :------: | :-----------: | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| initialState | defaultValue |    -     |      {}       | Default value of the stream. Before the stream emit the first value. If no preload is provided, it will provide children render prop with its default state |
| preload      |              |    -     |     null      | If `preload` is provided, it will try to render with `preload` render prop first                                                                            |
| observer     |              |   true   |               | The stream to observe from                                                                                                                                  |
| children     |              |   true   |               | The main render prop. Rendered when stream values are emitted                                                                                               |

## Example with Subscribe

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
