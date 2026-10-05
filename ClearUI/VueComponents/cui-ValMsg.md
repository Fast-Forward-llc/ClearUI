# <cui-valmsg>

A Vue component for producing validation messages based on a critieria, with support for inline display or event-based error propagation.

## Usage

```vue
<cui-valmsg
  :expr="$vFn.isRequired(ctrl?.value, ctrl?.required)"
  msg="Field is required."
  :inline="true"
  :trigger-on="ctrl.validateTrigger"
/>
```

## Props

| Name      | Type     | Default   | Description                                                        |
|-----------|----------|-----------|--------------------------------------------------------------------|
| id        | String   | —         | Message element ID. Auto-generated if not set.                     |
| msgId     | String   | —         | Message ID. Defaults to `id`.                                      |
| ctrlId    | String   | —         | ID of the control this message is for.                             |
| expr      | Boolean  | —         | If `true`, message is hidden and error is cleared. If `false`, message is shown and error is set. |
| msg       | String   | —         | The validation message to display.                                 |
| inline    | Boolean  | `true`    | Show message inline (`true`) or dispatch error event (`false`).     |
| priority  | Number   | `1`       | Priority for error sorting.                                        |
| triggerOn | Any      | —         | Change to trigger validation. assigning any new truthy value will trigger validation. assigning the same value or a falsy value will not trigger validation.|
| disabled  | Boolean  | `false`   | Disables the message.                                              |
| clearOnDisabled  | Boolean  | `true`   | Clears the Error message when `disabled` becomes `true`.     |
| clearOn   | Any      | -         | Clears the Error message when the value changes and is truthy      |

## Events

| Event Name   | Payload                                      | Description                                 |
|--------------|----------------------------------------------|---------------------------------------------|
| error        | {ctrlId, msgId, priority, msg}               | Emitted when an error is set (inline=false).|
| clear-error  | {ctrlId, msgId, priority, msg}               | Emitted when an error is cleared.           |

## Behavior

- If `inline` is `true` and `expr` is `false`, the message is shown inline.
- If `inline` is `false`, error events are dispatched to the control defined by `ctrlId`. If `ctrlId` is not provided, the error event is dispatched to itself and bubbles to all parent elements. Input controls that support error events will handle bubbled errors automatically.
- When `expr` changes or `triggerOn` is changed/updated, validation is re-evaluated.
- Supports error priority and custom IDs for advanced error management.
- `triggerOn` triggers validation when it's assigned value changes to a different truthy value.

## Error Slot vs. Default Slot

ClearUI input components such as `cui-textbox` expose two slots that can host `cui-valmsg`: the `errors` slot and the default slot.

- **`errors` slot** — overrides the input's natural error message display entirely. Use this when you need full control over how the error is rendered in place of the component's built-in error message (for example, custom markup or formatting).
- **default slot** — the preferred location for validation components. Errors produced by `cui-valmsg` placed in the default slot bubble up to the parent input component, which aggregates all bubbled errors and displays only the highest priority error in its `errors` slot (or native error message). This lets you combine multiple `cui-valmsg` validators on a single control without worrying about which one wins — the parent handles prioritization automatically.

## Example (with cui-textbox)

```vue
<cui-textbox label="Textbox" v-model="testVar1" :required="true" v-slot="ctrl">
  <cui-valmsg :expr="$vFn.isRequired(ctrl?.value, ctrl?.required)" msg="Field is Required." :trigger-on="ctrl.validateTrigger" />
</cui-textbox>
```

## Events and Bubbling

`cui-valmsg` produces error events that can be consumed by other components. Two kinds of events are produced, Vue emits and DOM dispatched events. The component emits the `error` event and dispatches three DOM events `error`, `set-error-msg`, and `clear-error-msg`. 
These are standard DOM events that bubble. This allows you to handle validation errors on a common parent element. 

When `:inline="false"` the component does not display the error message but the events are still produced.

### behavior when combined with a CUI Input component

When `cui-valmsg` is nested inside a ClearUI input component like `cui-textbox`, `cui-radiobtn`, etc. several optimizations and behavior differences result.

