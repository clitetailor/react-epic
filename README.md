<div align="center">
  
  # React Epic

  <img src="images/ReactEpic.png" alt="ReactEpic" width=36% height=36% />

Featured Subscriber and HOC for React & RxJS ✨🚀🤘👨‍🚀🐟🐠

</div>

[![Join the community on Spectrum](https://withspectrum.github.io/badge/badge.svg)](https://spectrum.chat/react-epic)

## Install

You can install React Epic by either using PNPM, Yarn or NPM:

```console
# PNPM
$ pnpm add react-epic

# Yarn
$ yarn add react-epic

# NPM
$ npm add react-epic
```

## What is React Epic?

React Epic is our attempt to integrate RxJS the easiest way into React without sacrificing the readability or bridging between React and Redux. By this way, you only have to write RxJS subscriptions (called **Epics**) then bind it to React and everything will run like a charm! 🌟

Our example, Tada ... :

```jsx
const todos$ = new BehaviorSubject([])

lift(
  todos$,
  addTodo$,
  (todos, newTodo) => todos.concat([newTodo])
).subcribe(todo$)

refetchTodos$.pipe(
  mergeMap(() => ajax.get('/todos'))
).subscribe(todo$)

@WithRx(
  ({ todos$ }) => ({ todos: todos$ }),
  ({ addTodo$, refetchTodos$ }) => ({ addTodo: addTodo$, refetchTodos: refetchTodos$ })
)
export class Todos extends Component { ... }
```

[![Edit react-epic-example-app](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/j710o084zv)

This library was influenced largely by Dart StreamBuilder, Redux Observable and React Redux!

## Documentation

For more information about documentation and FAQ, please visit [our friendly Wiki](/docs/README.md)!
