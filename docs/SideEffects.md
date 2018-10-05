# Pure Logics and Side Effects

So pure logic is something that i showed you with counter example where you can `increase`, `decrease` or `reset` the counter. But you might see that this is trivial to lift such pure functions into RxJS. Side-effects are actually what RxJS shine at.

```jsx
const refetch = () => ajax.get('/todos')
```

Actually, you don't have to reimplement such pure functions or lift them to RxJS space. For example, you have a component called `<TodoList />`. What you can do to avoid reimplementing all the logics is to lift the state up:

```jsx
<TodoList todos={todos} onStateChange={onStateChange} />
```

And wrap it inside a subscription:

```jsx
<Subscribe observer={todos$}>
  {todos => <TodoList todos={todos} onChange={onStateChange} />}
</Subscribe>
```

Then, you can have a common routine for pure logics:

```jsx
onStateChange(todos) {
  todos$.next(todos)
}
```

And seperate routines for side-effects to take place:

```jsx
const refetchTodos$ = new Subject()
refetchTodos$
  .pipe(switchMap(() => ajax.get('/todos')))
  .subscribe(todos$)

const refetchTodos = bindAction(refetchTodos$)
```
