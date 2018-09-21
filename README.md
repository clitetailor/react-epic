# React Epic

## Install

You can install React Epic using PNPM, Yarn or NPM:

```console
# PNPM
$ pnpm add react-epic

# Yarn
$ yarn add react-epic

# NPM
$ npm add react-epic
```

## What is React Epic

React Epic is an attempt to integrate RxJS into React the easy way without bridging between React and Redux. By this way, you only have to write an RxJS description (Epic) and then, bind it with React.

For example:

```jsx
const messages$ = new BehaviorSubject([])

messsages$.pipe(
  switchMap(messages => addMessage$.pipe(
    map(newMessage => messages.push(newMessage))
  ))
).subscribe(messages$)

// ...

@withRx({
  mapStoreToState: ({ messages$ }) => bindState({ messages: messages$ }),
  mapStoreToProps: ({ addMessage$ }) => bindActions({ addMessage: addMessage$ })
})
export class Messages extends Component { ... }
```

## Examples

Your can either subscribe to a stream by using `<Subscribe />` or providing it with a **HOC** (Higher-Order-Component). Example using `<Subscribe />`:

```jsx
import React from 'react'
import { Subscribe } from 'react-epic

export class App extends React.Component {
  state = {
    todos: []
  }

  todos$ = new Subject()

  render() {
    return (
      <Subscribe
        initialState={this.state.todos}
        observer={this.todos$}
      >
        // Don't do this in your real app!
        {todos => <TodoList value={todos} />}
      </Subscribe>
    )
  }
}
```

## Dependency Injection with HOC

Furthermore, you can provide component DI by using **HOC** pattern:

```jsx
@withRx({
  initialState: {
    counter: 0
  },
  mapStoreToProps: ({ counter }) => bindState({ counter }),
  mapStoreToProps: ({ increase, decrease, reset }) => bindActions({ increase, decrease, reset })
})
export class Counter extends Component { ... }
```

And at the root component, you provide it with epics:

```jsx
ReactDOM.render(
  <Provider store={{}} runEpics={[
    counterEpic,
    browserHistoryEpic(history)
  ]}>
    <App />
  </Provider>
)
```
