# cui-pagination Component Documentation

## Overview

`cui-pagination` is a Vue 3 component that renders Prev/Next buttons plus a set of numbered page buttons (with ellipses for large page counts) for paging through a dataset. It is commonly paired with `cui-filter-sort-page` to drive pagination of a `cui-grid`'s data.

---

## Props

| Prop            | Type   | Default | Description                                                                                  |
|-----------------|--------|---------|------------------------------------------------------------------------------------------------|
| pageNo        | Number | `1`     | The current page number (1-based).                                                             |
| itemsPerPage  | Number | —       | **Required.** The number of items shown per page.                                              |
| itemCount     | Number | —       | **Required.** The total number of items across all pages (e.g. the filtered item count).       |
| navButtonCount | Number | `5`    | The number of numbered page buttons to show (minimum enforced value is `5`).                    |

---

## Events

| Event           | Payload  | Description                                                          |
|-----------------|----------|-----------------------------------------------------------------------|
| update:page-no | `Number` | Emitted when the user clicks a page button, Prev, or Next.           |

---

## Basic Usage

```vue
<cui-pagination
  v-model:page-no="pageNo"
  :items-per-page="pageSize"
  :item-count="filteredCount"
/>
```

## Usage with cui-filter-sort-page and cui-grid

`cui-pagination` pairs naturally with `cui-filter-sort-page`, which reports the total matching row count via `update:filtered-item-count`:

```vue
<cui-grid :grid-items="pagedUsers" caption="Users">
  <template #components="{ filterBy, sortBy }">
    <cui-filter-sort-page
      :src-dataset="users"
      :filter-by="filterBy"
      :sort-by="sortBy"
      :page-no="pageNo"
      :page-size="pageSize"
      @update:fsp-dataset="pagedUsers = $event"
      @update:filtered-item-count="filteredCount = $event"
    />
    <cui-pagination
      v-model:page-no="pageNo"
      :items-per-page="pageSize"
      :item-count="filteredCount"
    />
  </template>
</cui-grid>
```

---

## See Also

- [cui-filter-sort-page](./cui-filter-sort-page.md) - See the [live example](/Components/filter-sort-page) for `cui-pagination` wired up to a filtered/sorted `cui-grid`.
