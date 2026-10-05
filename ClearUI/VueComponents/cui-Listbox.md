# cui-listbox

An accessible, keyboard-navigable listbox component for Vue 3 applications. Built on native `<ul>`/`<li>` semantics with full WAI-ARIA `listbox`/`option` role support, form integration via a hidden input, and built-in validation error display.

## Features

- **Accessible**: Implements `role="listbox"` / `role="option"` with `aria-activedescendant`, `aria-selected`, `aria-labelledby`, and `aria-invalid`
- **Keyboard Navigation**: Arrow keys, Home, End, Enter, Space, and Escape
- **Form Integration**: Hidden `<input>` carries the selected value for HTML form submission
- **Validation**: Built-in error display slot and integration with `ComponentValErrorFns`
- **Flexible Items**: Supports plain arrays, arrays of objects, custom `valueField` / `textField`
- **Disabled / Readonly**: Full support via props and CSS
- **Wraparound Navigation**: Arrow keys wrap from last to first item and vice versa
- **Custom Slot**: Default slot allows fully custom `<li>` markup instead of auto-generated items

## Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| id | String | `null` | No | ID for the hidden input. Auto-generated if omitted |
| label | String | — | No | Visible label rendered above the listbox |
| modelValue | any | — | No | Currently selected value (v-model) |
| listItems | Array | — | No | Array of items to render. May be primitives or objects |
| valueField | String | — | No | Property name to use as the item value when items are objects |
| textField | String | — | No | Property name to use as the display text when items are objects |
| itemElementType | String | `'li'` | No | Element type used for keyboard navigation matching |
| required | Boolean | `false` | No | Marks the field as required for validation |
| disabled | Boolean | `false` | No | Disables the listbox and prevents selection |
| readonly | Boolean | `false` | No | Prevents selection changes without disabling focus |
| errorMsg | String | — | No | Validation error message displayed below the listbox |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| update:model-value | `any` | Emitted when a new item is selected (v-model) |
| change | Event | Emitted when the selected value changes from its original value |
| input | Event | Emitted on every value set |
| focus | Event | Emitted when the listbox or an option receives focus |
| blur | Event | Emitted when focus leaves the listbox entirely |
| error | string | Emitted when a validation error is set |
| clear-error | — | Emitted when a validation error is cleared |

## Slots

### Default slot
Replaces the auto-generated `<li>` items. Use this for fully custom item markup.

```vue
<cui-listbox v-model="selected" :listItems="null">
  <li role="option" data-value="1" @click="selected = 1">Custom Item One</li>
  <li role="option" data-value="2" @click="selected = 2">Custom Item Two</li>
</cui-listbox>
```

### errors slot
Override the default error message display. Receives the following slot props:

| Slot Prop | Description |
|-----------|-------------|
| id | Component ID |
| value | Last emitted value |
| item | Last emitted item object |
| required | Required prop value |
| disabled | Disabled prop value |
| readonly | Readonly prop value |
| validateTrigger | Increments each time validation should be re-evaluated |

```vue
<cui-listbox v-model="selected" :listItems="items">
  <template #errors="{ value, validateTrigger }">
    <span v-if="!value && validateTrigger > 0" class="error">
      Please select an item.
    </span>
  </template>
</cui-listbox>
```

## Keyboard Navigation

Follows the WAI-ARIA [Listbox Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/):

| Key | Action |
|-----|--------|
| **Arrow Down** | Move focus to next option (wraps to first) |
| **Arrow Up** | Move focus to previous option (wraps to last) |
| **Home** | Move focus to first option |
| **End** | Move focus to last option |
| **Enter** / **Space** | Select the focused option |
| **Escape** | Return focus to the listbox container |

## Accessibility

| ARIA Attribute | Applied To | Value |
|----------------|-----------|-------|
| `role="listbox"` | `<ul>` | Identifies the container as a listbox widget |
| `role="option"` | `<li>` | Identifies each item as a selectable option |
| `aria-activedescendant` | `<ul>` | ID of the currently focused option |
| `aria-labelledby` | `<ul>` | ID of the label `<span>` |
| `aria-invalid` | `<ul>` | `true` when `errorMsg` is non-empty |
| `aria-selected` | `<li>` | `true` for the currently selected option |

> **NVDA / screen reader note**: The `role="listbox"` + `role="option"` combination causes NVDA to automatically enter **application mode**, passing arrow keys directly to the component's `onKeydown` handler rather than using NVDA's own virtual cursor.

## Basic Usage

### Plain array
```vue
<cui-listbox
  :listItems="['Apple', 'Banana', 'Cherry']"
  v-model="selectedFruit"
  label="Choose a fruit" />
```

### Array of objects
```vue
<cui-listbox
  :listItems="countries"
  value-field="code"
  text-field="name"
  v-model="selectedCountry"
  label="Country" />
```

### With validation error
```vue
<cui-listbox
  :listItems="items"
  value-field="id"
  text-field="name"
  v-model="selectedId"
  :required="true"
  :errorMsg="validationError"
  label="Required field" />
```

### Disabled items
Individual options can be disabled by adding a `disabled` attribute or `disabled` class to `<li>` elements in the default slot:

```vue
<cui-listbox v-model="selected">
  <li role="option" @click="selected = 1">Enabled</li>
  <li role="option" disabled>Disabled</li>
  <li role="option" class="disabled">Also Disabled</li>
</cui-listbox>
```

## Complete Example

```vue
<template>
  <div>
    <cui-listbox
      id="roleList"
      label="User Role"
      :listItems="roles"
      value-field="id"
      text-field="name"
      v-model="selectedRoleId"
      :required="true"
      :errorMsg="roleError"
      @change="onRoleChange"
      @blur="validateRole">
      <template #errors="{ value, validateTrigger }">
        <span v-if="!value && validateTrigger > 0" class="field-error">
          A role is required.
        </span>
      </template>
    </cui-listbox>

    <p>Selected role ID: {{ selectedRoleId }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      selectedRoleId: null,
      roleError: null,
      roles: [
        { id: 1, name: 'Administrator' },
        { id: 2, name: 'Editor' },
        { id: 3, name: 'Viewer' },
      ]
    };
  },
  methods: {
    onRoleChange() {
      this.roleError = null;
    },
    validateRole() {
      this.roleError = this.selectedRoleId == null
        ? 'A role is required.'
        : null;
    }
  }
};
</script>
```

## Styling

```css
/* Listbox container */
.cui-listbox ul {
  border: 1px solid #ccc;
  border-radius: 4px;
  list-style-type: none;
  margin: 0;
  padding: 0;
}

/* Options */
.cui-listbox [role="option"] {
  padding: 8px 16px;
  cursor: pointer;
  white-space: nowrap;
  outline: none;
}

/* Hover, focus, selected states */
.cui-listbox [role="option"]:hover,
.cui-listbox [role="option"]:focus,
.cui-listbox [role="option"].selected {
  background: #f0f0f0;
}

/* Disabled options */
.cui-listbox [role="option"][disabled],
.cui-listbox [role="option"].disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

/* Disabled/readonly container */
.cui-listbox.disabled,
.cui-listbox.readonly {
  opacity: 0.6;
  pointer-events: none;
}
```

## Common Issues

### Arrow keys not working with NVDA
Ensure items use `role="option"` (not `role="listitem"`). NVDA only enters application mode — which passes arrow keys to the component — when it detects a `role="listbox"` container with `role="option"` children.

### Selected value not submitted with form
Ensure the `name` prop or the auto-generated `Name` is set. The component renders a hidden `<input>` that carries the selected value.

## See Also

- [WAI-ARIA Listbox Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/)
