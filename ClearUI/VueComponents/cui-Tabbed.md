# <cui-tabbed>

An accessible tabbed interface component for Vue.js, following the [W3C ARIA Authoring Practices Guide (APG) Tabs Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/) (Automatic Activation). Renders a list of tab buttons paired with associated content panels, using the `listItems` prop to define each tab/panel segment.

## Usage

```vue
<cui-tabbed
  v-model="selectedItem"
  :list-items="['Details', 'Specifications', 'Reviews']">
  <template #panel-details>
    Product details go here.
  </template>
  <template #panel-specifications>
    Product specifications go here.
  </template>
  <template #panel-reviews>
    Product reviews go here.
  </template>
</cui-tabbed>
```

## Usage with Objects

When `valueField` is set, `v-model` emits the matching property's value instead of the full item object:

```vue
<cui-tabbed
  v-model="selectedValue"
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
</cui-tabbed>
```

## Props

| Name          | Type            | Default                 | Description                                                                                           |
|---------------|-----------------|--------------------------|-----------------------------------------------------------------------------------------------------------|
| listItems   | Array           | `[]`                     | Array of strings or objects. Each entry defines one tab/panel pair.                                       |
| textField   | String          | —                        | Property name on each item object used as its display text and to derive the panel slot name. If omitted (or items are plain strings), the item itself is used as the text. |
| valueField  | String          | —                        | Property name on each item object used as its `v-model` value (see **v-model Value Semantics** below).   |
| orientation | String          | `'horizontal'`           | Layout/keyboard-navigation orientation of the tab list. Accepts `'horizontal'` or `'vertical'`.           |
| modelValue  | Any             | —                        | The selected tab's value (v-model) — see **v-model Value Semantics** below.                                |
| disabled    | Boolean         | `false`                  | Disables all tab buttons.                                                                                  |
| readonly    | Boolean         | `false`                  | Prevents switching tabs, but does not visually disable the tab buttons.                                   |
| noItemsMsg  | String          | `'No items available'`   | Message displayed when `listItems` is empty.                                                              |
| id          | String          | auto                     | Base id used to generate unique tab/panel element ids.                                                    |

## v-model Value Semantics

`cui-tabbed`'s `v-model` does not track tab index — it tracks the **value** of the selected item:

- If `valueField` is **not** set, `v-model` emits the entire list item (the string or object) for the selected tab.
- If `valueField` **is** set and the selected item is an object with a property matching `valueField`, `v-model` emits that property's value.
- If `valueField` is set but the selected item is not an object, or is an object without that property, `v-model` falls back to emitting the entire item (same as if `valueField` were not set).

## Events

| Event Name         | Payload | Description                                            |
|--------------------|---------|---------------------------------------------------------|
| update:model-value| Any     | Emitted when the selected tab's value changes.           |
| change            | Any     | Emitted alongside `update:model-value`.                  |

## Slots

Each item in `listItems` produces one named panel slot. The slot name is derived from the item's display text (the `textField` property value for objects, or the string itself for plain strings), sanitized by replacing any run of whitespace or non-alphanumeric characters with a single hyphen, lowercased, then prefixed with `panel-`.

For example:
- `"Section One"` → `#panel-section-one`
- `"Billing & Shipping"` → `#panel-billing-shipping`

> **Note:** Slot names are always lowercased because HTML attribute/element names (including `<template #slot-name>` shorthand) are case-insensitive when parsed from in-DOM templates (e.g. markup written directly in a `.cshtml`/`.html` page rather than a compiled `.vue` Single File Component). Using lowercase, hyphenated slot names avoids any mismatch between the generated slot name and how the browser parses your template.

Each panel slot receives the following scoped props:

| Prop       | Type    | Description                                 |
|------------|---------|------------------------------------------------|
| item     | Any     | The original list item (string or object).     |
| index    | Number  | The zero-based index of the item.               |
| selected | Boolean | Whether the panel is currently selected/active. |

If a slot is not provided for an item, the panel falls back to rendering the item's display text.

## Accessibility

Follows the W3C APG Tabs Pattern (Automatic Activation model):
- The tab button container has `role="tablist"` and `aria-orientation` matching the `orientation` prop.
- Each tab is a `<button role="tab">` with `aria-selected` reflecting whether it is active, and `aria-controls` pointing at its associated panel's id.
- Each panel has `role="tabpanel"`, `tabindex="0"`, and `aria-labelledby` pointing back at its tab button's id, and is hidden (`v-show`) when not selected.
- Keyboard support on the tab buttons:
  - `ArrowRight` / `ArrowLeft` (horizontal) or `ArrowDown` / `ArrowUp` (vertical) moves focus to and automatically selects the next/previous tab, wrapping around at the ends.
  - `Home` / `End` moves focus to and selects the first/last tab.
  - Only the active tab is in the natural tab order (`tabindex="0"`); inactive tabs are `tabindex="-1"` and reached via arrow-key navigation, per the roving tabindex pattern.
- When `disabled`, tab buttons are marked `disabled` and removed from the tab order.

## Related Components

- [cui-Accordion](./cui-Accordion.md) - A vertically stacked, collapsible alternative to tabs for the same kind of segmented content.
