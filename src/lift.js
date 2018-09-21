import { combineLatest } from 'rxjs'
import { map } from 'rxjs/operators'

export function lift(func) {
  return (...args) =>
    combineLatest(...args).pipe(map(args => func(...args)))
}
