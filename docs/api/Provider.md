# Provider

Options schema for Provider.

| Property | Alias | Required | Default Value | Description                              |
| -------- | ----- | :------: | :-----------: | ---------------------------------------- |
| store    |       |    -     |      {}       | Provide the app with a store             |
| runEpic  |       |    -     |       -       | Run store epic                           |
| runEpics |       |    -     |       -       | Run store epics if there're many of them |

## Example with Provider

```jsx
<Provider store={createStore()} runEpics={[counterEpic]}>
  <CounterApp />
</Provider>
```
