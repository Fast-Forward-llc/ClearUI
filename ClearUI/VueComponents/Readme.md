# ClearUI Vue Components Library

ClearUI Vue Components is a collection of reusable, accessible, and form-friendly Vue.js UI components designed for enterprise and business web applications. The library provides a consistent look and feel, robust validation, and seamless integration with forms and Razor Pages.

## Features

- **Accessible**: All components are built with accessibility in mind, supporting ARIA roles, keyboard navigation, and screen readers.
- **Form Integration**: Compatibility with HTML forms and server postbacks.
- **Validation**: Built-in error display, validation slots, and integration with custom validation logic.
- **Customizable**: Supports slots, custom icons, and flexible value types (booleans, strings, numbers, arrays).
- **Modern UI**: Uses Material Symbols and modern CSS for a clean, professional appearance.

## Components (Alphabetical)

- [cui-checkbox](./cui-Checkbox.md): Custom checkbox and switch component with support for booleans, strings, numbers, lazy v-model, and grouped checkboxes.
- [cui-checkbox-grp](./cui-CheckboxGrp.md): Checkbox group component for grouped selection, custom values, and validation.
- [cui-dropdown](./cui-Dropdown.md): Dropdown/select component supporting groups, custom rendering, and validation.
- [cui-error-summary](./cui-ErrorSummary.md): Error summary component for displaying and navigating validation errors.
- [cui-grid](./cui-Grid.md): Data grid component for displaying tabular data with sorting, filtering, and selection.
- [cui-http-request](./cui-HttpRequest.md): HTTP request component for AJAX calls and data binding.
- [cui-listbox](./cui-Listbox.md): Accessible single-select listbox with keyboard navigation, ARIA support, and form integration.
- [cui-popup-dialog](./cui-PopupDialog.md): Accessible modal dialog with configurable heading, message, and buttons.
- [cui-radio-btn](./cui-RadioBtn.md): Custom radio button component for single selection, supporting custom values and validation.
- [cui-radio-btn-grp](./cui-RadioBtnGrp.md): Radio button group component for grouped selection, custom values, and validation.
- [cui-textbox](./cui-TextBox.md): Flexible textbox component with validation, modifiers, and error display.
- [cui-textarea](./cui-TextArea.md): Multi-line textarea component with character limit countdown, validation, modifiers, and error display.
- [cui-tree-list](./cui-TreeList.md): Hierarchical tree list for multi-select, keyboard navigation, and custom node rendering.
- [cui-valmsg](./cui-ValMsg.md): Validation message display for form fields and controls.

## Getting Started

1. Import and register the components you need in your Vue app.
2. Use the components in your templates, binding to your data and validation logic.
3. Refer to the individual component documentation for detailed usage, props, events, and slots.

For more examples and advanced usage, see the demo app or each component's markdown file.

## Basic Examples

### cui-checkbox-grp.vue
**Description:** Group of checkboxes for multi-select scenarios.
**Usage:**
```vue
<cui-checkbox-grp :listItems="items" v-model="selectedValues" />
```

### cui-dropdown.vue
**Description:** Dropdown/select component supporting groups, custom rendering, and validation.
**Usage:**
```vue
<cui-dropdown :listItems="options" v-model="selectedOption" />
```

### cui-grid.vue
**Description:** Data grid component for displaying tabular data with sorting, filtering, and selection.
**Usage:**
```vue
<cui-grid :columns="gridColumns" :rows="gridRows" v-model="selectedRows" />
```

### cui-listbox.vue
**Description:** Accessible single-select listbox with keyboard navigation, ARIA support, and form integration.
**Usage:**
```vue
<cui-listbox :listItems="items" value-field="id" text-field="name" v-model="selectedId" label="Select an item" />
```

### cui-radio-btn.vue
**Description:** Single radio button component.
**Usage:**
```vue
<cui-radio-btn :value="optionValue" v-model="selectedValue" />
```

### cui-radio-btn-grp.vue
**Description:** Group of radio buttons for single selection.
**Usage:**
```vue
<cui-radio-btn-grp :listItems="options" v-model="selectedValue" />
```

### cui-textbox.vue
**Description:** Text input box with validation and error display.
**Usage:**
```vue
<cui-textbox v-model="textValue" :placeholder="'Enter text...'" />
```

### cui-textarea.vue
**Description:** Multi-line textarea with character limit countdown, validation, and error display.
**Usage:**
```vue
<cui-textarea v-model="textValue" :maxlength="500" :placeholder="'Enter text...'" />
```

### cui-tree-list.vue
**Description:** Tree view component for displaying hierarchical data.
**Usage:**
```vue
<cui-tree-list :nodes="treeData" v-model="selectedNode" />
```

### cui-tree-node.vue
**Description:** Represents a single node in a tree structure. Used internally by cui-tree-list.
**Usage:**
```vue
<!-- Usually not used directly; used by cui-tree-list -->
```

### cui-valmsg.vue
**Description:** Displays validation messages for form fields.
**Usage:**
```vue
<cui-valmsg :errorMsg="errorMessage" />
```

---
