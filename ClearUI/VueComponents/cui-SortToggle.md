# cui-sort-toggle Component Documentation

## Overview

`cui-sort-toggle` is a small Vue 3 component that renders an up/down arrow pair (using the Material Symbols Outlined font already referenced in `_common.css`) for toggling sort direction on a column. It is designed to mutate a shared `sortBy` object (e.g. the same object passed to `cui-filter-sort-page`) in place, and dispatches a native DOM `change` event whenever it changes the sort state so ancestor listeners can react without prop/emit plumbing.

The two arrows are stacked vertically (up on top, down below) within a single horizontal inline element, so it can be placed inline next to a column header's title.

If `cui-sort-toggle` is rendered directly inside a `<td>` or `<th>` element, it will also attach a `click` listener to that cell. Clicking anywhere on the cell itself (not on the arrows or other child elements) cycles the column's sort value through `'asc'` → `'desc'` → `null` → `'asc'`...

---

## Props

| Prop     | Type   | Default | Description                                                                                          |
|----------|--------|---------|--------------------------------------------------------------------------------------------------------|
| column | String | —       | **Required.** The property name used as the key into `sortBy` for this column.                        |
| sortBy | Object | `{}`    | A shared object whose properties map column names to sort direction: `'asc'`, `'desc'`, or `null`/`undefined` for unsorted. This object is mutated directly by the component. |
| multiSort | Boolean | `true` | When `true`, sorting on this column is applied without affecting other columns' sort state, allowing multi-column sort. When `false`, applying a sort on this column clears (`null`s out) every other property in `sortBy`, limiting the dataset to being sorted by a single column at a time. |

---

## Events

`cui-sort-toggle` does not declare any Vue `emits`. Instead, it directly mutates the `sortBy` prop object and dispatches a native, bubbling DOM `change` event from its root element whenever the sort value changes. Parent elements (such as a `cui-grid` header row) can listen for this with a native `@change` handler:

```vue
<th @change="onSortChanged">
  <cui-sort-toggle column="name" :sort-by="sortBy" />
</th>
```

---

## Interaction Behavior

### Up Arrow
- Click (or `Space`/`Enter` while focused) sets `sortBy[column] = 'asc'`.
- Clicking again while already `'asc'` toggles it back to `null`.

### Down Arrow
- Click (or `Space`/`Enter` while focused) sets `sortBy[column] = 'desc'`.
- Clicking again while already `'desc'` toggles it back to `null`.

### Parent Cell (`<td>`/`<th>`) Click
- On `mounted`, the component checks whether its immediate parent element is a `TD` or `TH`. If so, it attaches a `click` listener to that cell.
- The handler only proceeds if `event.target` is the cell element itself (i.e. the user clicked the empty cell area, not the arrows or other nested content).
- Each click cycles the column's sort value: `'asc' → 'desc' → null → 'asc' → ...`.
- The listener is removed in `beforeUnmount` to avoid leaks.

In all cases (up arrow, down arrow, or cell click), a `change` event is dispatched from the component's root element after `sortBy` is mutated.

---

## Basic Usage

```vue
<template>
  <table>
    <thead>
      <tr>
        <th @change="onSortChanged">
          Name
          <cui-sort-toggle column="name" :sort-by="sortBy" />
        </th>
        <th @change="onSortChanged">
          Age
          <cui-sort-toggle column="age" :sort-by="sortBy" />
        </th>
      </tr>
    </thead>
    <!-- ... -->
  </table>
</template>

<script>
export default {
  data() {
    return {
      sortBy: { name: null, age: null },
    };
  },
  methods: {
    onSortChanged() {
      // sortBy has already been mutated; re-run sorting/filtering here,
      // e.g. by passing sortBy to cui-filter-sort-page.
    },
  },
};
</script>
```

## Usage Inside a Table Cell (click-to-sort on whole cell)

```vue
<th @change="onSortChanged">
  <cui-sort-toggle column="name" :sort-by="sortBy">
    Name
  </cui-sort-toggle>
</th>
```

Because the component's parent is a `TH`, clicking anywhere on the empty area of the header cell (not on the arrow icons themselves) will also cycle the sort state for that column.

---

## Notes

- `sortBy` is expected to be a reactive object shared with other components (e.g. `cui-filter-sort-page`'s `sortBy` prop), so mutations made here are immediately visible to any component watching the same object.
- The component renders no visible label/title itself; combine it with your own column heading text as shown above.
- Arrow active state is indicated with an `active` CSS class (colored via `--color-primary`) when `sortBy[column]` matches that arrow's direction.
