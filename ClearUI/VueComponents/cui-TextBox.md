# <cui-textbox>

A flexible textbox component supporting various input types, validation, accessibility, and integration with Vue's v-model.

## Usage

```vue
<cui-textbox
  v-model="value"
  type="text"
  label="Label Here"
  :required="true"
  placeholder="Enter value"
  error-msg="Sample error"
/>
```

## Props

| Name                | Type      | Default   | Description                                                                 |
|---------------------|-----------|-----------|-----------------------------------------------------------------------------|
| id                  | String    | —         | Input element ID. Auto-generated if not provided.                           |
| label               | String    | —         | Label displayed above the textbox.                                          |
| modelValue          | Any       | —         | Value for v-model binding.                                                  |
| value               | Any       | —         | Initial value (alternative to v-model).                                     |
| type                | String    | —         | Input type (`text`, `number`, `date`, etc.).                                |
| required            | Boolean   | false     | Whether the field is required.                                              |
| disabled            | Boolean   | false     | Disables the input.                                                         |
| readonly            | Boolean   | false     | Makes the input read-only.                                                  |
| placeholder         | String    | —         | Placeholder text.                                                           |
| errorMsg            | String    | —         | Error message to display.                                                   |
| modelModifiers      | Object    | —         | Vue v-model modifiers (e.g., `lazy`, `trim`, `number`).                     |
| formatter           | Function  | null      | Custom value formatter.                                                     |
| keyFilter           | Function  | null      | Custom key filter for input.                                                |
| errorEventSelector  | String    | null      | CSS selector for dispatching error events to other elements.                |
| bubblesErrors     | Boolean  | true      | Controls if validation errors bubble to parent elements.           |

## Events

| Event Name           | Payload                        | Description                                 |
|----------------------|--------------------------------|---------------------------------------------|
| update:model-value   | value                          | Emitted when the value changes.             |
| blur                 | event                          | Emitted on input blur.                      |
| focus                | event                          | Emitted on input focus.                     |
| change               | event                          | Emitted on value change.                    |
| input                | event                          | Emitted on input.                           |
| click                | event                          | Emitted on click.                           |
| keyup                | event                          | Emitted on keyup.                           |
| keydown              | event                          | Emitted on keydown.                         |
| error                | {ctrlId, msgId, msg}           | Emitted when an error occurs.               |
| clear-error          | {ctrlId, msgId, msg}           | Emitted when an error is cleared.           |

## Slots

- **default**: Custom content below the input. Only rendered if provided by parent.
- **errors**: Custom error display. Receives slot props: `id`, `value`, `required`, `disabled`, `readonly`, `validityInfo`, `validateTrigger`.

## Accessibility

- Uses `aria-invalid` and `aria-describedby` for screen reader support.
- Error messages are rendered in a container with `role="status"`.
- Label is only rendered if provided.

## Features

- Native and custom validation with error priority and event-based error handling.
- Works with `v-model` and `v-model.lazy`.
- Supports custom formatting and key filtering.
- Error events can be dispatched to other elements using `errorEventSelector`.
- Conditionally renders slots only when used.

## Validation

The component listens for all error events dispatched by any child components (bubbled events) and will display the error message with the highest priority.
`cui-textbox` blocks bubbling of error event handled by the component. The `bubblesErrors` attribute will result in the component dispatching a DOM `error` event. This ensures the 
 input component is the `target` of the event will contain the aggregated highest priority error.
 The Vue `error` event will always be emitted when an error occurs or is cleared.

Native html input validation is supported. Native validation errors produce the native message text and have a priority of 98.
to override a native error message set the error event priority higher than 98 (e.g. 99). 

Native input attributes are supported such as `required`, `minlength`, `maxlength`, `pattern`, `min`, `max`, and `step`. The component will dispatch and display validation and error messages resulting from the attributes.

The error event payload includes `ctrlId`, `msgId`, `msg`, and `priority`.
`ctrlId` is the input components DOM Id and allows the originating component to be focused/targeted by event consumers.
`msgId` Defaults to the DOM Id of the input component.
`msg` The error message
`priority` the message priority. used to aggregate errors and select the highest priority message.