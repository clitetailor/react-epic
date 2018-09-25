# About Store and Dependency Injection

When you app size grows, chance you need to enlarge your store and sometimes, showing the relationships between parts of the store is so complex that maybe you will come with a decision choice is ... to have better understanding about the architecture of Store and DI in React Epic.

Actually, there're two ways of DI in React Epic. The first way is DI via import. This way you can cyclic inject dependencies between stores, subscribe from stores more and more ... without thinking much about the architecture of the store. The second way is DI via `runEpic`. You know that it is such an offical but detour way. I admit. The fact is `runEpic` is quite redundant. It's fine if you don't unsubscribe to an subscription even if the app have ended without any errors because. Any subscription in React DOM has been safetly unsubscribe via `<Subscribe />`. Even if you use `WithRx` decorator, it would use `<Subscribe />` internally. So even if your app have ended, the store system still works perfectly without DOM nodes. So the decision of whether to use `runEpic` is that: do you want your store system can still run after the React DOM have breakdown. It's fifty fifty choice. The fact that it's okey to leave the system runs after React DOM has cleaned-up and broken-down and if you want to share the store between React Apps to show that your app is brilliant, this is okey. But it's the very rare case.

The other thing to consider is would you like some hot reload systems to reuse the store after hot reload takes place. You may find the answer is no because old hot reload systems are usually placed at the root of your ReactDOM and store are usually recreated if you placed it inside root DOM node. For example this show how different between two versions:

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

For the first version. If you put `runEpic` inside `<Provider />` then, the subscriptions will be ended and recreate after the app has hot reloaded. What if you don't put `runEpic` inside `<Provider />`. The user data will not be intercepted and you can have some kind of fluency developing experience (The data are shared between the current and the previous version of your app). But for some other hot reloading system, like `webpack-serve` (they actually reload the page and use `history-api-fallback` to fallback to the last app history) so the result is not very optimistic. And mostly, in our real world app, we often provide the user with some UX experience, like when the browser is reloaded, the data will be refetched immediately so that the user don't see any different before and after the page is reloaded.

Now let we talk about the second version.

```jsx
ReactDOM.render(
  <Provider store={createStore()}>
    <App />
  </Provider>,
  document.querySelector('#root')
)
```

You can see if you `createStore` and subscribe directly inside `createStore` (means that we don't use `runEpic`) it means if React hot reload take place (the page is not reloaded, only React root element is replaced) there's a chance that the store system still runs after the app hot reloads. Like the old IE versions, there's can be some memory leaks (in theory) and maybe in the rare case, there're some performance impacts. Like when you're using `interval` and `console.log` there's a chance that `interval` and `console.log` still run somewhere in your app.

And if you use `runEpic` everything is fine because the subscriptions are unsubscribed all after the DOM is reloaded. The only thing i don't know is whether the store exists or will the garbage collector collects it all. That's why it put these lines inside my code:

```jsx
componentDidMount() {
  this.subscription = null
}
```

I just don't know do whether React do the same thing with `this.props.store`. That's what i have to check with React. Fun Fact: Garbage collector and third party libs are things that come up and authorize for everything that we don't know about or even we've done something wrong with it! 🤣

So about the architecture, i will tell you about how architecture should be in the next section.

## Store and DI architecture breakdown

Show to make it looks cleaner, here is how we create store:

```jsx
/**
 * Actually we don't need createStore, just to make it looks better for
 * us to focus
 */

function createStore() {
  return {}
}
```

So if you have multiple stores this is how it looks like:

```jsx
// The first one
function createCounter() {
  return {
    counter,
    increase,
    decrease,
    whateverStateOrActionThatWeNeed
  }
}

// The second one goes here!
function createTodos() {
  return {
    todos,
    addTodo,
    removeTodo,
    ...etc
  }
}

// And we have a global store:
function createStore() {
  return {
    counterStore: createCounter(), // Or even fancier
    ...createTodos()
  }
}
```

So how do we handle **cyclic dependency injection** between sub-stores? If you using import and no `runEpic` it's something like:

```jsx
counter$.pipe(distinct()).subscribe(todos$)

todos$.pipe(distinct()).subscribe(counter$)
```

It's sure that `runEpic` is a detour but how would it be for **cyclic dependency injection** to take place. There're three or four solutions for this. The first is to take the output of each store and put it into the other:

```jsx
const counterStore = createCounter()
const todosStore = createTodos()

todosStore.counter = counterStore.counter
counterStore.todos = todosStore.todos
```

The second way is to lift the state up:

```jsx
const todos = Subject()
const counter = Subject()

function createCounter(todos) {
  return {
    todos
  }
}

function createTodos(counter) {
  return {
    counter
  }
}
```

It's good if you want to shared some state internally without injecting it into React DOM:

```jsx
function createStore() {
  const sharedStore = createSharedStore()

  return {
    counterStore: createCounter(sharedStore),
    todosStore: createTodos(sharedStore)
  }
}
```

The above two way we can use injected stores internally inside one epic without having to make an alternative shared epic to another store but there's only one ceveat: That is your store will be tangled.

```jsx
/**
 * How we use shared state internally without alternative shared epic
 */
const rootEpic = combineEpics({
  counterStore: ({
    counter,
    todos /* shared todos state */
  }) => {
    /* vice */
  },
  todosStore: ({
    todos,
    counter /* shared counter state */
  }) => {
    /* and versa */
  }
})
```

The third way is to keep the internal epic internally and create an alternative epic to show their relationship:

```jsx
const rootEpic = combineEpics(
  {
    /* Internal epics for internally use */
    counterStore: () => {
      /* ... */
    },
    todosStore: () => {
      /* ... */
    }
  },
  /* Shared epic for extra relations */
  ({ counterStore, todosStore }) => {
    /* ... */
  }
)
```

That's some kind of brain twisted. 🤔

The fourth version i haven't come up with so contributions are welcome! 😄

Next: [React Epic Breakdown Cookbook](BreakdownCookbook.md)
