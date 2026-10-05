# cui-virtual-scroll Component Documentation

## Overview

`cui-virtual-scroll` is a headless (renderless) Vue 3 utility component that provides **vertical virtual scrolling** over an in-memory `dataset` array. It does not render the scrollable element itself — instead it monitors an existing scrollable element (identified by a CSS selector) and, when the scroll position approaches the top or bottom edge, notifies a child "loader" component (such as `cui-HttpRequest`) placed in its default slot to fetch additional records.

The component is designed to be paired with a loader in its default slot, using the slot props it exposes (`dataset`, `blockSize`, `edgeValue`, `loadHeadTrigger`, `loadTailTrigger`) to drive the loader's request parameters and trigger mechanism.

Key responsibilities:
- Detect when the scroll position is within a configurable threshold of the top or bottom of the scrollable element and signal that more data should be loaded in that direction.
- Optionally cap the size of the dataset by trimming elements from the end opposite the direction that just grew, keeping memory/DOM usage bounded for long-running infinite scroll scenarios. Two mutually-exclusive trimming strategies are supported: a simple, efficient **count-based** cap (`maxItemCount`), best suited to consistent, fixed-height rows; and a **height-based** cap (`virtualMaxPx`, optionally aided by `avgItemSizePx`), best suited to variable-height rows (e.g. cards or grids) where a row count alone can't predict rendered height. When both are set, `maxItemCount` takes precedence.
- Preserve the visual scroll position when content is prepended to the head (or trimmed from the head), so the viewport doesn't visually jump.
- Avoid load/trim oscillation by never trimming while the scroll position sits in a trigger zone, and by suppressing the threshold check for an edge immediately after it was trimmed.
- Support external reset, disable, and "no more data" signaling.

---

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `scrollElementSelector` | String | *required* | CSS selector identifying the scrollable element to monitor. The element is queried via `document.querySelector` and is **not** rendered by this component. |
| `keyField` | String | *required* | The property name on each dataset object that uniquely identifies that object instance. Used to compute `edgeValue` and to detect how many rows were added on each end after a load. |
| `blockSize` | Number | `100` | Number of additional rows to load when a threshold is reached. Passed through to the default slot as `blockSize` for the child loader to use as a page/limit size. |
| `scrollThreshold` | Number \| String | `200` | Distance from the top/bottom edge of the scrollable element that triggers a load. Accepts a plain number of pixels, or a string percentage (e.g. `"25%"`) which is resolved against the element's `scrollHeight` (the total scrollable content height, not just the visible viewport). |
| `dataset` | Array | *required* | The in-memory array currently loaded and displayed. Mutated in place (prepended to the head/appended to the tail by the loader, trimmed by this component) rather than replaced. |
| `maxItemCount` | Number | `null` | When set (`> 0`), defines the maximum number of rows allowed in `dataset`. Whenever `dataset.length` changes and exceeds this value, the excess row count is trimmed from the end opposite the one that just grew — no height measurement or estimation is needed since the exact number of rows to remove is already known. Trimming never removes rows while the scroll position is within a trigger zone (top/bottom threshold), to avoid load/trim oscillation. **When `maxItemCount` is set, it is used exclusively for trimming and `virtualMaxPx`/`avgItemSizePx` are ignored.** Best suited to datasets with consistent, fixed-height rows. |
| `virtualMaxPx` | Number | `null` | When set (`> 0`) and `maxItemCount` is **not** set, defines the maximum allowed `scrollHeight` (in pixels) of the scrollable element. Whenever `dataset.length` changes, if the element's `scrollHeight` exceeds this value, elements are trimmed from the end opposite the one that grew until the height is back under the limit. Trimming never removes rows while the scroll position is within a trigger zone (top/bottom threshold), to avoid load/trim oscillation. When `null` or `<= 0` (or when `maxItemCount` is set), no height-based trimming occurs. Best suited to datasets with variable-height rows (e.g. cards or grids) where a fixed item count can't reliably predict rendered height. |
| `avgItemSizePx` | Number | `null` | Only used when trimming via `virtualMaxPx` (i.e. `maxItemCount` is not set). When set (`> 0`), used as an estimate of the average pixel height of a dataset row. This lets `virtualMaxPx` enforcement remove an estimated batch of elements in one step (minimizing remove/remeasure iterations) before falling back to a one-at-a-time loop to fine-tune the result. The estimated batch size is capped so it can never remove more rows than are safely outside the opposite trigger zone, and the resulting `scrollTop` compensation is hard-clamped to that same safe boundary — protecting against the estimate under-representing real row height. |
| `reset` | Boolean \| Number \| String | `false` | When set to any truthy value, the component resets its internal load/trim tracking state and scrolls the target element back to the top, then emits `update:reset` with `false`. Falsy values have no effect. Intended to be used with `v-model:reset`. |
| `disabled` | Boolean | `false` | When `true`, all threshold-based load triggers are suppressed regardless of scroll position, and `virtualMaxPx` is not enforced (no trimming occurs). When toggled back to `false`, thresholds and trimming are immediately re-evaluated against the current scroll position. |
| `disableTrim` | Boolean | `false` | When `true`, `virtualMaxPx`/`avgItemSizePx` trimming is suppressed entirely (load triggers are unaffected). When toggled back to `false`, a trim evaluation is forced immediately based on the direction of the last known dataset growth — regardless of the current scroll position — since the dataset may have grown well past `virtualMaxPx` while trimming was disabled. |

