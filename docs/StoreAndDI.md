# Store and More on Dependency Injection

When you app size grows, chance you need to enlarge your store and sometimes, showing the relationship between parts of store is so complex that maybe you will come with a decide choice to understand better the architecture of DI and how it works in React Epic.

Actually, there're two ways of DI. The first way is via import. This way you can recursive dependencies inject between store, subscribe and etc, ... without thinking much about the architecture. The second way is via `runEpic`. You know that it is such an offical but detour way. I admit. The fact is `runEpic` is quite redundant. It's fine if you don't unsubscribe even if the app have ended without any errors because. Any subscription in React DOM has been safetly unsubscribe using `<Subscribe />` and even if you use `WithRx` decorator, it uses `<Subscribe />` internally. So even if your app have ended, the store system still works perfectly without DOM nodes. So the decision of whether to use `runEpic` is do you want your store system can still run after the React DOM have breakdown. It's fifty fifty choice. The fact that it's okey to leave the system runs after React DOM has breakdown and if you want to share the store between React Apps to show the effects is brilliant. But it's a very rare case.

The other thing to consider is would some hot reload system reuses the store after hot reload take place. You may fine the answer is no because old hot reload system usually placed at the root of your ReactDOM and store are usually recreated if you placed it inside root DOM node. For example this show how different between two versions:

```jsx
const store = createStore()

hot.accept(() => {
  /* Do something crazy here! */
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

For the first version. If you put `runEpic` inside `<Provider />` then, the subscription will ended and recreated after the app hot reload. And if you don't put `runEpic` inside `<Provider />` then the user data will not be intercepted and you can have some kind of fluency developing experience. But for some hot reloading system, like `webpack-serve`, they actually reload the page and using `history-api-fallback` so the result is not so optimistic. And mostly, in our real world app, we often want to provide the user with UX experience so even if the browser is reloaded, the data will be refetch immediately so that the user don't see any different in result when they reload the app so it's the rare case that you do so.

Now let we take about the second version. If you `createStore` and put subscriptions inside `createStore` (means outside of `runEpic`) it means that if you use the React hot reload system (not server hot reload). There's a chance that the store system still runs after hot reload. Like on the old IE versions, there's can be some memory leaks and maybe (in the rare case) performance impact (like when you're using interval, there's chance that `interval` and `console.log` still run somewhere in your app i guess). And if you use `runEpic` everything is fine because the subscriptions is unsubscribed all the way. The only thing i don't know is still the store exists or will the garbage collector collects it all the way down. That's why it put these lines inside my code:

```jsx
componentDidMount() {
  this.subscription = null
}
```

I just don't know do whether React do the same thing with `this.props.store`. That's what i have to check with React. (Garbage collector and third party libs are things that come up and authorize for everything that we don't know about or even we've done something wrong with it 🤣)

So about the architecture, i will tell you about how store and DI works next.

## Store and DI breakdown

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
function createCounter() {
  return {
    counter,
    increase,
    decrease,
    whateverStateOrActionThatWeNeed
  }
}

/**
 * Another app goes here!
 */
function createTodos() {
  return {
    todos,
    addTodo,
    removeTodo,
    ...etc
  }
}

/**
 * And we have a global store:
 */
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

todos$
  .pipe(
    distinceUntilChange(
      (previousTodos, todos) =>
        todos.length === previousTodos.length + 1
    ) // Just a joke, don't do this
  )
  .subscribe(counter$)
```

It's sure that `runEpic` is a detour way but how it would be for **cyclic dependency injection** to take place. There're three or four solutions. The first is to take the output of each store and put it into the other:

```jsx
const counterStore = createCounter()
const todosStore = createTodos()

todosStore.counter = counterStore.counter
counterStore.todos = todosStore.todos
```

The second way is to lift the state up:

```jsx
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

The above two way we can use injected vars internally inside one epic without having to make an alternative shared epic but there's one defect is that your store is tangled.

```jsx
/**
 * How we use shared state internally without alternative shared epic
 */
const rootEpic = combineEpics({
  counterStore: ({ counter, todos }) => {
    /* vice */
  },
  todosStore: ({ todos, counter }) => {
    /* and versa */
  }
})
```

The third way is to keep the internal epic internally and create an alternative epic to show their relations:

```jsx
const rootEpic = combineEpics(
  {
    counterStore: () => ({}),
    todosStore: () => ({})
  },
  ({ counterStore, todosStore }) => {
    /* hi! */
  }
)
```

That's some kind of brain twisted. 🤔

The fourth version i haven't come up with so contributions are welcome! 😄

Next: [React Epic Breakdown Cookbook](BreakdownCookbook.md)
