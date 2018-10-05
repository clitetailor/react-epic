# Store and DI Architectures

When you app size grows, chance you need to enlarge the store. Sometimes, showing the relationships between parts of the store is so complex that maybe you want to have a better understanding about the architecture of Store and DI in React Epic.

There're two ways to work with DI in React Epic. The natural way and the offical way. The natural way is you just connect parts of the store not using `runEpic` and the offical way is to use `runEpic`. You know that `runEpic` is such a detour way and seems to be redundant. It's fine if you don't unsubscribe to a subscription even if the app have ended without any errors because. Any subscription in React DOM has been safetly unsubscribe via `<Subscribe />`. Even if you use `WithRx` decorator, it would use `<Subscribe />` internally. So if your app have ended, the store system still works perfectly without DOM nodes. So the decision of whether to use `runEpic` is that: do you want your store system can run after React DOM have breakdown. It's fifty fifty choice. The fact that it's okey to leave the system runs after React DOM has cleaned-up or if you want to share the store between React Apps to show that your app is brilliant (for example, you have multiple ReactDOM mount points so that you can pick any of them anywhere in your app). But it's the very rare case.

Another reason to consider is would you like your store to be reused after you browser hot reload. For example this show how different between two versions:

```jsx
const store = createStore()

hot.accept(App => {
  ReactDOM.render(
    <Provider store={store}>
      <App />
    </Provider>,
    document.querySelector('#root')
  )
})
```

And:

```jsx
ReactDOM.render(
  <Provider store={createStore()}>
    <App />
  </Provider>,
  document.querySelector('#root')
)
```

The fact is that almost hot reload system nowaday can be either in browser reload or website reload totally in combination with `fallback-history-api`. And if the user decide to reload the page. Everything can happen. So it should be safer and easier to manage logics if you can put all the logics into one place. And we will need to show you how to manage the store efficently.

## Store internal dependency injection

So to have a cleaner look, here is how we create the store:

```jsx
function createStore() {
  return {}
}
```

So if you have multiple parts of the store this is how it looks like:

```jsx
function createCounterStore() {
  return {
    counter
  }
}

function createTodoStore() {
  return {
    todos,
    addTodo,
    removeTodo,
    ...etc
  }
}

function createStore() {
  return {
    counterStore: createCounter(),
    todoStore: createTodos()
  }
}
```

So how do we handle **Dependency Injection** or even **Cyclic Dependency Injection** between parts of the store? If you don't use `runEpic` it may look like this:

```jsx
function createStore() {
  const counterStore = createCounter()
  const todoStore = createTodos()

  todoStore.todos
    .pipe(
      pluck('length'),
      distinctUntilChanged()
    )
    .subscribe(counterStore.counter)

  return {
    counterStore,
    todoStore
  }
}
```

If you use `runEpic`, it may look better:

```jsx
const shareEpic = ({ counterStore, todoStore }) =>
  todoStore.todos
    .pipe(
      pluck('length'),
      distinctUntilChanged()
    )
    .subscribe(counterStore.counter)

const rootEpic = combineEpics(
  {
    counterStore: counterEpic,
    todoStore: todoEpic
  },
  shareEpic
)
```

In the most cases, you may want to keep you store structure flat. However, if you need some advance tools to work with deep nesting state, consider using [Reselect](https://github.com/reduxjs/reselect).
