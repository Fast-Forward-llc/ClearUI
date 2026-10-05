# <cui-popup-dialog>

A flexible, accessible popup dialog component using the native HTML `<dialog>` element. Supports dynamic heading, message, and buttons, as well as custom slots for advanced content.

## Usage

```vue
<cui-popup-dialog
  v-model:show="showDialog"
  heading="Dialog Title"
  message="This is a message."
  :buttons="[{ text: 'OK', close: true }]"
/>
```

### With Custom Slots

```vue
<cui-popup-dialog v-model:show="showDialog">
  <template #heading>
    <h2>Custom Heading</h2>
  </template>
  <template #body>
    <p>Custom body content here.</p>
  </template>
  <template #buttons>
    <button @click="showDialog = false">Close</button>
  </template>
</cui-popup-dialog>
```

## Props

| Name     | Type    | Default | Description                                                      |
|----------|---------|---------|------------------------------------------------------------------|
| heading  | String  | null    | Dialog heading text.                                             |
| message  | String/Array | null | Dialog message (string or array of strings for multiple lines).  |
| buttons  | Array   | null    | Array of button configs. Each config: `{ text, onClick, close, classes }`. |
| show     | Boolean | false   | Controls dialog visibility (use with `v-model:show`).            |

## Events

| Event Name         | Payload | Description                                 |
|--------------------|---------|---------------------------------------------|
| update:show        | Boolean | Emitted when dialog visibility changes.      |
| ok, cancel, yes, no, abort, accept, reject, exit | event | Emitted for common button actions. |
| open, close        | Object  | Emitted when dialog is opened or closed.     |

## Slots

- **heading**: Custom heading content.
- **body**: Custom body/message content.
- **buttons**: Custom button area content.

## Features

- Uses native `<dialog>` for accessibility and focus management.
- Supports both declarative and event-driven opening/configuration.
- Dynamic heading, message, and buttons via props or event config.
- Emits events for button actions and dialog lifecycle.
- Customizable via slots for advanced layouts.

## Example Button Config

```js
[
  { text: 'OK', close: true },
  { text: 'Cancel', close: true, classes: ['btn-secondary'] },
  { text: 'Custom', onClick: myHandler, close: false }
]
```

- `text`: Button label
- `onClick`: Function to call on click
- `close`: If true, closes the dialog
- `classes`: Additional CSS classes
