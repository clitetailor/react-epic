# Convert a Stream into a Subject

Sometimes you may want to make a RxJS Subject acts like a Stream. Or in another word, you want to encapsulate a stream into a Subject. For example:

```jsx
const todoEntryPoint$ = createEntryPoint('/todos')

todoEntryPoint$.subscribe(todos => {
  // Return the todo list fetched from the http entry point
})
todoEntryPoint$.next()
```

How can it be?! Actually, RxJS Subject has already done that:

```jsx
const increased = new Subject().pipe(map(number => number + 1))

increased.subscribe(val => console.log(val)) // Output: 2
increased.next(1)
```

So with the entry point example, here is the implementation:

```jsx
const createEntryPoint = api =>
  new Subject().pipe(
    switctMap(() => ajax.get(api)),
    share() // Optimize the shared stream
  )
```

## Browser History

One example application of this technique is to create a browser history API in RxJS. For example we want that everytime we push a new action into the history Subject, we want it to perform the action on the wrapped history, then notify the subscribers with the new value. The most important thing is that we want to encapsulate all these behaviors into one single object. How would we do that?

```jsx
const location$ = history$.pipe(pluck('location'))

history$.subscribe(location => {
  // Return a new location
})
history$.next(push('login'))
```

To do this, we need some advance knowledge of how to create a custom operator in RxJS. First, we need a type class to wrap our history object. I will call it the `HistoryProxy`:

```jsx
class HistoryProxy {
  constructor(history) {
    this.history = history
  }

  call(subscriber, source) {
    // Listen for changes to the history
    const subscription = new Subscription(
      history.listen(location => subscriber.next(location))
    )

    // Dipatch history actions to the wrapped history instance
    subscription.add(
      source.subscribe(action => action(history))
    )
    return subscription
  }
}
```

The `call` method wil be called when we pass the operator to `Subject.pipe`. To preserve `source` as a Subject we use `source.lift` so the final instance of the operator will look like this:

```jsx
function historyProxy(history) {
  return source => source.lift(new HistoryProxy(history))
}
```

```jsx
import { Subject } from 'rxjs'
import { share } from 'rxjs/operators'
import { createBrowserHistory } from 'history'

const createHistorySubject = history => {
  const action$ = new Subject() // Receive and dispatch history actions

  return action$.pipe(
    historyProxy(history),
    share() // Don't forget to share stream for optimization 
  )
}

const history$ = createHistorySubject(createBrowserHistory())

const push = location => history => history.push(location)
const pop = () => history => history.pop()
```

And now, we already have our own version of history api in RxJS:

```jsx
history$.next(push(location))
history$.next(pop())
```

However, in React Epic you will only need to do this either:

```jsx
const historyStore = {
  history$: new Observable(observer => {
    history.listen(() => observer.next(history))
  }),
  push$: new Subject(),
  pop$: new Subject(),
  history
}

const historyEpic = ({ history$, push$, pop$, history }) =>
  merge(
    createAction(push$, location => history.push(location)),
    createAction(pop$, () => history.pop())
  ).subscribe()
```

## Http Entry Points

It's trivial to create a Subject attached to an operator or a list of operators. However, when you have a ton of Subjects and methods like http entry points and you will soon tired of creating subject and rewriting operators. It's time we need an entry point generator:

```jsx
const refetchTodo$ = createGetEntryPoint('/todos')
const postMail = createPostEntryPoint('/mail')
const resetTimer = createGetEntryPoint('/timer')
/* ... */

const combinedEpic = ({
  refetchTodo$,
  todo$,
  postMail$,
  mails$
}) =>
  combineSubscriptions(
    refetchTodo$.subscribe(todo$),

    lift(mails$, postMail$, (mails, mailResponse) =>
      mails.update([mailResponse])
    ).subscribe(mails$)
  )
```
