# <cui-radio-btn-grp>

A custom, accessible radio button group component for Vue.js. Renders a group of radio buttons using divs and Material Symbols for the visible radio, with a hidden input for form compatibility. Supports booleans, strings, and numbers for value, lazy v-model, error display, custom value/text fields, validation, keyboard navigation, and optional unselect.

## Usage

```vue
<cui-radio-btn-grp
  v-model="selectedValue"
  name="group1"
  label="Choose an option"
  :list-items="[
    { id: 1, text: 'Option A' },
    { id: 2, text: 'Option B' },
    { id: 3, text: 'Option C' }
  ]"
  value-field="id"
  text-field="text"
  :allow-unselect="true"
/>
```

## Props

| Name           | Type                      | Default   | Description                                                        |
|----------------|--------------------------|-----------|--------------------------------------------------------------------|
| id             | String                   | auto      | Unique ID for the component.                                       |
| name           | String                   | auto      | Name for the hidden input (grouping).                              |
| label          | String                   | —         | Label for the radio group.                                         |
| listItems      | Array                    | —         | Array of radio button options.                                     |
| valueField     | String                   | null      | Field name for the value in each item.                             |
| textField      | String                   | null      | Field name for the display text in each item.                      |
| allowUnselect  | Boolean                  | false     | Allows unselecting a selected radio (sets to uncheckedValue). <br/>A second click/select action on a selected radio unselects it. |
| modelValue     | Any                      | false     | The current value binding (v-model).                                       |
| uncheckedValue | Boolean/Number/String    | null      | Value when unselected (if allowUnselect is true).                  |
| errorMsg       | String                   | —         | Error message to display.                                                   |
| disabled       | Boolean                  | false     | Disables the radio group.                                          |
| readonly       | Boolean                  | false     | Makes the radio group read-only.                                   |
| required       | Boolean                  | false     | Marks the radio group as required.                                 |
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
- **default**: Custom content below the radio group. Receives the same slot props as above.

## Features

- Renders a group of radio buttons with a single v-model value.
- Supports custom value and text fields for each option.
- Compatible with forms and postback.
- Supports booleans, numbers, and strings for value.
- Supports v-model and v-model.lazy (only emits value on blur if lazy).
- Emits standard input, change, and focus/blur events.
- Error message display and validation support.
- Keyboard navigation (arrow keys, space, enter) and ARIA roles for accessibility.
- Optional unselect of a selected radio with `allowUnselect` prop.

## Example: Lazy Modifier

```vue
<cui-radio-btn-grp v-model.lazy="selectedValue" name="group1" label="Choose" :list-items="[{id:1,text:'A'},{id:2,text:'B'}]" value-field="id" text-field="text" />
```

## Example: Allow Unselect

```vue
<cui-radio-btn-grp v-model="selectedValue" name="group1" label="Choose" :list-items="[{id:1,text:'A'},{id:2,text:'B'}]" value-field="id" text-field="text" :allow-unselect="true" />
```

## Example: Static string in the `Errors` Slot

```vue
<cui-radio-btn-grp v-model="selectedValue" name="group1" label="Choose">
  <template #errors="ctrl">
    <span v-if="ctrl.required && !ctrl.value" class="errors">This field is required.</span>
  </template>
</cui-radio-btn-grp>
```

## Example: cui-ValMsg in the `default` Slot

```vue
<cui-radio-btn-grp v-model="selectedValue" name="group1" label="Choose">
  <template v-slot="ctrl">
    <cui-valmsg :ctrl-id="ctrl.id" :expr="ctrl.required && !ctrl.value" :trigger-on="ctrl.value" msg="This field is required."></cui-valmsg>
  </template>
</cui-radio-btn-grp>