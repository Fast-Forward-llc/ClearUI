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
- **Custom Item Content**: `list-item-content` slot allows customizing the content of each auto-generated `<li>` while keeping its selection/click/keyboard behavior
- **Multiselect**: Optional `multiselect` mode with ctrl/cmd+click toggle and shift+click range selection, matching native listbox behavior. See [Multiselect](#multiselect) below.

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
| multiselect | Boolean | `false` | No | Enables selecting multiple options. See [Multiselect](#multiselect) below. |
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

### list-item-content slot
Customizes the content rendered *inside* each auto-generated `<li>` option, while keeping the component's default `<li>` wrapper markup (and its `role`, selection, click, and keyboard handling) intact. Use this instead of the default slot when you only need to change how each item's content looks — e.g., adding icons, badges, or secondary text — without having to reimplement selection/click behavior yourself.

Receives the following slot props:

| Slot Prop | Description |
|-----------|-------------|
| item | The raw item from `listItems` for this row |
| index | The zero-based index of the item within `listItems` |
| isSelected | `true` if this item is currently selected |
| text | The resolved display text for the item (via `textField`, if set) |
| value | The resolved value for the item (via `valueField`, if set) |

```vue
<cui-listbox
  :listItems="countries"
  value-field="code"
  text-field="name"
  v-model="selectedCountry"
  label="Country">
  <template #list-item-content="{ item, isSelected, text }">
    <span class="flag" :class="`flag-${item.code.toLowerCase()}`"></span>
    <span>{{ text }}</span>
    <span v-if="isSelected" class="check-icon">✓</span>
  </template>
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
| **Enter** | Select the focused option |
| **Space** | Select the focused option (single-select), or toggle its selection (multiselect) |
| **Escape** | Return focus to the listbox container |

In multiselect mode, mouse interactions also support:

| Interaction | Action |
|-------------|--------|
| **Click** | Selects only the clicked option, replacing any prior selection |
| **Ctrl/Cmd+Click** | Toggles the clicked option in/out of the current selection |
| **Shift+Click** | Selects the contiguous range between the last-selected option and the clicked option |

## Accessibility

| ARIA Attribute | Applied To | Value |
|----------------|-----------|-------|
| `role="listbox"` | `<ul>` | Identifies the container as a listbox widget |
| `role="option"` | `<li>` | Identifies each item as a selectable option |
| `aria-activedescendant` | `<ul>` | ID of the currently focused option |
| `aria-labelledby` | `<ul>` | ID of the label `<span>` |
| `aria-invalid` | `<ul>` | `true` when `errorMsg` is non-empty |
| `aria-selected` | `<li>` | `true` for the currently selected option(s) |
| `aria-multiselectable` | `<ul>` | Mirrors the `multiselect` prop |

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

### Disabled items
Individual options can be disabled by adding a `disabled` attribute or `disabled` class to `<li>` elements in the default slot:

```vue
<cui-listbox v-model="selected">
  <li role="option" @click="selected = 1">Enabled</li>
  <li role="option" disabled>Disabled</li>
  <li role="option" class="disabled">Also Disabled</li>
</cui-listbox>
```

## Multiselect

When `multiselect` is `true`, `modelValue` is expected to be an array of values instead of a single value.

```vue
<cui-listbox
  :listItems="colors"
  value-field="id"
  text-field="name"
  v-model="selectedColorIds"
  :multiselect="true"
  label="Colors" />
```

### Selection behavior

Mouse interaction follows the native OS/listbox convention:

- **Click** an option to select only that option, replacing the current selection.
- **Ctrl/Cmd+click** an option to toggle it in or out of the current selection without affecting the rest.
- **Shift+click** an option to select the contiguous range of items between the last-selected option and the clicked option.

On the keyboard, **Space** toggles the focused option in/out of the current selection; **Enter** selects only the focused option (replacing the current selection), matching click behavior.

### Toggling `multiselect` at runtime

If `multiselect` changes after the component has a value, `modelValue` is automatically converted to keep it consistent with the new mode:

- **Single value → array** (`multiselect` becomes `true`): a non-null value is wrapped in a one-item array (`value` becomes `[value]`). A `null`/`undefined` value stays `null`.
- **Array → single value** (`multiselect` becomes `false`): an empty array becomes `null`. A non-empty array keeps only its first element and discards the rest.

This conversion updates `modelValue` via the normal `update:model-value` emit, so a parent bound with `v-model` will see the converted value reflected back automatically.

### Form submission

The component renders a hidden `<input type="hidden">` whose value is the selected value JSON-serialized (`JSON.stringify`), so it supports primitives, whole objects, and arrays of either (the multiselect case) in a single form field. On the server (e.g., in a Razor Pages handler), deserialize the posted string with `System.Text.Json` to recover the original value or array of values.

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

## Common Issues

### Arrow keys not working with NVDA
Ensure items use `role="option"` (not `role="listitem"`). NVDA only enters application mode — which passes arrow keys to the component — when it detects a `role="listbox"` container with `role="option"` children.

### Selected value not submitted with form
Ensure the `name` prop or the auto-generated `Name` is set. The component renders a hidden `<input>` that carries the selected value, JSON-serialized so it works for single values, objects, or arrays (multiselect).

### `modelValue` isn't an array in multiselect mode
Make sure `modelValue` is initialized to an array (or `null`) before setting `multiselect` to `true`. If the component mounts with a non-array value while `multiselect` is already `true`, the initial value is coerced into a one-item array (or `null`) automatically, but subsequent updates from the parent should pass arrays.

## See Also

- [WAI-ARIA Listbox Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/)
