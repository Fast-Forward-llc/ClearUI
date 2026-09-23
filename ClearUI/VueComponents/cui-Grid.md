# cui-grid Component Documentation

## Overview

`cui-grid` is a flexible Vue 3 table/grid component for displaying tabular data with support for custom columns, captions, headless mode, empty states, and slot-based customization.

---

## Props

| Prop           | Type     | Default                 | Description                                                                 |
|----------------|----------|-------------------------|-----------------------------------------------------------------------------|
| caption      | String   | `''`                    | Table caption text. Can be overridden with the `caption` slot.              |
| gridItems    | Array    | `[]`                    | The array of data objects to display as rows.                               |
| columnConfig | Array    | `undefined`             | Optional array of column definitions. If not provided, columns are auto-generated from the first item in `gridItems`. |
| headless     | Boolean  | `false`                 | If true, the table header (`<thead>`) is not rendered.                      |
| noDataMsg    | String   | `'No data available'`   | Message to display when `gridItems` is empty.                               |

---

## Slots

| Slot Name      | Scope/Props Provided                | Description                                                                 |
|----------------|------------------------------------|-----------------------------------------------------------------------------|
| caption      | —                                  | Custom table caption.                                                       |
| thead        | `{ items, columns }`               | Custom table header row(s).                                                 |
| tfoot        | `{ items, columns }`               | Custom table footer row(s).                                                 |
| tbody        | `{ items, columns }`               | Custom table body rows.                                                     |
| tbody-empty  | —                                  | Custom content when `gridItems` is empty.                                   |
| errors       | —                                  | Custom error display area below the table.                                  |
| components   | `{ items, columns, filterBy, SortBy }`| Grid helper components go here e.g. filtering, Sorting, Pagination, etc.    |

---

## Data/Context

- The component provides a `gridContext` object (via Vue's `provide`) containing:
  - `id`: The grid's unique ID.
  - `columns`: The array of column definitions.
  - `filterBy`, `sortBy`, `initColumnMap`: Internal state for advanced features.

---

## Basic Usage

```vue
<cui-grid :grid-items="myDataArray" caption="User List" />
```

---

## Custom Columns Example

```vue
<cui-grid :grid-items="users" :column-config="[
  { column: 'id', title: 'ID' },
  { column: 'name', title: 'Name' },
  { column: 'email', title: 'Email Address' }
]" caption="Users Table" />
```

---

## Custom Table Header Example

```vue
<cui-grid :grid-items="users" caption="Users">
  <template #thead="{ columns }">
    <tr>
      <th v-for="col in columns" :key="col.column">
        {{ col.title.toUpperCase() }}
      </th>
    </tr>
  </template>
</cui-grid>
```

---

## Custom Table Body Example

```vue
<cui-grid :grid-items="users" caption="Users">
  <template #tbody="{ items, columns }">
    <tr v-for="user in items" :key="user.id">
      <td>{{ user.id }}</td>
      <td>{{ user.name }}</td>
      <td>{{ user.email }}</td>
    </tr>
  </template>
</cui-grid>
```

---

## Custom Empty State Example

```vue
<cui-grid :grid-items="[]" caption="Empty Example">
  <template #tbody-empty>
    <tr>
      <td colspan="3">No users found!</td>
    </tr>
  </template>
</cui-grid>
```

---

## Headless Table Example

```vue
<cui-grid :grid-items="users" :headless="true" />
```

---

## Custom Controls Example

```vue
<cui-grid :grid-items="users" caption="Users">
  <template #controls="{ items }">
    <button @click="exportToCSV(items)">Export</button>
  </template>
</cui-grid>
```

---

## Related Components

### cui-GridRow
- Use `cui-GridRow` to define custom table rows within `cui-grid`, including filter rows or custom row layouts.
- Supports a `isFilterRow` prop for rendering filter input fields per column based on column configuration.
#### Auto Render Rows
When no default slot template is provided the default template is determined by the components placement.</br>
<strong>&lt;thead&gt;</string>
- Renders `th` elements
- When `gridItems` is null/omitted and default slot is empty, Renders Column headings.
<strong>&lt;tbody&gt;</string>
- Renders `td` elements
- When `gridItems` is not null and default slot is empty, Renders data columns for each item.
  Columns with `sort=true` enable a `cui-sort-toggle` for the column.

### cui-GridColumn
- Use `cui-GridColumn` to define individual columns declaratively inside `cui-grid`.
- Supports props like `title`, `column`, `order:numeric`, `filter:true/false`, and `sort:true/false` for advanced column configuration.

---

## Usage Examples

### Using cui-GridRow for Custom Rows and Filtering

```vue
<cui-grid :grid-items="users">
  <template #tbody="{ items, columns }">
    <cui-grid-row v-for="user in items" :key="user.id">
      <td>{{ user.id }}</td>
      <td>{{ user.name }}</td>
      <td>{{ user.email }}</td>
    </cui-grid-row>
    <!-- Optional filter row -->
    <cui-grid-row is-filter-row />
  </template>
</cui-grid>
```

### Using cui-GridColumn for Declarative Column Definitions

```vue
<cui-grid :grid-items="users">
  <template #thead>
    <tr>
      <cui-grid-column title="ID" column="id" :order="0" :filter="true" :sort="true" />
      <cui-grid-column title="Name" column="name" :order="1" :filter="true" />
      <cui-grid-column title="Email" column="email" :order="2" />
    </tr>
  </template>
  <template #tbody="{ items }">
    <tr v-for="user in items" :key="user.id">
      <td>{{ user.id }}</td>
      <td>{{ user.name }}</td>
      <td>{{ user.email }}</td>
    </tr>
  </template>
</cui-grid>
```

---

## Notes

- If `columnConfig` is not provided, columns are auto-generated from the keys of the first item in `gridItems`.
- Use the provided slots to fully customize the table's appearance and behavior.
- The component is designed for Vue 3 and uses the Options API.
