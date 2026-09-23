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

## Example (with cui-textbox)

```vue
<cui-textbox label="Textbox" v-model="testVar1" :required="true">
  <template v-slot:errors="ctrl">
    <cui-valmsg :expr="$vFn.isRequired(ctrl?.value, ctrl?.required)" msg="Field is Required." :trigger-on="ctrl.validateTrigger" />
  </template>
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
    <cui-textbox label="Amount" v-model="amount">
      <template v-slot:errors="ctrl">
        <cui-valmsg
          :expr="$vFn.isNumeric(ctrl?.value)"
          msg="Value must be numeric."
          :inline="false"
          :trigger-on="ctrl.validateTrigger"
        />
      </template>
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

In this example, `inline` is set to `false` so `cui-valmsg` does not display an error message itself. `cui-valmsg` recognizes and integrates with a parent `cui-textbox` the error events are dispatched 
by `cui-textbox` using the `error` event as well as the `set-error-msg` and `clear-error-msg` events. Since the events bubble, a parent `<div>` can listen and log the error details to the console.

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
