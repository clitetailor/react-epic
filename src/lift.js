import { combineLatest } from 'rxjs'
import { map } from 'rxjs/operators'

/**
 * Lift an operator up to the RxJS computational space. For ex:
 * 
 * ```js   
 * 
 *    function add(a, b) {
 *      return a + b
 *    }
 * 
 *    const add$ = lift(add)
 *    add$(a$, b$).subscribe(a$)
 * 
 * ```
 * 
 * @param {Function} func 
 */
export function lift(func) {
  return (...args) =>
    combineLatest(...args).pipe(map(args => func(...args)))
}
