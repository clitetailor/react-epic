## Stream in RxJS Subject

Sometimes you may want a RxJS Subject acts like a Stream. For example:

```jsx
const createEntryPoint = api =>
  createSuject(switchMap(() => ajax.get(api)))

const todoEntryPoint$ = createEntryPoint('/todos')

todoEntryPoint$.subscribe(todos$)
todoEntryPoint$.next()
```

How can it be?! Actually, RxJS Subject has already done that:

```jsx
const increased = new Subject().pipe(map(number => number + 1))

increased.subscribe(val => console.log(val))
increased.next(1) // Output: 2
```

So with the entry point example, here is the implementation:

```jsx
const createEntryPoint = api =>
  new Subject().pipe(switctMap(() => ajax.get(api)))
```

## Browser History

One example application of this technique is to create a browser history API in RxJS. For example you would like something like this:

```jsx
const location$ = history$.pipe(pluck('location'))

history$.next(push('login'))
```

How to do that? I will push you further into the implementation of RxJS Operator:

```jsx
import { Subject } from 'rxjs'
import { createBrowserHistory } from 'history'

const createHistorySubject = history => {
  const action$ = new Subject()

  return action$.pipe(historyProxy(history))
}

function historyProxy(history) {
  return source => source.lift(new HistoryProxy(history))
}

class HistoryProxy {
  constructor(history) {
    this.history = history
  }

  call(subscriber, source) {
    const subscription = new Subscription(
      history.listen(location => subscriber.next(location))
    )
    subscription.add(
      source.subscribe(action => action(history))
    )
    return subscription
  }
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
