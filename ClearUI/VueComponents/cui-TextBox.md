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
| validateOn | Any | null | Validation trigger. Assigning a new truthy value (different from the previous value) externally triggers validation, e.g. `:validate-on="counter"` and increment `counter`. |
| readonly            | Boolean   | false     | Makes the input read-only.                                                  |
| placeholder         | String    | —         | Placeholder text.                                                           |
| errorMsg            | String    | —         | Error message to display.                                                   |
| modelModifiers      | Object    | —         | Vue v-model modifiers (e.g., `lazy`, `trim`, `number`).                     |
| formatter           | Function  | null      | Custom value formatter.                                                     |
| keyFilter           | Function  | null      | Custom key filter for input.                                                |
| mask                | String    | null      | Input mask that formats the value and discards invalid characters. See [Input Mask](#input-mask). |
| actionBtnConfig     | ActionBtnConfig | —   | Configures an action button displayed beside the input. The button is only rendered when `icon` is set. See [Action Button](#action-button). |
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
- Supports input masks via the `mask` prop.
- Optional action button configured with `actionBtnConfig`.
- Error events can be dispatched to other elements using `errorEventSelector`.
- Conditionally renders slots only when used.

## Input Mask

The `mask` prop defines a pattern the textbox enforces as the user types or pastes. Characters that don't fit the next mask position are discarded and literal characters are inserted automatically.

| Mask character | Accepts                    |
|----------------|----------------------------|
| `9`            | A digit (0-9)              |
| `a`            | A letter (A-Z, a-z)        |
| `*`            | A letter or a digit        |
| `#`            | An optional digit (0-9)    |
| `?`            | An optional letter (A-Z, a-z) |
| anything else  | A literal inserted as-is   |
| `\` + a mask character | That character as a literal (e.g. `\#`, `\?`, `\9`) |

```vue
<cui-textbox v-model="phone" label="Phone" mask="(999) 999-9999" />
<cui-textbox v-model="code" label="Code" mask="aa-9999" />
<cui-textbox v-model="zip" label="ZIP" mask="99999-####" />
<cui-textbox v-model="ticket" label="Ticket" mask="\#9999" />
```

Notes:

- Escape a mask character with a preceding backslash to use it as a literal. `\#9999` always starts with a literal `#`, and `999\?` ends with a literal `?`. In a JavaScript string literal the backslash must itself be escaped (`'\\#9999'`); in a template attribute (`mask="\#9999"`) it is written as is.
- A trailing backslash with nothing after it is treated as a literal backslash.
- An optional character (`#` or `?`) is skipped when the next typed character doesn't fit it, and the mask moves on to the following position. With `99999-####`, typing `12345` shows `12345`, and each further digit fills the optional slots after the `-`.
- Optional characters are not padded, so the value can be shorter than the mask.
- A literal is only inserted once a following character is accepted, so typing `5` into `(999) 999-9999` displays `(5`.
- The mask also applies to values set externally through `v-model` or `value`.
- The emitted value is the formatted text (e.g. `(555) 123-4567`), not the raw characters.
- The mask does not validate completeness. A partially filled value is accepted and emitted as typed.

## Native Validation

`cui-textbox` uses the browser's built-in constraint validation. Standard attributes such as `required`, `type` (`number`, `date`, `email`, ...), `min`, `max`, `minlength`, `maxlength`, `step` and `pattern` are applied to the embedded `<input>`, and the component reflects the result automatically:

- When the value fails a native constraint, the browser's `validationMessage` is displayed in the errors area, `aria-invalid` is set, and an `error` event is emitted (and bubbled when `bubbleErrors` is `true`).
- When the value becomes valid, the error is cleared and `clear-error` is emitted.
- The native constraint flags (`valueMissing`, `rangeOverflow`, `rangeUnderflow`, `typeMismatch`, ...) are exposed as `validityInfo` on the `errors` slot props.

```vue
<cui-textbox v-model="qty" type="number" label="Quantity" :required="true" min="1" max="10" />
```

### Overriding native messages with `cui-valmsg`

Browser messages are generic and localized by the browser. To show your own message, place a [`cui-valmsg`](cui-ValMsg.md) in the default slot with a `priority` higher than the native error's priority of `98`. The input shows only the highest priority error, so the custom message replaces the native one while the field is invalid. If the custom `expr` passes, the native message (if any) is shown again.

```vue
<cui-textbox v-model="qty" type="number" label="Quantity" :required="true" min="1" max="10" v-slot="ctrl">
  <cui-valmsg :expr="$vFn.isRequired(ctrl?.value, ctrl?.required)"
              msg="Please enter a quantity."
              :priority="99"
              :trigger-on="ctrl.validateTrigger" />
</cui-textbox>
```

Notes:

- `cui-valmsg` defaults to `priority` `1`, which is lower than the native error, so a custom message must set a priority above `98` (for example `99`) to take precedence.
- Use different priorities when several custom messages can fail together. The highest one is displayed.
- Use the `errors` slot instead if you need to replace how the error is rendered, rather than just its text.

## Action Button

The `actionBtnConfig` prop adds a button beside the input, for example to open a picker or lookup. The button is rendered only when `icon` is set.

The prop takes an `ActionBtnConfig` instance. Create one with `jsUtils.ActionBtnConfig.FromObject({...})`.

| Property | Type     | Description                                                                                                  |
|----------|----------|--------------------------------------------------------------------------------------------------------------|
| icon     | String   | **Required to show the button.** The name of a [Google Material Symbols](https://fonts.google.com/icons) icon, for example `more_horiz` or `search`. |
| onClick  | Function | Called when the button is clicked. Receives the click event.                                                 |
| label    | String   | Accessible name for the button, used as its `aria-label`. Set this since the button only contains an icon.   |
| title    | String   | Defined on `ActionBtnConfig`, but not currently applied to the button by `cui-textbox`.                      |

> **Note:** `icon` must be the Google Material Symbols icon name (the ligature text), not a CSS class or image URL.

```vue
<cui-textbox v-model="email" label="Email address" :action-btn-config="btnConfig" />
```

```javascript
import { components, jsUtils } from 'clear-ui';

const btnConfig = jsUtils.ActionBtnConfig.FromObject({
    icon: 'more_horiz',
    label: 'More options',
    onClick: () => { alert('button click'); },
});
```

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
