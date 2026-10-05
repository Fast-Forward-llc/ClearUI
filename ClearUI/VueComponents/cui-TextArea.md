# <cui-textarea>

A flexible textarea component supporting multi-line text input, character count limiting, validation, accessibility, and integration with Vue's v-model.

## Usage

```vue
<cui-textarea
  v-model="value"
  label="Label Here"
  :required="true"
  placeholder="Enter text..."
  :maxlength="500"
  error-msg="Sample error"
/>
```

## Props

| Name                | Type      | Default   | Description                                                                 |
|---------------------|-----------|-----------|-----------------------------------------------------------------------------|
| id                  | String    | —         | Textarea element ID. Auto-generated if not provided.                        |
| label               | String    | —         | Label displayed above the textarea.                                         |
| modelValue          | Any       | —         | Value for v-model binding.                                                  |
| value               | Any       | —         | Initial value (alternative to v-model).                                     |
| required            | Boolean   | false     | Whether the field is required.                                              |
| disabled            | Boolean   | false     | Disables the textarea.                                                      |
| readonly            | Boolean   | false     | Makes the textarea read-only.                                               |
| placeholder         | String    | —         | Placeholder text.                                                           |
| maxlength           | Number    | null      | Maximum number of characters allowed. When set, a character countdown is displayed below the textarea. |
| errorMsg            | String    | —         | Error message to display.                                                   |
| modelModifiers      | Object    | —         | Vue v-model modifiers (e.g., `lazy`, `trim`, `number`).                     |
| formatter           | Function  | null      | Custom value formatter applied on emit.                                     |
| keyFilter           | Function  | null      | Custom key filter — return `false` to suppress a keypress.                  |
| errorEventSelector  | String    | null      | CSS selector for dispatching error events to other elements.                |
| validateOn          | Any       | null      | Validation trigger. Any truthy value different from the previous value triggers validation. |
| bubblesErrors       | Boolean   | true      | Controls if validation errors bubble to parent elements.           |

## Events

| Event Name           | Payload                        | Description                                 |
|----------------------|--------------------------------|---------------------------------------------|
| update:model-value   | value                          | Emitted when the value changes.             |
| blur                 | event                          | Emitted on textarea blur.                   |
| focus                | event                          | Emitted on textarea focus.                  |
| change               | event                          | Emitted when the value changes from its original value on blur. |
| input                | event                          | Emitted on every input event.               |
| click                | event                          | Emitted on click.                           |
| keyup                | event                          | Emitted on keyup.                           |
| keydown              | event                          | Emitted on keydown.                         |
| error                | {ctrlId, msgId, msg}           | Emitted when a validation error is set.     |
| clear-error          | {ctrlId, msgId, msg}           | Emitted when a validation error is cleared. |

## Slots

- **default**: Custom content rendered below the textarea. Only rendered if provided by the parent.
- **errors**: Custom error display. Receives slot props: `id`, `value`, `required`, `disabled`, `readonly`, `validityInfo`, `validateTrigger`.

### `errors` slot props

| Slot Prop      | Description                                                      |
|----------------|------------------------------------------------------------------|
| `id`           | Component ID                                                     |
| `value`        | Last emitted value                                               |
| `required`     | Required prop value                                              |
| `disabled`     | Disabled prop value                                              |
| `readonly`     | Readonly prop value                                              |
| `validityInfo` | Native `ValidityState`-style object reflecting current validity  |
| `validateTrigger` | Increments each time validation should be re-evaluated        |

## Accessibility

- Uses `aria-invalid` when an error message is present.
- Uses `aria-describedby` pointing to the error message container.
- Error messages are rendered in a `<div>` with `role="status"` for live region announcements.
- Label is rendered as a `<label>` element associated to the textarea via `for`.

## Features

- Native and custom validation with error priority and event-based error handling.
- Works with `v-model` and `v-model.lazy`.
- Supports `v-model.trim` and `v-model.number` modifiers.
- Supports custom value formatting via the `formatter` prop.
- Supports key filtering via the `keyFilter` prop.
- Character countdown display when `maxlength` is set.
- Error events can be dispatched to other elements using `errorEventSelector`.
- Conditionally renders slots only when provided.
- Validation: the `validateOn` prop allows manual triggering of validation. The trigger cascades to slots by incrementing `validateTrigger`.  
  Triggers must be a truthy value that differs from the previous value. Falsy values (`null`, `0`, `false`) do not trigger validation.  
  Recommended pattern: an integer variable that is incremented each time validation should fire.

## Examples

### Basic textarea with required validation

```vue
<cui-textarea
  v-model="comments"
  label="Comments"
  :required="true"
  placeholder="Enter your comments...">
  <template #errors="ctrl">
    <cui-valmsg
      :expr="$vFn.isRequired(ctrl?.value)"
      msg="Comments are required."
      :trigger-on="ctrl.validateTrigger" />
  </template>
</cui-textarea>
```

### Textarea with character limit

```vue
<cui-textarea
  v-model="bio"
  label="Bio"
  :maxlength="250"
  placeholder="Tell us about yourself..." />
```

### Lazy v-model (only emits on blur)

```vue
<cui-textarea
  v-model.lazy="notes"
  label="Notes"
  placeholder="Enter notes..." />
```

### With external validation trigger

```vue
<template>
  <cui-textarea
    v-model="description"
    label="Description"
    :required="true"
    :validate-on="validateCounter">
    <template #errors="ctrl">
      <cui-valmsg
        :expr="$vFn.isRequired(ctrl?.value)"
        msg="Description is required."
        :trigger-on="ctrl.validateTrigger" />
    </template>
  </cui-textarea>
  <button @click="validateCounter++">Submit</button>
</template>

<script>
export default {
  data() {
    return {
      description: null,
      validateCounter: 0,
    };
  }
};
</script>
```

### With custom key filter

```vue
<!-- Allow only letters and spaces -->
<cui-textarea
  v-model="value"
  label="Letters only"
  :key-filter="e => /^[a-zA-Z ]$/.test(e.key) || e.key === 'Backspace'" />
```

### Read-only display

```vue
<cui-textarea
  :value="savedNotes"
  label="Saved Notes"
  :readonly="true" />
```

## Differences from cui-textbox

| Feature | cui-textbox | cui-textarea |
|---------|-------------|--------------|
| Element | `<input>` | `<textarea>` |
| `type` prop | ✅ (text, number, date, etc.) | ❌ Not applicable |
| `maxlength` with countdown | ❌ | ✅ |
| Multi-line input | ❌ | ✅ |
| Resize by user | ❌ | ✅ (browser default) |

## See Also

- [cui-textbox](./cui-TextBox.md) - Single-line text input component
- [cui-valmsg](./cui-ValMsg.md) - Validation message display component
