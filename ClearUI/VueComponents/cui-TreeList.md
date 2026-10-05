# <cui-treelist>

A flexible, accessible tree list component for displaying and selecting hierarchical data. Supports multi-select, keyboard navigation, custom node rendering, per-node selectability, and error display.

## Usage

```vue
<cui-treelist
  :list-items="treeData"
  label="Select Items"
  value-field="id"
  text-field="name"
  type-field="type"
  selectable-field="canSelect"
  child-nodes-field="children"
  v-model="selectedValues"
  :selectable="true"
  :required="true"
/>
```

## Props

| Name             | Type      | Default   | Description                                                        |
|------------------|-----------|-----------|--------------------------------------------------------------------|
| id               | String    | auto      | Unique ID for the component.                                       |
| name             | String    | auto      | Name for the hidden input.                                         |
| listItems        | Array     | —         | Array of tree node objects.                                        |
| label            | String    | —         | Label for the tree list.                                           |
| valueField       | String    | —         | Field name for node value.                                         |
| textField        | String    | —         | Field name for node display text.                                  |
| typeField        | String    | —         | Field name for node type (for custom rendering).                   |
| selectableField  | String    | —         | Field name for per-node selectability (boolean).                   |
| childNodesField  | String    | —         | Field name for child nodes array.                                  |
| modelValue       | Array     | —         | Selected values (v-model).                                         |
| invalid          | Boolean   | false     | Marks the control as invalid.                                      |
| required         | Boolean   | false     | Marks the control as required.                                     |
| disabled         | Boolean   | false     | Disables the control.                                              |
| readonly         | Boolean   | false     | Makes the control read-only.                                       |
| selectable       | Boolean   | false     | Enables selection of nodes.                                        |
| cascadeSelect    | Boolean   | true      | Enables cascading selection to children/parents.                   |
| modelModifiers   | Object    | —         | Vue v-model modifiers (e.g., lazy, trim, number).                  |
| errorMsg        | String    | —         | Error message to display.                                          |
| collapsible      | Boolean   | true      | Allows nodes to be collapsed/expanded.                             |
| selectItemFn     | Function  | null      | Custom function for item selection.                                |
| bubblesErrors     | Boolean  | true      | Controls if validation errors bubble to parent elements.           |

## Events

| Event Name              | Payload                        | Description                                 |
|-------------------------|--------------------------------|---------------------------------------------|
| update:model-value      | value                          | Emitted when selected values change.        |
| update:selected-items   | items                          | Emitted when selected items change.         |
| update:filtered-list    | list                           | Emitted when the filtered list changes.     |
| blur                    | event                          | Emitted on blur.                            |
| change                  | event, selectedValues          | Emitted on value change.                    |
| click                   | event, item, options           | Emitted on node click.                      |
| focus                   | event                          | Emitted on focus.                           |
| select                  | event, options                 | Emitted on node selection.                  |
| expanded                | event, item, options           | Emitted when a node is expanded/collapsed.  |

## Slots

- **default**: Custom node content. Receives node context as slot props.
- **errors**: Custom error display. Receives slot props: `id`, `selectedValues`, `selectedItems`, `required`, `disabled`, `errorMsg`, `validateTrigger`.

## Features

- Multi-select and cascade selection support.
- Per-node selectability via `selectableField`.
- Keyboard navigation (arrow keys, Home/End, Enter, Space, Escape).
- Customizable node rendering via slots.
- Error message display and validation support.
- Accessible with ARIA roles and keyboard support.
- Emits detailed events for integration with parent components.
- Supports custom node types via `typeField` for advanced rendering.

## Example Tree Data

```js
[
  { id: 1, name: 'Parent', type: 'folder', canSelect: true, children: [
      { id: 2, name: 'Child 1', type: 'file', canSelect: false },
      { id: 3, name: 'Child 2', type: 'folder', canSelect: true, children: [
        { id: 4, name: 'Grandchild', type: 'file', canSelect: true }
      ]}
    ]
  }
]
```

## Example: Custom Node Slot

```vue
<cui-treelist ...>
  <template #default="{ item }">
    <span>
      <span v-if="item.type === 'folder'">??</span>
      <span v-else>??</span>
      {{ item.name }}
    </span>
  </template>
</cui-treelist>
