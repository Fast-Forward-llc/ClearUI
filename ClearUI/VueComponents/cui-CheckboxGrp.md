# <cui-checkboxgrp>

A custom, accessible checkbox group component for Vue.js. Renders a group of checkboxes using divs and Material Symbols for the visible checkboxes or switches, with hidden inputs for form compatibility. Supports booleans, strings, and numbers for values, lazy v-model, error display, grouped checkboxes (array values), switch display, custom value/text fields, validation, and keyboard navigation.

## Usage

```vue
<cui-checkboxgrp
  v-model="selectedValues"
  name="group1"
  label="Select options"
  :list-items="[
    { id: 1, text: 'Option A' },
    { id: 2, text: 'Option B' },
    { id: 3, text: 'Option C' }
  ]"
  value-field="id"
  text-field="text"
/>
```

## Props

| Name           | Type                      | Default   | Description                                                        |
|----------------|--------------------------|-----------|--------------------------------------------------------------------|
| id             | String                   | auto      | Unique ID for the component.                                       |
| name           | String                   | auto      | Name for the hidden inputs (grouping).                             |
| label          | String                   | —         | Label for the checkbox group.                                      |
| listItems      | Array                    | —         | Array of checkbox options.                                         |
| valueField     | String                   | null      | Field name for the value in each item.                             |
| textField      | String                   | null      | Field name for the display text in each item.                      |
| modelValue     | Array                    | []        | The current values (v-model, array of checked values).             |
| value          | Boolean/Number/String    | true      | Value for this checkbox (default for single checkbox).             |
| uncheckedValue | Boolean/Number/String    | false     | Value when unchecked.                                              |
| disabled       | Boolean                  | false     | Disables the checkbox group.                                       |
| readonly       | Boolean                  | false     | Makes the checkbox group read-only.                                |
| required       | Boolean                  | false     | Marks the checkbox group as required.                              |
| modelModifiers | Object                   | {}        | Vue v-model modifiers (e.g., lazy).                                |

## Events

| Event Name           | Payload         | Description                                 |
|----------------------|-----------------|---------------------------------------------|
| update:model-value   | value[]         | Emitted when the value changes.             |
| change               | value[]         | Emitted on value change.                    |
| input                | value[]         | Emitted on input.                           |
| focus                | event           | Emitted on focus.                           |
| blur                 | event           | Emitted on blur.                            |
| error                | object          | Emitted when an error occurs.               |
| clear-error          | object          | Emitted when an error is cleared.           |

## Slots

- **errors**: Custom error display. Receives slot props: `id`, `value`, `required`, `disabled`, `readonly`, `validateTrigger`.
- **default**: Custom content below the checkbox group. Receives the same slot props as above.

## Features

- Renders a group of checkboxes with a single v-model array value.
- Supports custom value and text fields for each option.
- Uses divs and Material Symbols for the visible checkboxes (no visible input).
- Can display as switches by adding the `switch` class.
- Hidden inputs for form and postback compatibility.
- Supports booleans, numbers, and strings for values.
- Supports v-model and v-model.lazy (only emits value on blur if lazy).
- Emits standard input, change, and focus/blur events.
- Error message display and validation support.
- Keyboard navigation and ARIA roles for accessibility.

## Example: Lazy Modifier

```vue
<cui-checkboxgrp v-model.lazy="selectedValues" name="group1" label="Select" :list-items="[{id:1,text:'A'},{id:2,text:'B'}]" value-field="id" text-field="text" />
```

## Example: Switch Display

```vue
<cui-checkboxgrp class="switch" v-model="selectedValues" name="group1" label="Switches" :list-items="[{id:1,text:'A'},{id:2,text:'B'}]" value-field="id" text-field="text" />
```

## Example: Static string in the `Errors` Slot

```vue
<cui-checkboxgrp v-model="selectedValues" name="group1" label="Select">
  <template #errors="ctrl">
    <span v-if="ctrl.required && (!ctrl.value || ctrl.value.length === 0)" class="errors">At least one option is required.</span>
  </template>
</cui-checkboxgrp>
```

## Example: cui-ValMsg in the `default` Slot

```vue
<cui-checkboxgrp v-model="selectedValues" name="group1" label="Select">
  <template v-slot="ctrl">
    <cui-valmsg :ctrl-id="ctrl.id" :expr="ctrl.required && (!ctrl.value || ctrl.value.length === 0)" :trigger-on="ctrl.value" msg="At least one option is required."></cui-valmsg>
  </template>
</cui-checkboxgrp>
```
