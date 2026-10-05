# cui-filter-sort-page Component Documentation

## Overview

`cui-filter-sort-page` is a headless (renderless) Vue 3 utility component that takes a source dataset and applies filtering, sorting, and pagination to it, emitting the resulting array via the `update:fsp-dataset` event. It is commonly used alongside `cui-grid` to drive a grid's `gridItems` from a filterable/sortable/paginated dataset.

The component performs the work in three discrete steps — filter, sort, then paginate — passing the working array from one step to the next before emitting the final result.

The output array (`fsp-dataset`) is a **shallow copy** of `srcDataset`: the resulting array contains the same object references as `srcDataset`. This means:
- `srcDataset` itself is never mutated.
- Mutations made directly to an object's properties within `srcDataset` are automatically reflected in `fsp-dataset` without any additional synchronization, since both arrays reference the same objects.

---

## Props

| Prop         | Type    | Default | Description                                                                                                                                  |
|--------------|---------|---------|------------------------------------------------------------------------------------------------------------------------------------------------|
| srcDataset | Array   | `[]`    | The source array of data objects. This array is never altered by the component.                                                              |
| filterBy   | Object  | `{}`    | An object whose property names match property names on the `srcDataset` objects. Each value is the filter text to apply to that property.    |
| sortBy     | Object  | `{}`    | An object whose property names match property names on the `srcDataset` objects. Each value indicates sort direction for that property: `'asc'`, `'desc'`, or `null`/`undefined` for unsorted. Any other value is ignored (treated as unsorted). |
| pageNo     | Number  | `100`   | The page number to return when pagination is applied.                                                                                        |
| pageSize   | Number  | `undefined` | The maximum number of objects per page. If not provided (or `<= 0`), pagination is skipped and all rows are returned.                    |

---

## Events

| Event                    | Payload  | Description                                                                                   |
|--------------------------|----------|------------------------------------------------------------------------------------------------|
| update:fsp-dataset     | `Array`  | Emitted after filtering, sorting, and pagination are applied. Fired on the tick after any relevant prop changes. |
| update:filtered-item-count | `Number` | Emitted alongside `update:fsp-dataset`, reporting the total number of rows that matched `filterBy` **before** pagination was applied. Useful for driving `cui-pagination`'s `item-count` prop. |

---

## Filtering Behavior

For each property name in `filterBy` with a non-null/undefined/empty value:
- The corresponding property on each `srcDataset` item is compared case-insensitively.
- A row is **included** only if the property's string value `startsWith` the filter value (case-insensitive).
- A row is **excluded** if the property is `null`/`undefined`, or doesn't match the `startsWith` check.
- All specified filters must match (`AND` logic across filter properties).

## Sorting Behavior

For each property name in `sortBy` with a value of `'asc'` or `'desc'`:
- Rows are sorted by that property in the specified direction.
- Multiple sort properties are applied in the order they appear on the `sortBy` object, acting as tie-breakers.
- `null`/`undefined` values sort to the end regardless of direction.
- Properties with any other value (besides `'asc'`/`'desc'`) are ignored for sorting purposes.

## Pagination Behavior

- If `pageSize` is not provided or is `<= 0`, no pagination is applied (all filtered/sorted rows are returned).
- Otherwise, the array is sliced to return only the rows belonging to `pageNo` (1-based), using `pageSize` rows per page.

---

## Basic Usage

```vue
<template>
  <cui-filter-sort-page
    :src-dataset="users"
    :filter-by="filterBy"
    :sort-by="sortBy"
    :page-no="pageNo"
    :page-size="pageSize"
    @update:fsp-dataset="filteredUsers = $event"
  />
  <cui-grid :grid-items="filteredUsers" />
</template>

<script>
export default {
  data() {
    return {
      users: [ /* ... */ ],
      filteredUsers: [],
      filterBy: { name: 'jo' },
      sortBy: { name: 'asc' },
      pageNo: 1,
      pageSize: 20,
    };
  },
};
</script>
```

## Usage with cui-grid Slot

Since `cui-grid` exposes `filterBy` and `sortBy` via its `components` slot, `cui-filter-sort-page` can be combined directly within that slot to keep filtering/sorting/pagination logic co-located with the grid:

```vue
<cui-grid :grid-items="filteredUsers" caption="Users">
  <template #components="{ filterBy, sortBy }">
    <cui-filter-sort-page
      :src-dataset="users"
      :filter-by="filterBy"
      :sort-by="sortBy"
      :page-no="pageNo"
      :page-size="pageSize"
      @update:fsp-dataset="filteredUsers = $event"
    />
  </template>
</cui-grid>
```

---

## Notes

- The component has no visible template output; it is purely functional/logic-driven.
- Recomputation is scheduled via `Vue.nextTick()` whenever `srcDataset`, `filterBy`, `sortBy`, `pageNo`, or `pageSize` changes, so multiple synchronous prop changes are picked up on the next tick.
- Filtering, sorting, and pagination are implemented as separate internal methods (`filterDataset`, `sortDataset`, `paginateDataset`) so each concern can be reasoned about and tested independently.
