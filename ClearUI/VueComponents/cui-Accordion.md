# <cui-accordion>

An accessible accordion component for Vue.js, following the [W3C ARIA Authoring Practices Guide (APG) Accordion Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/). Renders a list of headers/buttons paired with collapsible panels, using the `listItems` prop to define each accordion segment.

## Usage

```vue
<cui-accordion
  v-model="expandedItem"
  :list-items="['Section One', 'Section Two', 'Section Three']">
  <template #panel-section-one>
    Content for section one.
  </template>
  <template #panel-section-two>
    Content for section two.
  </template>
  <template #panel-section-three>
    Content for section three.
  </template>
</cui-accordion>
```

## Usage with Objects

When `valueField` is set, `v-model` emits the matching property's value instead of the full item object:

```vue
<cui-accordion
  v-model="expandedValue"
  :list-items="[
    { text: 'Billing Info', value: 'billing' },
    { text: 'Shipping Info', value: 'shipping' },
  ]"
  text-field="text"
  value-field="value">
  <template #panel-billing-info>
    Billing form fields go here.
  </template>
  <template #panel-shipping-info>
    Shipping form fields go here.
  </template>
</cui-accordion>
```

## Props

| Name          | Type            | Default                 | Description                                                                                           |
|---------------|-----------------|--------------------------|---------------------------------------------------------------------------------------------------------|
| listItems   | Array           | `[]`                     | Array of strings or objects. Each entry defines one accordion header/panel pair.                        |
| textField   | String          | —                        | Property name on each item object used as its display text and to derive the panel slot name. If omitted (or items are plain strings), the item itself is used as the text. |
| valueField  | String          | —                        | Property name on each item object used as its `v-model` value (see **v-model Value Semantics** below). |
| headingTag  | String          | `'h3'`                   | The HTML tag (or component) used to render each accordion header's wrapping element (e.g. `'h2'`, `'h4'`, `'div'`). Should typically match the appropriate heading level for the surrounding page content. |
| expanderPosition | String     | `'left'`                 | The side of the header the expand/collapse indicator is displayed on. Accepts `'left'` or `'right'`.    |
| modelValue  | Any / Array     | —                        | The expanded panel's value (v-model) — see **v-model Value Semantics** below. When `multiExpand` is `true`, this is an array of expanded values. |
| multiExpand | Boolean         | `false`                  | When `true`, multiple panels can be expanded at the same time. When `false`, expanding a panel collapses any other expanded panel. |
| disabled    | Boolean         | `false`                  | Disables all accordion headers.                                                                         |
| readonly    | Boolean         | `false`                  | Prevents toggling panels, but does not visually disable the headers.                                     |
| noItemsMsg  | String          | `'No items available'`   | Message displayed when `listItems` is empty.                                                             |
| id          | String          | auto                     | Base id used to generate unique header/panel element ids.                                                |

## v-model Value Semantics

`cui-accordion`'s `v-model` does not track panel index — it tracks the **value** of the expanded item(s):

- If `valueField` is **not** set, `v-model` emits the entire list item (the string or object) for the expanded panel(s).
- If `valueField` **is** set and an expanded item is an object with a property matching `valueField`, `v-model` emits that property's value.
- If `valueField` is set but the expanded item is not an object, or is an object without that property, `v-model` falls back to emitting the entire item (same as if `valueField` were not set).

When `multiExpand` is `true`, `v-model` is an array of these values (one per expanded panel) instead of a single value.

## Events

| Event Name         | Payload                     | Description                                                            |
|--------------------|------------------------------|--------------------------------------------------------------------------|
| update:model-value| Any / Array / `null`        | Emitted when the expanded panel(s) change.                              |
| change            | Any / Array / `null`        | Emitted alongside `update:model-value`.                                 |

## Slots

Each item in `listItems` produces one named panel slot. The slot name is derived from the item's display text (the `textField` property value for objects, or the string itself for plain strings), sanitized by replacing any run of whitespace or non-alphanumeric characters with a single hyphen, lowercased, then prefixed with `panel-`.

For example:
- `"Section One"` → `#panel-section-one`
- `"Billing & Shipping"` → `#panel-billing-shipping`

> **Note:** Slot names are always lowercased because HTML attribute/element names (including `<template #slot-name>` shorthand) are case-insensitive when parsed from in-DOM templates (e.g. markup written directly in a `.cshtml`/`.html` page rather than a compiled `.vue` Single File Component). Using lowercase, hyphenated slot names avoids any mismatch between the generated slot name and how the browser parses your template.

Each panel slot receives the following scoped props:

| Prop       | Type    | Description                                 |
|------------|---------|----------------------------------------------|
| item     | Any     | The original list item (string or object).   |
| index    | Number  | The zero-based index of the item.            |
| expanded | Boolean | Whether the panel is currently expanded.      |

If a slot is not provided for an item, the panel falls back to rendering the item's display text.

## Accessibility

Follows the W3C APG Accordion Pattern:
- Each header is rendered using the tag specified by `headingTag` (default `h3`) wrapping a `<button>` (`accordion-trigger`), with `aria-expanded` reflecting the panel's expanded state and `aria-controls` pointing at the associated panel's id.
- Each panel has `role="region"` and `aria-labelledby` pointing back at its header button's id, and is hidden (`v-show`) when collapsed.
- Keyboard support on the header buttons:
  - `ArrowDown` / `ArrowUp` moves focus to the next/previous header button, wrapping around at the ends.
  - `Home` / `End` moves focus to the first/last header button.
  - `Enter` / `Space` (native `<button>` behavior) toggles the focused panel.
- When `disabled`, header buttons are marked `disabled` and removed from the tab order.

## Animation

Panels expand and collapse with a smooth `height` transition, implemented via Vue's `<Transition>` component with JavaScript hooks (since CSS cannot transition to/from an `auto` height). The transition is automatically disabled for users who have `prefers-reduced-motion: reduce` set.

## Related Components

- [cui-Panel](./cui-Panel.md) - A resizable panel component, useful for other layout needs.
