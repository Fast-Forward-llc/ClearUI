# <cui-checkbox>

A custom, accessible checkbox component using a div and Material Symbols for the visible checkbox or a switch, with a hidden input for form compatibility. Supports booleans, strings, and numbers for value, lazy v-model, error display, grouped checkboxes (array values), and switch display.

## Usage

```vue
<cui-checkbox
  v-model="checkedValue"
  label="Accept Terms"
  :value="1"
  :unchecked-value="0"
  :required="true"
/>
```

## Props

| Name           | Type                      | Default   | Description                                                        |
|----------------|--------------------------|-----------|--------------------------------------------------------------------|
| id             | String                   | auto      | Unique ID for the component.                                       |
| name           | String                   | auto      | Name for the hidden input.                                         |
| label          | String                   | —         | Label for the checkbox.                                            |
| modelValue     | Any                      | false     | The current value (v-model). Becomes an array for multi-checkboxes.|
| value          | Boolean/Number/String    | true      | Value when checked.                                                |
| uncheckedValue | Boolean/Number/String    | false     | Value when unchecked.                                              |
| disabled       | Boolean                  | false     | Disables the checkbox.                                             |
| validateOn | Any | null | Validation trigger. Assigning a new truthy value (different from the previous value) externally triggers validation, e.g. `:validate-on="counter"` and increment `counter`. |
| readonly       | Boolean                  | false     | Makes the checkbox read-only.                                      |
| required       | Boolean                  | false     | Marks the checkbox as required.                                    |
| modelModifiers | Object                   | {}        | Vue v-model modifiers (e.g., lazy).                                |

## Events

| Event Name           | Payload         | Description                                 |
|----------------------|-----------------|---------------------------------------------|
| update:model-value   | value           | Emitted when the value changes.             |
| change               | value           | Emitted on value change.                    |
| input                | value           | Emitted on input.                           |
| focus                | event           | Emitted on focus.                           |
| blur                 | event           | Emitted on blur.                            |
| error                | object          | Emitted when an error occurs.               |
| clear-error          | object          | Emitted when an error is cleared.           |

## Slots

- **errors**: Custom error display. Receives slot props: `id`, `value`, `checkedValue`, `uncheckedValue`, `required`, `disabled`, `readonly`, `validateTrigger`.
- **default**: Custom content below the checkbox. Receives the same slot props as above.

## Features

- Supports named groups: when multiple checkboxes are rendered with the same `name` attribute, the bound v-model variable becomes an array of values.
- Uses a div and Material Symbols for the visible checkbox (no visible input).
- Can display as a switch by adding the `switch` class.
- Hidden input for form and postback compatibility.
- Supports booleans, numbers, and strings for checked/unchecked values.
- Supports v-model and v-model.lazy (only emits value on blur if lazy).
- Emits standard input, change, and focus/blur events.
- Error message display and validation support.
- Accessible with ARIA roles and keyboard support.

## Validation

`cui-checkbox` does not have any native validations, any validations including `required` must be implemented with cui-valmsg in the default slot or custom error display in the errors slot. The `required` prop is only used to apply the `aria-required` attribute to the checkbox group and is passed to the `errors` and `default` slot to support custom validation.

## Example: Lazy Modifier

```vue
<cui-checkbox v-model.lazy="checkedValue" label="Lazy Checkbox" />
```

## Example: Simple True/False checkbox

```vue
<cui-checkbox v-model="status" label="Simple Checkbox" />
```

## Example: Custom Values

```vue
<cui-checkbox v-model="status" value="Yes" unchecked-value="No" label="Custom String Values" />
<cui-checkbox v-model="status" :value="123" :unchecked-value="0" label="Custom Numeric Values" />
```

## Example: Switch Display

```vue
<cui-checkbox class="switch" v-model="switchValue" label="Enable Feature" />
```

## Example: Static string in the `Errors` Slot

```vue
<cui-checkbox v-model="checkedValue" label="Accept Terms">
  <template #errors="ctrl">
    <span v-if="ctrl.required && !ctrl.value" class="errors">This field is required.</span>
  </template>
</cui-checkbox>
```

## Example: cui-ValMsg in the `default` Slot

```vue
<cui-checkbox v-model="checkedValue" label="Accept Terms">
  <template v-slot="ctrl">
    <cui-valmsg :ctrl-id="ctrl.id" :expr="ctrl.required && !ctrl.value" :trigger-on="ctrl.value" msg="This field is required."></cui-valmsg>
  </template>
</cui-checkbox>
