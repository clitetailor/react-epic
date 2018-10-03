# React Epic Breakdown Cookbook

Note:

- The article is long but it's worth to read so enjoy! 🤣
- These following knowledges come from the Haskell community, what i do is just to create this library.

To have a basic React Epic breakdown, we come back to the basic simple React Counter app logic:

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

The pure counter app works fine because it don't contain any logic that need side-effects to take place. And when side-effects come in type of streams, that when you need RxJS.

You might think, why don't we just do something in the pure computational logic first and then subscribe from RxJS later. Actually that's what i'm thinking. Like, if your component is pure. So let it be pure. And where you need to app processes side-effects you subscribe to the effects later.

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
const refetchEpic = refetch$
  .pipe(
    switchMap(() => ajax.get('/todos')),
    handleError
  )
  .subscribe(todos$)
```

This is a perfect design.

Sometimes, you may need to define a pure logic inside side-effect logics. We provide you the `lift` operator:

```jsx
const addTodoEpic = ({ todos$, addTodo$ }) =>
  lift(todos$, addTodo$, (todos, newTodo) =>
    todos.concat([newTodo])
  ).subscribe(todos$)
```

## What about Redux?

Redux is not bad at all. Actually, i have hated Redux before but now i love it. There are two things Redux force us to do (not Redux does for us as many people confuse). First is to Encapsulate the actions stream so that we can recreate the actions on remote server and replay it (not undo it. the real undo is to caculate the previous state based on the current state. so that we have to reverse the reducer and the actions stream to archive this. what we usually do is to store the reference to the previous states and unpop it). The second benefit is that you have to put the app logics together so that you have to design the system in its very own core. From the Inside out, not Outside in as we usually do (But sometimes shared state is evil so do this with caution).

The problems come to Redux is first, it cannot lift the side-effects into Redux itself. That why we need Redux Saga, Redux Observable, etc. The second problem come to Redux is that it is so expensive to encapsulate every single actions in your app logic. Sometimes, actions stream is only to report errors so it's unnecessary to encapsulate all of them.

<div id="ReduxBridging"></div>

## Bridging between Redux and React Epic

Redux is great at tooling. So if you love to Redux with RxJS, i have three solutions for you. The first is as we said, we can use libraries like Redux Observer, MobX, Redux Saga, etc, .... That's probably what you don't want me to talk about here!

The second solution is to lift RxJS into Redux. How can it be?!

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

This way, you can not inspect the internal state in Redux devtools and we **still** have to subscribe the state using React Epic:

```jsx
return (
  <Subscribe observer={this.props.counter}>
    {_counter => { ... }}
  </Subscribe>
)
```

So you may come up with the third way. Is to lift Redux into RxJS. Actually, i have prepared a bridge between React Epic and Redux for you:

```jsx
function createEpicStore() {
  return {
    store: createStore(), // Create Redux Store
    addTodo$: new Subject(),
    refetchSuccessful$: new Subject()
  }
}

const reduxEpics = ({ store, addTodos$, refetchSuccessful$ }) =>
  merge(
    createAction(addTodos$, payload => {
      type: 'ADD_TODO', payload
    }),
    createAction(refetchSuccesful$, payload => {
      type: 'RESET_TODOS', payload
    })
  ).subscribe(action => store.dispatch(action))

/**
 * This one is a litte bit tricky
 */
const mapStateToProps = ({ store }) => ({
  todos: from(store).pluck('todos')
})

/**
 * Or it can be even more trickier. You can bind the store states
 * directly into React Epic Store
 */
import { from } from 'rxjs'

function createEpicStore() {
  const store = createStore() // Create Redux Store
  const store$ = from(store)

  return {
    store,
    /**
     * But remember this states are Observables, not Subjects. If you
     * want to update state, you have to do it via action.
     */
    todos$: store$.pipe(pluck('todos'))
  }
}
```

It should work the same way with Redux Observable and React Redux does.

That's it. That's how Redux works inside React Epic. Remember, we got another version of how a reducer likes in React Epic:

```jsx
lift(state$, action$, (state, action) => newState).subscribe(
  state$
)
```

So be clear and thoughtful, just don't be overwhelming (That would probably what we don't want you to be). Enjoy! 😄

Next Chapter: [Lift Behind the Scene](LiftBehindTheScene.md)

To top: [Table of Contents](Wiki.md)
