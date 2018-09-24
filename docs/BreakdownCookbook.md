# React Epic Breakdown Cookbook

Note:

- The article is long (119 lines exactly) but it's worth to read so enjoy! 🤣
- These following knowledges come from Haskell community, what i do is just to create this library.

To come to the basic React Epic breakdown, we come back to the basic simple React Counter app logic:

```jsx
const counter = 0

const increase = counter => counter + 1
const decrease = counter => counter - 1
const reset = counter => 0
```

As you might think: "Oh great, so why we don't put that off and just bind the operators to React DOM. Is that easier?"

It is only half of the truth, you're missing one condition: Your app don't contain any side-effects. For example:

```js
const refreshTodos = () => refetchTodos().then(setState)
```

The counter app works fine because it don't contain any logic that need side-effects to take place. And when side-effects come in type of streams, that when you need RxJS.

You might think, why don't we just do something in the pure computational logic first and then subscribe from RxJS latter. Actually that's what i thinking. Like, if your component is pure. So let it be pure. And where you need to app process side-effects you subscribe to the effects latter.

For example, the `<TodoList />` logic is pure. But when the todos need to contains some side-effect logics. It would be something like this:

```jsx
<Subscribe observer={todos$}>
  {todos => <TodoList todos={todos} />}
</Subscribe>
```

A seperate logic inside `<TodoList />`:

```jsx
addTodo = newTodo =>
  this.setState({ todos: this.state.todos.concat([newTodo]) })
```

And a seperate side-effect logic for todos app:

```jsx
const refetchEpic = todos$ =>
  ajax
    .get('/todos')
    // Handle error
    .subscribe(todos$)
```

Sometimes, you need to define a pure logic inside side-effect logics. We provide you a `lift` operator:

```jsx
const addTodoEpic = ({ todos$, addTodo$ }) =>
  lift(todos$, addTodo$, (todos, newTodo) =>
    todos.concat([newTodo])
  ).subscribe(todos$)
```

## What about Redux?

Redux is not bad at all. Actually, i have hated Redux before but now i love it. There are two things Redux force us to do (not Redux does for us as many people confuse). First is to Encapsulate the events stream so that we can recreate the actions stream on remote server and replay it (not undo it. the real undo is to caculate the previous state based on the current state. so that we have to do is to reverse the reducer and the actions stream to archive the real undo. what we usually do is to store the reference to the previous states and unpop it). The second is to put app logics together so that you have to design the system in its very own core. It is from Inside out (not Outside in as we usually do with Angular DI).

The problems come to Redux is first, you can not lift the side-effects into Redux yourself. That why we need Redux Saga, Redux Observable, etc. The second problem come to Redux is that it is so expensive to encapsulate every single actions in your app logic. Sometimes, actions stream is only to report errors so it's unnecessary to encapsulate all of theme.

But you may miss Redux some day. So if you still love Redux, there're three solution to overcome this. The first is to use library like Redux Observer, MobX, Redux Saga. The second solution is to lift Redux into RxJS. The third solution (You can guess) is to lift RxJS into Redux. Can it be?!

The answer is yes. Imagine this is the reducer and how it swallows the actions stream:

```js
function counterReducer({
  counter = new BehaviorSubject(0),
  increase = new Subject()
}, action) {
  switch (action) {
    case INCREASE: {
      increase.next(action.value)
      return state
    }
  }
}

function counterMiddleware = store => {
  const { counter, increase } = store.getState()

  counter.pipe(
    switchMap(_counter => increase.map(() => _counter + 1))
  )

  return next => action => next(action)
}
```

And we **still** have to subscribe the state using React Epic (Sorry about this **still** word):

```jsx
return (
  <Subscribe observer={this.props.counter}>
    {_counter => { ... }}
  </Subscribe>
)
```

The second way, is to lift Redux into RxJS. Actually, i have prepared a bridge between React Epic and Redux (For people who love Redux tooling):

```jsx
function createEpicStore() {
  return {
    store: createStore(), // Create Redux Store
    addTodo$: new Subject(),
    refetchSuccessful$: new Subject()
  }
}

const reduxEpics = ({ store, addTodos$, refetchSuccessful$ }) => merge(
  createAction(addTodos$, action => {
    type: 'ADD_TODO',
    payload: action
  }),
  createAction(refetchSuccesful$, action => {
    type: 'RESET_TODOS',
    payload: action
  })
).subscribe(store.dispatch)

/**
 * This one is a litte bit tricky
 */
const mapStateToProps = ({ store }) => createState(store, ({ todos }) => ({ todos }))
```

Remember, we got another example of how a reducer would be:

```jsx
lift(state$, action$, (state, action) => newState).subscribe(
  state$
)
```

So be clear and thoughtful, just don't be overwhelming (That would probably what we don't want you to be). Enjoy! 😄

Next Chapter: [Lift Behind the Scene](LiftBehindTheScene.md)
