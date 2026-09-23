# <cui-selectbox>

A simple dropdown component that wraps a native HTML `<select>` element and a `<label>`. It supports grouped options, custom value/text fields, and integration with Vue's v-model.

Unlike `cui-dropdown`, `cui-selectbox` renders a native `<select>`/`<option>` element rather than a fully custom widget. This makes it less flexible to style and customize, but it benefits from native browser behavior (built-in keyboard navigation, mobile-friendly pickers, accessibility support) at a lower cost. Use `cui-selectbox` when only basic select-list functionality is required, and reserve `cui-dropdown` for cases where custom styling or richer UI is needed.

## Usage

```vue
<cui-selectbox
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
| label            | String    | —         | Label displayed above the select box.                                        |
| listItems        | Array     | —         | Array of items to render as `<option>`/`<optgroup>` elements.                |
| modelValue       | Any       | —         | Value for v-model binding.                                                   |
| modelModifiers   | Object    | —         | Vue v-model modifiers (e.g., `lazy`).                                        |
| valueField       | String    | —         | Property name on each item used as its option value. If omitted, the item itself is used as the value. |
| textField        | String    | —         | Property name on each item used as its display text. If omitted, the item itself is used as the text. |
| groupField       | String    | —         | Property name on each item used to group options under a common `<optgroup>`. |
| firstItem        | Any       | —         | An item to always prepend to the top of the list (e.g., a placeholder/empty option). |
| placeholder      | String    | —         | Placeholder attribute passed to the native `<select>`.                       |
| required         | Boolean   | false     | Whether the field is required.                                               |
| disabled         | Boolean   | false     | Disables the select box.                                                     |
| readonly         | Boolean   | false     | Makes the select box read-only.                                              |
| errorMsg         | String    | —         | Error message to display.                                                    |
| errorEventSelector | String  | null      | CSS selector for dispatching error events to other elements.                 |
| bubbleErrors     | Boolean   | true      | Controls if validation errors bubble to parent elements.                     |

## Events

| Event Name           | Payload                        | Description                                 |
|----------------------|---------------------------------|----------------------------------------------|
| update:model-value   | value                            | Emitted when the selected value changes.     |
| blur                 | event                            | Emitted on select box blur.                   |
| focus                | event                            | Emitted on select box focus.                  |
| change               | event                            | Emitted on value change.                      |
| input                | event                            | Emitted on input (reserved for parity with other cui inputs). |
| click                | event                            | Emitted on click (reserved for parity with other cui inputs). |

## Slots

- **default**: Custom content below the select box. Only rendered if provided by parent.
- **errors**: Custom error display. Receives slot props: `id`, `value`, `item`, `required`, `disabled`, `readonly`, `validateTrigger`.

## Accessibility

- Renders a native `<label for>`/`<select>` pairing for built-in accessibility support.
- Grouped items are rendered using native `<optgroup>` elements with the group's display text as the `label` attribute.
- Uses `aria-invalid` on the `<select>` to indicate validation state.
- Error messages are rendered in a container with `role="status"`.
- Because it's backed by a native `<select>`, keyboard navigation, screen reader support, and mobile option pickers are handled by the browser/OS.

## Features

- Supports plain arrays of primitive values or arrays of objects via `valueField`/`textField`.
- Optional grouping of items via `groupField`, rendering native `<optgroup>` elements.
- Optional `firstItem` to prepend a default/placeholder option to the list.
- Works with `v-model` and `v-model.lazy`.
- Shares validation/error handling (`errorMsg`, `errorEventSelector`, `bubbleErrors`, bubbled `set-error-msg`/`clear-error-msg` events) with other ClearUI input components via `InputComponentBase`.
- Conditionally renders slots only when used.

## cui-selectbox vs cui-dropdown

| | cui-selectbox | cui-dropdown |
|---|---|---|
| Underlying markup | Native `<select>`/`<option>` | Custom `div`/`dialog` combobox |
| Styling flexibility | Limited (native control chrome) | Fully customizable |
| Keyboard/mobile behavior | Native browser/OS behavior | Custom keyboard handling implemented in the component |
| Best for | Simple option lists where native behavior is acceptable | Cases requiring custom appearance or richer interaction |

## Validation

Validation follows the same pattern as other ClearUI input components built on `InputComponentBase`. Set `errorMsg` directly, or use `cui-valmsg` in the `errors` slot to compute validation messages. Error events bubble to parent elements when `bubbleErrors` is `true`, and can be redirected to other elements via `errorEventSelector`.
