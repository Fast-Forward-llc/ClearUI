# Common.js

Shared utility functions, classes, and helpers used across ClearUI components.

## Exports

| Name                     | Type      | Description                                                                 |
|--------------------------|-----------|-------------------------------------------------------------------------------|
| `deepCopy`               | Function  | Deep copies an object, including class instances, `Date`, `Map`, and `Set`.   |
| `deepClone`              | Function  | Deep copies an object like `deepCopy`, but shallow-copies functions (including symbol keys) instead of skipping/erroring on them. |
| `ComponentValErrorFns`   | Object    | Mixin-style set of methods for handling validation error state/events in ClearUI input components. |
| `ValidityInfo`           | Class     | Plain data object mirroring the native `ValidityState` fields.               |
| `TableColumnDef`         | Class     | Describes a table column (title, column key, sort order, sorting/filtering flags). |
| `TableColumnDefEvent`    | Class     | A custom `Event` carrying a `TableColumnDef` payload (`columnDef`).           |
| `nextTock`               | Function  | Async helper that runs a callback after the current Vue reactivity flush and the next microtask tick. |


Shared string keys/values used for coordination between components (e.g., providing/injecting grid context).

## deepCopy(obj)

Recursively copies an object graph, including:
- `Date`, `Array`, `Map`, and `Set` instances.
- Class instances (preserving the prototype), copying own keys (including symbols) via `Reflect.ownKeys`.
- Plain objects (copying enumerable own keys).

Primitives, `null`, and `undefined` are returned as-is.

## deepClone(obj)

Behaves like `deepCopy`, but any property whose value is a `function` is shallow-copied (the same function reference is reused) rather than being deep-copied. This is useful for cloning objects that mix data and methods (e.g., class instances with behavior) without losing `this`-bound functions. Also copies non-enumerable/symbol properties on plain objects.

## ComponentValErrorFns

A collection of methods intended to be mixed into Vue components (via `methods: { ...ComponentValErrorFns }`) that need to participate in ClearUI's validation/error system:

| Method                    | Description                                                                 |
|---------------------------|-------------------------------------------------------------------------------|
| `dispatchValErrorEvents(dispatchFn, msg)` | Dispatches error/clear events to elements matched by `this.errorEventSelector`, and optionally bubbles a `ValErrorEvent` from the component's root element when `this.bubbleErrors` is `true`. |
| `onErrorMsg(e)`           | Adds an error (from a DOM event or `ValError`) to the component's internal `errList`, re-sorts, updates `error_msg`, emits an `error` event, and dispatches error events. |
| `onClearErrorMsg(e)`      | Removes a matching error (by message and/or ID) from `errList` and updates `error_msg`. |
| `onResetErrorMsg()`       | Resets `errList` and clears `error_msg`.                                     |
| `evalValidity(e, forceEmit)` | Reads native HTML5 validity state (`e.target.validity`) into a `ValidityInfo`, adds/removes a native validation error (priority `98.001`) in `errList`, and dispatches the resulting error state. |

These methods expect the consuming component to provide instance state such as `this.errList` (an `ErrorList`), `this.Id`, `this.errorEventSelector`, `this.bubbleErrors`, `this.modelModifiers`, and `this.error_msg`.

## ValidityInfo

A plain class mirroring the native `ValidityState` interface, with all boolean flags defaulted (`valid: true`, all others `false`). Used to snapshot native input validity into reactive Vue state.

## TableColumnDef

Represents a single column definition for table/grid components.

```js
new TableColumnDef(title, column, order, hasSorting, filter)
```

| Property     | Description                                      |
|--------------|---------------------------------------------------|
| `title`      | Display title for the column header.              |
| `column`     | Property/field name the column is bound to.        |
| `order`      | Sort order/index for the column.                   |
| `hasSorting` | Whether the column supports sorting (default `false`). |
| `filter`     | Whether the column supports filtering (default `false`). |

## TableColumnDefEvent

A custom `Event` subclass used to notify listeners of a column-related action (e.g., sort/filter changes), carrying the affected `TableColumnDef` as `columnDef`.

```js
new TableColumnDefEvent(type, tableColumnDef, options)
```

## nextTock(callback)

```js
await nextTock(() => { /* runs after Vue's reactivity flush */ });
```

Escapes the current Vue reactivity flush (`await Promise.resolve()`) and waits for the next tick (`await nextTick()`) before invoking `callback`, ensuring the callback runs with fully updated reactive state and DOM. Throws if `callback` is not a function.