---

## Events

| Event | Payload | Description |
|---|---|---|
| `update:reset` | `false` | Emitted immediately after a truthy `reset` prop value has been processed, so a `v-model:reset` binding automatically flips back to `false`. |

---

## Default Slot Props

The default slot exposes the following props, intended to be bound to a loader component such as `cui-HttpRequest`:

| Slot Prop | Type | Description |
|---|---|---|
| `dataset` | Array | The current in-memory dataset. Loaders should **append** to the tail / **prepend** to the head of this array directly (e.g. `dataset.push(...)` / `dataset.unshift(...)`) rather than replacing it, so the component can detect growth direction correctly. |
| `blockSize` | Number | The configured `blockSize` prop value — how many additional rows to request. |
| `headValue` | * | The key value (from `keyField`) of the current **first** element of the dataset, kept continuously up to date — including while `virtualMaxPx` trimming removes rows from the head. Intended for the head loader's cursor/paging parameter (e.g. `?before=headValue`). |
| `tailValue` | * | The key value (from `keyField`) of the current **last** element of the dataset, kept continuously up to date — including while `virtualMaxPx` trimming removes rows from the tail. Intended for the tail loader's cursor/paging parameter (e.g. `?after=tailValue`). |
| `edgeValue` | * | **combined** value: set to whichever edge (`headValue` or `tailValue`) most recently changed.|
| `loadHeadTrigger` | Number | Incremented each time the top-of-list threshold is crossed and a head load should occur. A loader can `watch` this value (or bind it to `trigger-on`) to know when to fetch older/earlier rows. |
| `loadTailTrigger` | Number | Incremented each time the bottom-of-list threshold is crossed and a tail load should occur. A loader can `watch` this value (or bind it to `trigger-on`) to know when to fetch newer/later rows. |
| `edge` | String \| null | A single-character indicator of which edge most recently triggered a load: `'H'` for head, `'T'` for tail. `null` until the first load is triggered (and after `reset`). Useful when a single loader handles both directions and needs to know which cursor (`headValue` vs `tailValue`) to use for the current request. |

---

## DOM Events Consumed

The component listens for the following custom DOM events dispatched (with `bubbles: true`) on the scroll element (e.g. by a loader placed in the default slot), typically after a load request completes and returns zero additional records:

| Event | Effect |
|---|---|
| `NoItemsHead` | Suppresses further head (top) load triggers until the scroll position moves back out of the top threshold zone. Also clears the pending head load state (and its anchor key), since the in-flight request has resolved with zero rows. |
| `NoItemsTail` | Suppresses further tail (bottom) load triggers until the scroll position moves back out of the bottom threshold zone. Also clears the pending tail load state (and its anchor key), since the in-flight request has resolved with zero rows. |

Example of a loader signaling exhaustion after receiving an empty page:

```js
document.querySelector('#myScrollArea')
    .dispatchEvent(new CustomEvent('NoItemsTail', { bubbles: true }));
```

---

## Behavior Notes

