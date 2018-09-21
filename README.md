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

## How it works?

## Examples

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
        {todos => <Counter value={todos} />}
      </Subscribe>
    )
  }
}
```
