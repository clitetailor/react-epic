import { map } from 'rxjs'

import { bindState } from './bindState'

function createState(state$, func) {
  return bindState({ state$ }).pipe(
    map(({ state$ }) => func(state$))
  )
}