- **Initial Load** if `dataset` is null or empty when the component mounts it will trigger an inital tail load with `edgeValue=null` and `tailValue=null`
- **Trim direction**: When `virtualMaxPx` trimming is needed, rows are removed from the end **opposite** the end that grew. If both ends grew in the same tick, trimming alternates between the two ends so neither freshly-loaded block is discarded outright.
- **Anchor tracking through trimming**: If a head (or tail) load is still pending while trimming removes rows from that same end, the pending load's anchor key (and `edgeValue`) is refreshed to the new edge row after each removal. This ensures the anchor always reflects the current head/tail of the dataset, so the in-flight load can still be correctly located once it resolves, and any subsequent load request will use an up-to-date cursor value rather than a stale one.
- **Estimated batch safety**: When `avgItemSizePx` is used to remove a batch of rows in one step, the batch size is capped so it can never remove more rows than safely fit within the distance to the opposite trigger zone. The resulting `scrollTop` compensation is also hard-clamped to that same safe boundary, so if real row heights are larger than `avgItemSizePx` estimated (a common case), the correction can't overshoot past the boundary and snap the view to the very start (or end) of the dataset.
- **Scroll position preservation**: When rows are prepended to the head (via a head load) or trimmed from the head (via `virtualMaxPx` enforcement), the component compensates `scrollTop` by the resulting `scrollHeight` delta so the currently-visible content does not visually jump.
- **Scroll listener throttling**: The `scroll` event is throttled via `requestAnimationFrame`, so at most one threshold check occurs per animation frame regardless of how many `scroll` events fire.
- **Deferred element resolution**: If `scrollElementSelector` doesn't resolve to an element at mount time (e.g. it's rendered by the parent in a later tick), the component retries with incremental backoff, and also retries whenever the dataset changes while the element remains unresolved.
- **Reset**: Setting `reset` to a truthy value clears all pending/anchor/"no more data" state, resets trigger counters to `0`, scrolls to the top, and then emits `update:reset` set to `false`.
- **Disabled**: While `disabled` is `true`, no load triggers fire and `virtualMaxPx` is not enforced — the dataset is left untouched. Re-enabling immediately re-evaluates both.
- **Disable trim**: While `disableTrim` is `true`, load triggers continue to fire normally, but `virtualMaxPx`/`avgItemSizePx` trimming is skipped, allowing the dataset to grow unbounded. When `disableTrim` transitions back to `false`, a trim pass is forced using the direction of the last known growth (head or tail), bypassing the normal "don't trim while in a trigger zone" safeguard, since a large backlog may need to be trimmed even if the scroll position happens to sit inside a trigger zone at that moment.
- **Initial head-zone suppression**: A head load is never triggered until the scroll position has moved out of the head trigger zone at least once. Without this, a scrollable element that starts at `scrollTop = 0` (the normal starting position) would already sit inside the head threshold zone at mount, causing a spurious head load to fire immediately even though the user hasn't scrolled up at all. `reset` re-arms this suppression as well, since it also scrolls back to the top.

---

## Basic Usage

```vue
<template>
  <div id="scroll-area" style="height: 400px; overflow-y: auto;">
    <cui-virtual-scroll
      scroll-element-selector="#scroll-area"
      key-field="id"
      :dataset="items"
      :block-size="25"
      scroll-threshold="20%"
      :virtual-max-px="4000"
      :avg-item-size-px="40"
    >
      <template v-slot="{ dataset, blockSize, headValue, tailValue, loadHeadTrigger, loadTailTrigger }">
        <cui-http-request
          url="/api/items"
          :qparams="{ after: tailValue, limit: blockSize }"
          :trigger-on="loadTailTrigger"
          @received="data => dataset.push(...data)"
        />
        <cui-http-request
          url="/api/items"
          :qparams="{ before: headValue, limit: blockSize }"
          :trigger-on="loadHeadTrigger"
          @received="data => dataset.unshift(...data)"
        />
      </template>
    </cui-virtual-scroll>

    <div v-for="item in items" :key="item.id" class="row">
      {{ item.name }}
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      items: [ /* initial page of rows */ ],
    };
  },
};
</script>
```

## Usage with Reset and Disabled

```vue
<template>
  <button @click="resetScroll = true">Reset List</button>
  <label>
    <input type="checkbox" v-model="scrollingDisabled" /> Pause infinite scroll
  </label>

  <div id="scroll-area" style="height: 400px; overflow-y: auto;">
    <cui-virtual-scroll
      scroll-element-selector="#scroll-area"
      key-field="id"
      :dataset="items"
      :block-size="25"
      v-model:reset="resetScroll"
      :disabled="scrollingDisabled"
    >
      <template v-slot="{ dataset, blockSize, tailValue, loadTailTrigger }">
        <cui-http-request
          url="/api/items"
          :qparams="{ after: tailValue, limit: blockSize }"
          :trigger-on="loadTailTrigger"
          @received="data => {
            if (data.length === 0) {
              document.querySelector('#scroll-area')
                .dispatchEvent(new CustomEvent('NoItemsTail', { bubbles: true }));
            } else {
              dataset.push(...data);
            }
          }"
        />
      </template>
    </cui-virtual-scroll>

    <div v-for="item in items" :key="item.id" class="row">
      {{ item.name }}
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      items: [],
      resetScroll: false,
      scrollingDisabled: false,
    };
  },
};
</script>
```