- DOM Events are NOT dispatched. The Vue `error` event is emitted.
- Error state is sent directly to the parent input component via parent/child integration.
- The ClearUI input component may dispatch an `error` event if it's `bubbleErrors` is `true` (which is the default)  

ClearUI input components aggregate error messages and only the highest priority error is displayed/dispatched/emitted.

an instance of `ErrorList` can be used to aggregate errors when needed.

### Example: validating a numeric value and handling the bubbled error

```vue
<template>
  <div @error="onSetErrorMsg">
    <cui-textbox label="Amount" v-model="amount" v-slot="ctrl">
      <cui-valmsg
        :expr="$vFn.isNumeric(ctrl?.value)"
        msg="Value must be numeric."
        :inline="false"
        :trigger-on="ctrl.validateTrigger"
      />
    </cui-textbox>
  </div>
</template>

<script>
export default {
  data() {
    return { amount: null };
  },
  methods: {
    onSetErrorMsg(e) {
      console.log('Validation error:', e.detail);
    },
  }
};
</script>
```

In this example, `inline` is set to `false` so `cui-valmsg` does not display an error message itself. `cui-valmsg` is placed in the default slot so it recognizes and integrates with the parent `cui-textbox`; the error events are dispatched 
by `cui-textbox` using the `error` event as well as the `set-error-msg` and `clear-error-msg` events. Since the events bubble, a parent `<div>` can listen and log the error details to the console.

### Example: validating a formatted Social Security Number

Multiple `cui-valmsg` components can be placed in the default slot of the same control. Each one bubbles its own error to the parent, which aggregates them and surfaces only the highest priority error. Here, one `cui-valmsg` checks that only digits and dashes are used, while a second checks that the dashes fall in the correct positions (`###-##-####`).

```vue
<template>
  <cui-textbox label="Social Security Number" v-model="ssn" placeholder="123-45-6789" :required="true" v-slot="ctrl">
    <cui-valmsg
      :expr="isDigitsAndDashesOnly(ctrl?.value)"
      msg="SSN can only contain numbers and dashes."
      :priority="1"
      :trigger-on="ctrl.validateTrigger"
    />
    <cui-valmsg
      :expr="isSsnFormat(ctrl?.value)"
      msg="SSN must be in the format 123-45-6789."
      :priority="2"
      :trigger-on="ctrl.validateTrigger"
    />
  </cui-textbox>
</template>

<script>
export default {
  data() {
    return { ssn: '' };
  },
  methods: {
    isDigitsAndDashesOnly(value) {
      if (!value) return true;
      return /^[0-9-]+$/.test(value);
    },
    isSsnFormat(value) {
      if (!value) return true;
      return /^\d{3}-\d{2}-\d{4}$/.test(value);
    },
  }
};
</script>
```

Both validators run on the same `v-model`. Since the dash-position check is more specific and assigned a higher `priority`, it wins when both fail, and `cui-textbox` only displays the most relevant message.

### Example: validating a standard HTML input

```vue
<template>
  <div @set-error-msg="onSetErrorMsg" @clear-error-msg="onClearErrorMsg">
    <label for="amount">Amount</label>
    <input id="amount" v-model="amount" />
    <cui-valmsg
      ctrl-id="amount"
      :expr="$vFn.isNumeric(amount)"
      msg="Value must be numeric."
      :inline="false"
      :trigger-on="amount"
    />
  </div>
</template>

<script>
export default {
  data() {
    return { amount: null };
  },
  methods: {
    onSetErrorMsg(e) {
      console.log('Validation error:', e.detail);
    },
    onClearErrorMsg(e) {
      console.log('Validation error cleared:', e.detail);
    }
  }
};
</script>
```

In this example `cui-valmsg` recognizes it is not a child of a cui input control and dispatches `set-error-msg` and `clear-error-msg` events. 
`ctrl-id` is used to associate the message with the input's `id` (this is optional), the resulting `set-error-msg`/`clear-error-msg` events 
bubble up to the parent `<div>` where they can be handled and logged.
