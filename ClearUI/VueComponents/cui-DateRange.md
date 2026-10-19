# cui-date-range Component Documentation

## Overview

`cui-date-range` renders two `cui-textbox` date inputs (start and end, labeled "From" and "To" by default). A calendar button beside the end input opens a popup containing two mini calendars for selecting a date range. The popup header shows the year with a pencil button that switches the body to a scrollable year picker, plus buttons to clear the dates and close the popup.

The inputs show and accept dates in the browser's locale format. The component's values are always normalized `yyyy-MM-dd` dates.

---

## Props

| Prop           | Type           | Default            | Description                                                                                  |
|----------------|----------------|--------------------|----------------------------------------------------------------------------------------------|
| id             | String         | auto-generated     | Base id for the component. Also used to build the default input names.                       |
| startDate      | String / Date  | `null`             | The range start date (`yyyy-MM-dd`). Supports `v-model:start-date`.                          |
| endDate        | String / Date  | `null`             | The range end date (`yyyy-MM-dd`). Supports `v-model:end-date`.                              |
| startYear      | Number         | current year - 31  | The earliest year shown in the year picker.                                                  |
| endYear        | Number         | current year       | The latest year shown in the year picker.                                                    |
| startName      | String         | `{id}.StartDate`   | `name` of the start input, used when posting a form.                                         |
| endName        | String         | `{id}.EndDate`     | `name` of the end input, used when posting a form.                                           |
| startDateLabel | String         | `From`             | Label displayed for the start input.                                                         |
| endDateLabel   | String         | `To`               | Label displayed for the end input.                                                           |
| dateMask       | String         | `null`             | Overrides the browser locale date format, e.g. `dd/MM/yyyy`. See [Text Inputs](#text-inputs). |

---

## Events

| Event             | Payload                  | Description                                                                          |
|-------------------|--------------------------|--------------------------------------------------------------------------------------|
| update:start-date | `String | null`         | Emitted when the start date changes.                                                 |
| update:end-date   | `String | null`         | Emitted when the end date changes.                                                   |
| change            | `{ startDate, endDate }` | Emitted after a date is selected in the popup or committed in an input, when both dates are set. Not emitted when the dates are cleared. |

---

## Selection Rules

These apply to clicks in the popup calendars.

- With nothing selected, a click sets both the start and end date to that date.
- With a single-day range (start equals end), a later date sets the end date; an earlier date becomes the start.
- With a range set, a date before the start becomes the new start, a date after the end becomes the new end, and a date within the range becomes a new single-day range.
- Selected dates get a `--color-primary` border and a background of `--color-primary` at 70% opacity. The start has top, bottom and left borders, the end has top, right and bottom, and dates in between have top and bottom.

---

## Popup

- The calendar button beside the end input toggles the popup. It also closes on the close button, the Esc key, or a click outside the component.
- When the popup opens, focus moves to the close button.
- The left calendar shows the start date's month (or the current month when no start is set). The right calendar shows the end date's month (or the month after the left one). The two calendars never show the same month, and navigating one pushes or pulls the other.
- The pencil button in the header switches to the year picker, which lists years from `endYear` down to `startYear`. Choosing a year moves the left calendar to that year, keeping its month.
- The `clear dates` button in the header clears both dates by emitting `null` for each. It does not emit `change`.
- Each day button has an accessible label such as `Monday March First`.

---

## Text Inputs

- The placeholder and input mask come from the browser locale's date format. For example, a US locale shows placeholder `MM/dd/yyyy` with the input mask `99/99/9999`, and a German locale shows placeholder `dd.MM.yyyy` with input mask `99.99.9999`.
- A typed date is applied when the input loses focus. The locale text is converted to a normalized `yyyy-MM-dd` date before the start or end is set.
- Two-digit years are read as 20xx.
- An invalid date (such as `02/31/2024`) is rejected and the input reverts to the stored value.
- If the typed start is after the end, or the typed end is before the start, the two dates are swapped.
- Clearing the text of an input sets that date to `null`.
- The parser supports locales that format dates with numbers only.

### Overriding the format with `dateMask`

Set `dateMask` to use a specific format instead of the browser locale's. The pattern is used as the placeholder, and it also sets the input mask, the displayed text and how typed text is parsed.

| Token  | Meaning                                                  |
|--------|----------------------------------------------------------|
| `yyyy` | 4-digit year                                             |
| `yy`   | 2-digit year (read as 20xx)                              |
| `MM`   | 2-digit month (zero padded, e.g. `03`)                   |
| `M`    | Month with one or two digits (e.g. `3`, `12`)            |
| `dd`   | 2-digit day (zero padded, e.g. `05`)                     |
| `d`    | Day with one or two digits (e.g. `5`, `25`)              |
| other  | A literal separator, e.g. `/`, `-`, `.`                  |

The pattern must contain a year, month and day token once each. An invalid pattern logs a console warning and falls back to the browser locale format. The component's values stay `yyyy-MM-dd` either way, and `dateMask` has no effect in compact mode.

The input mask is built from the pattern using the [`cui-textbox` mask syntax](./cui-TextBox.md#input-mask): `MM`, `dd` and `yy` become `99`, `yyyy` becomes `9999`, and `M` and `d` become `9#` (a required digit followed by an optional digit). Separators that happen to be mask characters (`9`, `a`, `*`, `#`, `?` or `\`) are escaped so they stay literals.

With `M` and `d` tokens, the displayed date is not zero padded. A typed date such as `03/05/2024` in an `M/d/yyyy` input is accepted and redisplayed as `3/5/2024`.

```vue
<cui-date-range v-model:start-date="startDate" v-model:end-date="endDate" date-mask="dd/MM/yyyy" />
<cui-date-range v-model:start-date="startDate" v-model:end-date="endDate" date-mask="M/d/yyyy" />
```

---

## Compact Mode

Add the `compact` class to hide the text inputs and show a single calendar button instead.

- The inputs become `type="hidden"` with no mask, and hold the normalized `yyyy-MM-dd` value so form posts are unaffected.
- The button's tooltip shows the current `From` and `To` dates.
- The class is read when the component renders, so toggling it dynamically may not apply until the next re-render.

```vue
<cui-date-range class="compact" v-model:start-date="startDate" v-model:end-date="endDate" />
```

---

## Basic Usage

```vue
<cui-date-range
  v-model:start-date="startDate"
  v-model:end-date="endDate"
  @change="onRangeChange"
/>
```
