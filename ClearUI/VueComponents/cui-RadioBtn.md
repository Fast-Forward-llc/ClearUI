# <cui-radiobtn>

A custom, accessible radio button component using a div and Material Symbols for the visible radio, with a hidden input for form compatibility. Supports booleans, strings, and numbers for value, lazy v-model, error display, and integration with forms. Also supports grouped radio buttons (single selection).

## Usage

```vue
<cui-radiobtn
  v-model="selectedValue"
  name="group1"
  label="Option A"
  :value="1"
/>
<cui-radiobtn
  v-model="selectedValue"
  name="group1"
  label="Option B"
  :value="2"
/>
```

## Props

| Name           | Type                      | Default   | Description                                                        |
|----------------|--------------------------|-----------|--------------------------------------------------------------------|
| id             | String                   | auto      | Unique ID for the component.                                       |
| name           | String                   | auto      | Name for the hidden input (grouping).                              |
| label          | String                   | —         | Label for the radio button.                                        |
| modelValue     | Any                      | false     | The current value (v-model).                                       |
| value          | Boolean/Number/String    | true      | Value for this radio button.                                       |
| uncheckedValue | Boolean/Number/String    | false     | Value when unchecked (rarely used for radios).                     |
| errorMsg       | String                   | —         | Error message to display.                                                   |
| disabled       | Boolean                  | false     | Disables the radio button.                                         |
| readonly       | Boolean                  | false     | Makes the radio button read-only.                                  |
| required       | Boolean                  | false     | Marks the radio button as required.                                |
| modelModifiers | Object                   | {}        | Vue v-model modifiers (e.g., lazy).                                |
| bubblesErrors  | Boolean                  | true      | Controls if validation errors bubble to parent elements.           |

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

- **errors**: Custom error display. Receives slot props: `id`, `value`, `required`, `disabled`, `readonly`, `validateTrigger`.
- **default**: Custom content below the radio button. Receives the same slot props as above.

## Features

- Supports grouping by `name` for single selection.
- Uses a div and Material Symbols for the visible radio (no visible input).
- Hidden input for form and postback compatibility.
- Supports booleans, numbers, and strings for value.
- Supports v-model and v-model.lazy (only emits value on blur if lazy).
- Emits standard input, change, and focus/blur events.
- Error message display and validation support.
- Accessible with ARIA roles and keyboard support.

## Example: Lazy Modifier

```vue
<cui-radiobtn v-model.lazy="selectedValue" name="group1" label="Option A" :value="1" />
```

## Example: Custom Values

```vue
<cui-radiobtn v-model="selectedValue" name="group1" value="Yes" label="Yes" />
<cui-radiobtn v-model="selectedValue" name="group1" value="No" label="No" />
```

## Example: Static string in the `Errors` Slot

```vue
<cui-radiobtn v-model="selectedValue" name="group1" label="Option A">
  <template #errors="ctrl">
    <span v-if="ctrl.required && !ctrl.value" class="errors">This field is required.</span>
  </template>
</cui-radiobtn>
```

## Example: cui-ValMsg in the `default` Slot

```vue
<cui-radiobtn v-model="selectedValue" name="group1" label="Option A">
  <template v-slot="ctrl">
    <cui-valmsg :ctrl-id="ctrl.id" :expr="ctrl.required && !ctrl.value" :trigger-on="ctrl.value" msg="This field is required."></cui-valmsg>
  </template>
</cui-radiobtn>
```