## Usage with Bidirectional Loading and Percentage Threshold

```vue
<cui-virtual-scroll
  scroll-element-selector="#chat-window"
  key-field="messageId"
  :dataset="messages"
  :block-size="50"
  scroll-threshold="15%"
>
  <template #default="{ dataset, blockSize, headValue, tailValue, loadHeadTrigger, loadTailTrigger }">
    <!-- Load older messages when scrolling up -->
    <cui-http-request
      url="/api/messages/before"
      :qparams="{ before: headValue, limit: blockSize }"
      :trigger-on="loadHeadTrigger"
      @received="data => dataset.unshift(...data)"
    />
    <!-- Load newer messages when scrolling down -->
    <cui-http-request
      url="/api/messages/after"
      :qparams="{ after: tailValue, limit: blockSize }"
      :trigger-on="loadTailTrigger"
      @received="data => dataset.push(...data)"
    />
  </template>
</cui-virtual-scroll>
```

## Usage with a Single Loader Using `edge`

Rather than wiring up two separate `cui-http-request` instances (one per edge), a single loader can be bound to both triggers at once and use the `edge` slot prop to tell the backend which direction to load and which cursor to use. This works well when a single API endpoint accepts an `edge`/`cursor` pair and returns the next block of rows for whichever edge was requested.

```vue
<template>
  <div id="scroll-area" style="height: 400px; overflow-y: auto;">
    <cui-virtual-scroll
      scroll-element-selector="#scroll-area"
      key-field="id"
      :dataset="items"
      :block-size="50"
    >
      <template #default="{ dataset, blockSize, edgeValue, loadHeadTrigger, loadTailTrigger, edge }">
        <!-- trigger-on fires whenever either counter increments; edge indicates -->
        <!-- which edge the current trigger is for, and edgeValue holds that edge's cursor. -->
        <cui-http-request
          url="/api/items"
          :qparams="{ edge: edge, cursor: edgeValue, limit: blockSize }"
          :trigger-on="loadHeadTrigger + loadTailTrigger"
          @received="data => {
            if (data.length === 0) {
              document.querySelector('#scroll-area').dispatchEvent(
                new CustomEvent(edge === 'H' ? 'NoItemsHead' : 'NoItemsTail', { bubbles: true })
              );
            } else if (edge === 'H') {
              dataset.unshift(...data);
            } else {
              dataset.push(...data);
            }
          }"
        />
      </template>
    </cui-virtual-scroll>

    <div v-for="item in items" :key="item.id" class="row">
      {{ item.name }}
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      items: [ /* initial page of rows */ ],
    };
  },
};
</script>
```

On the backend, the endpoint would inspect the `edge` query parameter (`"H"` or `"T"`) to decide whether `cursor` represents the oldest or newest loaded row, and return the corresponding older/newer block of rows:

```csharp
public IActionResult OnGetItems(string edge, int? cursor, int limit = 50)
{
    var query = edge == "H"
        ? _items.Where(i => i.Id < cursor).OrderByDescending(i => i.Id).Take(limit).OrderBy(i => i.Id)
        : _items.Where(i => cursor == null || i.Id > cursor).OrderBy(i => i.Id).Take(limit);

    return new JsonResult(query.ToList());
}
```

> **Note:** Since `loadHeadTrigger` and `loadTailTrigger` are independent counters, summing them (`loadHeadTrigger + loadTailTrigger`) for `trigger-on` ensures the loader fires whenever *either* one increments. `edge` always reflects whichever edge most recently triggered, so it stays in sync with the trigger that caused the current request, and `edgeValue` always holds that same edge's cursor value.

---

## Notes

- The component has no visible template output of its own beyond its default slot; it is purely functional/logic-driven, similar in spirit to `cui-filter-sort-page` and `cui-fsp-debounce`.
- Because `dataset` is mutated in place (via `push`/`unshift`/`pop`/`shift`) rather than replaced, the parent's array reference stays valid and reactive throughout loads and trims — no additional synchronization or `update:dataset` event is required for normal operation.
- `scrollElementSelector` must resolve to an element with `overflow-y: auto` (or `scroll`) and a bounded height/`max-height` for scroll-based triggering to function.
- `virtualMaxPx` and `avgItemSizePx` are independent of `blockSize` — `blockSize` controls how much is requested per load, while `virtualMaxPx`/`avgItemSizePx` control how much is retained in memory/DOM afterward.
