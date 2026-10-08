# <cui-dropdown>

A flexible dropdown/select component supporting grouped options, custom value/text fields, keyboard navigation, validation, accessibility, and integration with Vue's v-model.

## Usage

```vue
<cui-dropdown
  v-model="value"
  label="Label Here"
  :list-items="items"
  value-field="id"
  text-field="name"
  :required="true"
  placeholder="Select an option"
  error-msg="Sample error"
/>
```

## Props

| Name            | Type      | Default   | Description                                                                 |
|------------------|-----------|-----------|-------------------------------------------------------------------------------|
| label            | String    | —         | Label displayed above the dropdown.                                          |
| listItems        | Array     | —         | Array of items to display as options.                                        |
| modelValue       | Any       | —         | Value for v-model binding.                                                   |
| modelModifiers   | Object    | —         | Vue v-model modifiers (e.g., `lazy`).                                        |
| valueField       | String    | —         | Property name on each item used as its value. If omitted, the item itself is used as the value. |
| textField        | String    | —         | Property name on each item used as its display text. If omitted, the item itself is used as the text. |
| groupField       | String    | —         | Property name on each item used to group options under a common header.      |
| firstItem        | Any       | —         | An item to always prepend to the top of the list (e.g., a placeholder/empty option). |
| placeholder      | String    | —         | Placeholder text.                                                            |
| required         | Boolean   | false     | Whether the field is required.                                               |
| disabled         | Boolean   | false     | Disables the dropdown.                                                       |
| readonly         | Boolean   | false     | Makes the dropdown read-only.                                                |
| multiselect      | Boolean   | false     | Enables selecting multiple options. See [Multiselect](#multiselect) below.   |
| errorMsg         | String    | —         | Error message to display.                                                    |
| bubbleErrors     | Boolean   | true      | Controls if validation errors bubble to parent elements.                     |

## Events

| Event Name           | Payload                        | Description                                 |
|----------------------|---------------------------------|----------------------------------------------|
| update:model-value   | value                            | Emitted when the selected value changes.     |
| blur                 | event                            | Emitted on dropdown blur.                     |
| focus                | event                            | Emitted on dropdown focus.                    |
| change               | event                            | Emitted on value change.                      |
| input                | event                            | Emitted on input.                             |
| click                | event                            | Emitted when the dropdown is toggled open/closed. |
| error                | {ctrlId, msgId, msg}             | Emitted when an error occurs.                 |
| clear-error          | {ctrlId, msgId, msg}             | Emitted when an error is cleared.             |

## Slots

- **default**: Custom content below the dropdown. Only rendered if provided by parent.
- **errors**: Custom error display. Receives slot props: `id`, `value`, `item`, `required`, `disabled`, `readonly`, `validateTrigger`.
- **option-list**: Custom rendering of the dropdown's option list, replacing the default list markup entirely. Receives slot props:

  | Prop            | Type     | Description                                                                 |
  |-----------------|----------|-------------------------------------------------------------------------------|
  | items           | Array    | The parsed/grouped list of options to render (includes synthesized group header items when `groupField` is used). |
  | selectedValue   | Any      | The currently selected value, for comparison against each option.            |
  | listItemValue   | Function | `(item) => value` — resolves an option's value using `valueField`.           |
  | listItemText    | Function | `(item) => text` — resolves an option's display text using `textField`.      |
  | isSelected      | Function | `(item) => boolean` — whether the given option matches `selectedValue`.      |
  | selectOption    | Function | `(item) => void` — selects the given option and closes the dropdown.         |
  | isGroupItem     | Function | `(item) => boolean` — whether the given option is a synthesized group header (not individually selectable). |

  These are the same functions and data used internally to render the default option list, so you can use them to fully reproduce the default behavior or extend it (e.g., adding icons, descriptions, or custom grouping markup) while preserving selection, grouping, and accessibility semantics.

  ### Example: customizing option rendering

  ```vue
  <cui-dropdown v-model="value" :list-items="items" value-field="id" text-field="name">
    <template v-slot:option-list="{ items, isSelected, isGroupItem, selectOption, listItemValue, listItemText }">
      <div v-for="option in items"
           :key="listItemValue(option)"
           :role="isGroupItem(option) ? 'presentation' : 'option'"
           :class="{ selected: isSelected(option), 'option-group': isGroupItem(option) }"
           @click.stop="selectOption(option)">
        <span v-if="!isGroupItem(option)" class="icon" :class="option.icon"></span>
        {{ listItemText(option) }}
      </div>
    </template>
  </cui-dropdown>
  ```

## Multiselect

When `multiselect` is `true`, `modelValue` is expected to be an array of values instead of a single value. Clicking an option toggles its presence in the array rather than replacing the value and closing the dropdown, so users can select or deselect several options without the dropdown closing between selections.

```vue
<cui-dropdown
  v-model="values"
  label="Colors"
  :list-items="colors"
  value-field="id"
  text-field="name"
  :multiselect="true"
/>
```

### Toggling `multiselect` at runtime

If `multiselect` changes after the component has a value, `modelValue` is automatically converted to keep it consistent with the new mode:

- **Single value → array** (`multiselect` becomes `true`): a non-null value is wrapped in a one-item array (`value` becomes `[value]`). A `null`/`undefined` value stays `null`.
- **Array → single value** (`multiselect` becomes `false`): an empty array becomes `null`. A non-empty array keeps only its first element and discards the rest.

This conversion updates `modelValue` via the normal `update:model-value` emit, so a parent bound with `v-model` will see the converted value reflected back automatically.

## Accessibility

- The dropdown control uses `role="combobox"` and the options list uses `role="listbox"` with individual options marked `role="option"`.
- Grouped items are rendered with `role="group"`/`role="presentation"` and an `aria-label` matching the group heading.
- Selected options are marked with `aria-selected`.
- Uses `aria-invalid` on the input to indicate validation state.
- Error messages are rendered in a container with `role="status"`.
- Fully keyboard operable: `Enter`/`Space` toggles or selects, `Escape` closes the list, `ArrowUp`/`ArrowDown` navigate options, and typing a character jumps to the next matching option.

## Features

- Supports plain arrays of primitive values or arrays of objects via `valueField`/`textField`.
- Optional grouping of items via `groupField`, rendering group headers with nested sub-items.
- Optional `firstItem` to prepend a default/placeholder option to the list.
- Works with `v-model` and `v-model.lazy`.
- Native and custom validation with error priority and event-based error handling, consistent with other cui components.
- Error events can bubble to parent elements via `bubbleErrors`.
- Conditionally renders slots only when used.

## Validation

Native validation (e.g., `required`) is supported, along with custom validation events. To override the default error message, dispatch an error event with a higher priority than the native validation priority (98), e.g., 99. The error event payload should include `ctrlId`, `msgId`, `msg`, and `priority`.

The component listens for all error events dispatched by any child components (bubbled events) and will display the error message with the highest priority.
