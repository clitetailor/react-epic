# Bridging between Redux and React Epic

If you take a quick look of the library. You may realize that React Epic don't even need Redux or React Redux to work. It only need RxJS and React and React Context API.

But there's one problem that might make you to consider to use Redux is because React Epic is lack of tooling. You might love Redux devtool than React Epic. But we haven't have any section about how to use Redux in React Epic so you might come up with three approachs:

- The first approach is don't use React Epic but using MobX, using Redux Observer with Redux Cycles or use Redux Saga, etc.
- The second approach is to lift RxJS into Redux.
- The third approach is to lift Redux into RxJS.

So here we will talk about the second and the third approach.

## Lift RxJS into Redux

If you love Redux and React Redux you might come up with the solution is to use RxJS inside Redux. This solution is quite unpleasant but it's not possible. For example:

```jsx
const store = {
  counter: new BehaviorSubject(0),
  increase: new Subject(),
  decrease: new Subject(),
  reset: new Subject()
}

merge(
  lift(store.counter, store.increase, state => state + 1),
  lift(store.counter, store.decrease, state => state - 1),
  store.reset.pipe(mapTo(0))
).subscribe(store.counter)

function counterReducer(state = store, action) {
  switch (action.type) {
    case 'INCREASE': {
      state.increase.next()
      return state
    }

    case 'DECREASE': {
      state.decrease.next()
      return state
    }

    case 'RESET': {
      state.reset.next()
      return state
    }

    default:
      return state
  }
}
```

And then you can subscribe from ReactDOM:

```jsx
<Subscribe observer={this.props.counter}>
  {counter => <p>{counter}</p>}
</Subscribe>
```

However, you know that this is the critical way because it's not good to make any side-effects inside Redux reducer and using this way, you can not inspect Redux state either. So you might come to the third way.

## Lift Redux into RxJS

Actually, you don't need my guild to integrate Redux into RxJS. RxJS works quite well with Redux. But if you need my advice so here is it:

First you have to create a seperate Redux Store:

```jsx
import { createStore } from 'redux'

const counterReducer = function(state = 0, action) {
  switch (action.type) {
    case 'INCREMENT': {
      return state + 1
    }

    case 'DECREMENT': {
      return state - 1
    }

    case 'RESET': {
      return 0
    }

    default:
      return state
  }
}

const rootReducer = combineReducers({ counter: counterReducer })
const store = createStore(rootReducer)
```

Then bind it to React Epic Store:

```jsx
import { createAction } from 'react-epic'

const store$ = from(store)

const epicStore = {
  counter$: store$.pipe(pluck('counter')),
  increase$: new Subject(),
  decrease$: new Subject(),
  reset$: new Subject(),
  store
}

const counterEpic = ({
  counter$,
  increase$,
  decrease$,
  reset$,
  store
}) =>
  merge(
    createAction(increase$, () => ({
      type: 'INCREMENT'
    })),
    createAction(decrease$, () => ({
      type: 'DECREMENT'
    })),
    createAction(reset$, () => ({
      type: 'RESET'
    }))
  ).subscribe(action => store.dispatch(action))
```

`createAction` and `pipe(map())` work the same way except it is more semantic. You will see that in this case React Epic work the same way with Redux Observable but with more sugar. So this is an alternative option for you to choose. Remember, if your app is small and you don't need to fully inspect store or history navigation, you may not need Redux. You can use `tap` instead:

```jsx
import { tap } from 'rxjs/operators'

const counterEpic = ({ counter$, increase$ }) =>
  merge(
    counter$.pipe(tap(val => console.log(val))),
    lift(counter$, increase$, counter => counter + 1)
  ).subscribe(counter$)
```

However, integrating Redux is still addictive to me.

## The different between React Epic and Redux

React Epic and Redux work so much the same way. In Redux, you encapsulate all actions into objects and push all pure logics into reducers. Side-effects can be performed by using middlewares.

In React Epic, it works the same way. You encapsulate every action into an event stream. Both the pure logics and the side-effects can be translated into RxJS and handle in RxJS. Or you can seperate the pure logics into the UI and handle side-effects only with RxJS.

The cons of Redux is that because everything is encapsulated into an object so it is easy to profiling the data and navigating between versions of history. The cons is that it can be overloaded if you try to put everything and run everything at the same place. A lot of actions need to be encapsulated and state need to be computed a lot, too.

The pros of using RxJS is that you have the ultilities of RxJS operators and it's almost adequate in common problems. The cons is that it's not always easy to translate a function into RxJS style. It can be frustration to re-translate pure logic into RxJS, too. Running everything as stream is hard to debug especially if you unfortunately have done something wrong in RxJS without aware of it.
