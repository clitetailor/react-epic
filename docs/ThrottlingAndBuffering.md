# Throttling and Buffering State and Actions

There is a hard case that you want to `throttle` a stream but not based on time but based on its previous value. There's another name for it `distinctUntilChange`. It is so easy that you can `distinctUntilChange` and `throttle` for distinguished values. But what if what you want is reversed. For example, if you want to `throttle` the same values in 5 seconds and you want to let it being duplicated after 5 seconds. It's a very hard case.

So if the value is the same, we will throttle the stream. If not we will emit the value immediatly. The problem come up with another question is how to seperate the stream when the value stay the same. The operator is quite the same with `filter` that is `partition` but `partition` only return two streams. The other solution is to use `reduce` but `reduce` only take effect on completed stream.

So i come up with some thing more static. The same old friend `switchMap`. The stream will be switched if the value is distinct:

```jsx
actions.pipe(
  distinctUntilChange(),
  switchMap(a => actions)
)
```

Remember if you stream is not synced you may need to optimize your stream using `syncWithLast`:

```jsx
actions.pipe(syncWithLast())
```

<div id="SyncOperator"></div>

For more information about sync operator please visit: [Sync Operator](SyncOperator.md)

And then `throttle` that stream for 5 seconds:

```jsx
actions.pipe(
  syncWithLast()
  distinctUntilChange(),
  switchMap(a =>
    actions.pipe(
      syncWithLast(),
      throttle(5000)
    )
  )
)
```

## Throttle Actions and State Buffered Problem and the problem of Consensus

You may think it's easy to add throttle to the actions pipe. Yes, it is easy to add but it's not a easy decision to add throttle if it's what you means:

```jsx
actions.pipe(
  distinctUntilChange(),
  throttle(),
  switchMap(a => actions)
)
```

The reason here because you always want the lastest value of actions to be dispatched even if the state haven't change. At the same time, if the action come before the state haven't been changed it means one of two things:

- If the reason is that there's a bottom neck in the computation of the reducer so letting the distinguished values in is not a good solution. But you still need to add throttle with the above caution (you always want the lastest value of actions to be dispatched)
- If the reason is the state is throttle and buffered it means that there would be a big problem in your app. Why someone need the state to be throttle? Should you throttle or buffered the state?

Actually, there's another meaning of throttle and buffered. For example, instead of performing computation process, you make an ajax. So in order to make your state single source of truth, the ajax result should result in the state change that relies on the previous state. If you want to let other actions go in between the two events. You will need to perform diff and merge between two states based on two different actions history.

So how to determine when a new action come to the reducer, that another action is waiting in the process queue?! Yes, the question is exactly the answer, we need a process queue. So when a new action come two the reducer, it means that you have to check the process queue first. If the action is cancelable, and you want to cancel it, so you should send a cancel request first. And then remove the action from the action queue and replace the queue with your new actions.

But there's one problem is would you trust on your cancelation request. I means to cancel another pending response, we create a new pending request? It likes we are chasing our on tail?!

So the solution here is somewhat complex, you have to filter on your new actions, that which action is really need to cancel the previous request (the action that perform on the same state resource). It means that if the original request returns with success code and the cancelation request returns with a failure, you may have to remove the new actions and the new state (another cancelation) or the cancelation have to retry again and again until it's success. But in the other world for the server, it have received the successful resource request, it have received the new actions and state to update. Sadly this is the problem about consensus, and there's no real solution for it. Solutions only be like three handshaking or whatsoever.

The question is whether your approach should be centralization or decentralization. In the easiest case we can think about is centralization so your server should handle everything. It means that it should store the actions for the duration of time (The duration of time that it can reverse it actions). And when it receive the new actions, it should compare, if it result in disconsensus, it should result in failure and return failure code. Otherwise, there's no way to revert the previous actions. It means that there's no real cancelation at all. The best way is to make the app suspending using Execution Context technique that i showed you previously. If you want to archive better UX, you need to work harder into the problem of consensus. Which may force some of you to go back to the university and learn it again! 🤣

What about decentralization? There's no decentralization approach relies on a single client node only. And if there's, it means that the client have to wait longer to make an ultimate trust between servers. Or you will need to work harder on decentralized servers. That's what i can show you because it is also the limitation in my knowledge, too!

# The throttling problem in rendering process

There's another problem is about the slow of rendering process. It may contains some unwanted outer computation process but i want to focus on rendering process. It is somewhat different than making an ajax (ajax is much slower and don't result in the discontinuities of rendering. the discontinuitiy effect of rendering process can be used to block users from harming themself. it can be our another submission for our limitation 🤣). The ReactDOM is best single source of truth and can be overriden between the next and the previous state. Yes it's another consensus problem but in contrast, the rendering process is uncontrolable but controlable at the same time. It means that you can't control the speed of rendering process, but you know when the rendering process ended. So that you can propagate feed back to the state machine. At the state machine, when there's a feedback message (with the matched hash code). It means that the user has seen the result of the rendering state. So we can use this feedback message to throttle or delay the process of dispatching actions into reducer. Because if the rendering process is pending, we can presume that the dispatched actions are `ghost` actions (The user clicks before they see the result), we can remove them. This may be a misconception but this is a worth case to consider and investigate for better UX result.

Next Chapter: [Cascading Problem in React Epic](CascadingUpdate.md)
