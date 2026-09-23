# cui-ContextMenu

An accessible, keyboard-navigable context menu component for Vue 3 applications. The component uses the native `<dialog>` element and provides full ARIA support for screen readers and assistive technologies.

## Features

- **Accessible**: Full ARIA support with proper roles, attributes, and keyboard navigation
- **Keyboard Navigation**: Arrow keys, Home, End, Enter, Space, and Escape
- **Smart Positioning**: Automatically positions relative to parent and adjusts if menu would go off-screen
- **Flexible Items**: Supports any HTML element type for menu items (default: `li`)
- **Visual Feedback**: Selected items are highlighted with visual indicators
- **Disabled Items**: Supports disabled menu items with proper ARIA attributes
- **Wraparound Navigation**: Arrow keys wrap around from last to first item and vice versa
- **Customizable**: Configurable behavior for focus management and closing

## Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `id` | String | `null` | No | Unique identifier for the menu element |
| `show` | Boolean | `false` | No | Controls menu visibility (supports v-model) |
| `parentTag` | String | - | **Yes** | CSS selector for the parent/trigger element |
| `itemElementType` | String | `'li'` | No | HTML element type for menu items |
| `closeOnFocusOut` | Boolean | `true` | No | Whether menu closes when focus moves outside |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `open` | None | Emitted when the menu opens |
| `close` | None | Emitted when the menu closes |
| `click` | `{ event, item, data }` | Emitted when a menu item is clicked (mouse or keyboard) |
| `changed` | `{ event, item, data }` | Emitted when a menu item is selected |
| `update:show` | `Boolean` | Emitted for v-model:show two-way binding |

### `changed` Event Payload

The `click` & `changed` event emits an object with the following properties:

| Property | Type | Description |
|----------|------|-------------|
| `event` | `Event` | The original DOM event (click or keyboard event) |
| `item` | `HTMLElement` | The selected menu item element |
| `data` | `Object` | All `data-*` attributes extracted from the item |

## Basic Usage

```vue
<template>
  <div>
    <button id="menuTrigger" @click="showMenu = true">
      Open Menu
    </button>

    <cui-context-menu 
      v-model:show="showMenu"
      parent-tag="#menuTrigger"
      @changed="onItemSelected">
      <ul>
        <li data-action="new">Menu Item 1</li>
        <li data-action="edit">Menu Item 2</li>
        <li data-action="delete">Menu Item 3</li>
      </ul>
    </cui-context-menu>
  </div>
</template>

<script>
export default {
  data() {
    return {
      showMenu: false
    };
  },
  methods: {
    onItemSelected({ event, item, data }) {
      console.log('Event:', event);
      console.log('Selected:', item.textContent);
      console.log('Data attributes:', data);
      // data = { action: "new" } or { action: "edit" }, etc.
    }
  }
};
</script>
```

## Advanced Usage

### Data Attributes

The component automatically extracts all `data-*` attributes from selected menu items. These attributes are provided as an object in the `changed` event, making it easy to associate data with menu items.

```vue
<cui-context-menu v-model:show="showMenu" parent-tag="#trigger" @changed="onSelect">
  <ul>
    <li data-action="new" data-icon="file" data-shortcut="Ctrl+N">New File</li>
    <li data-action="open" data-icon="folder" data-shortcut="Ctrl+O">Open File</li>
    <li data-action="save" data-icon="save" data-shortcut="Ctrl+S">Save File</li>
  </ul>
</cui-context-menu>

<script>
export default {
  methods: {
    onSelect({ event, item, data }) {
      // data = { action: "save", icon: "save", shortcut: "Ctrl+S" }
      console.log('Action:', data.action);
      console.log('Icon:', data.icon);
      console.log('Shortcut:', data.shortcut);

      // Access the original event if needed
      console.log('Triggered by:', event.type); // "click" or "keydown"
    }
  }
};
</script>
```

**Benefits of Data Attributes:**
- Clean separation of data from presentation
- No need to manually parse attributes in event handlers
- Supports multiple attributes per item
- Automatically handles attribute name conversion (`data-my-attr` becomes `myAttr` in the data object)

### Disabled Menu Items

```vue
<cui-context-menu v-model:show="showMenu" parent-tag="#trigger">
  <ul>
    <li>Enabled Item</li>
    <li disabled>Disabled Item</li>
    <li class="disabled">Also Disabled</li>
  </ul>
</cui-context-menu>
```

### Custom Item Element Type

```vue
<cui-context-menu 
  v-model:show="showMenu" 
  parent-tag="#trigger"
  item-element-type="div">
  <div>Item 1</div>
  <div>Item 2</div>
  <div disabled>Disabled Item</div>
</cui-context-menu>
```

### Persistent Menu (No Auto-Close)

```vue
<cui-context-menu 
  v-model:show="showMenu" 
  parent-tag="#trigger"
  :close-on-focus-out="false">
  <ul>
    <li>Item 1</li>
    <li>Item 2</li>
    <!-- Menu stays open when clicking outside -->
    <!-- Must close with Escape or programmatically -->
  </ul>
</cui-context-menu>
```

### With Icons and Complex Content

```vue
<cui-context-menu v-model:show="showMenu" parent-tag="#trigger">
  <ul>
    <li>
      <span class="icon">📄</span>
      <span>New Document</span>
    </li>
    <li>
      <span class="icon">📁</span>
      <span>Open Folder</span>
    </li>
    <li disabled>
      <span class="icon">💾</span>
      <span>Save (Disabled)</span>
    </li>
  </ul>
</cui-context-menu>
```

## Keyboard Navigation

The context menu supports full keyboard navigation following WAI-ARIA Menu pattern:

| Key | Action |
|-----|--------|
| **Arrow Down** | Move focus to next menu item (wraps to first) |
| **Arrow Up** | Move focus to previous menu item (wraps to last) |
| **Home** | Move focus to first menu item |
| **End** | Move focus to last menu item |
| **Enter** | Select the focused menu item and close menu |
| **Space** | Select the focused menu item and close menu |
| **Escape** | Close the menu without selecting |

## Positioning

The menu automatically positions itself relative to the parent element:

1. **Default**: Positions below the parent element
2. **Right Edge Detection**: Adjusts left if menu would overflow the right edge of the viewport
3. **Bottom Edge Detection**: Positions above the parent if menu would overflow the bottom of the viewport

```javascript
// Positioning happens automatically in positionMenu()
// Position below parent
dialog.style.top = `${parentRect.bottom + window.scrollY}px`;

// Adjust if off-screen
if (dialogRect.right > window.innerWidth) {
  dialog.style.left = `${window.innerWidth - dialogRect.width - 10}px`;
}
if (dialogRect.bottom > window.innerHeight) {
  dialog.style.top = `${parentRect.top - dialogRect.height}px`;
}
```

## Accessibility (ARIA)

The component implements full ARIA support:

### Menu Element
- `role="menu"` - Identifies the element as a menu
- `tabindex="-1"` - Allows focus but removes from tab order

### Menu Items
- `role="menuitem"` - Identifies each item as a menu item
- `tabindex="-1"` - Allows focus but removes from tab order
- `aria-disabled="true"` - Applied to disabled items

### Parent/Trigger Element
- `aria-haspopup="menu"` - Indicates the trigger opens a menu
- `aria-expanded="false/true"` - Indicates menu open/closed state
- `aria-controls="menu-id"` - Links trigger to menu element

### Screen Reader Announcements
- Menu items are announced as "menuitem"
- Disabled items are announced as "disabled"
- Expanded state changes are announced
- Selected items receive visual and focus indicators

## Styling

The component includes default styling that can be customized:

```css
/* Menu container */
.cui-context-menu {
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 4px 0;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 160px;
}

/* Menu items */
.cui-context-menu [role="menuitem"] {
  padding: 8px 16px;
  cursor: pointer;
  white-space: nowrap;
}

/* Hover, focus, and selected states */
.cui-context-menu [role="menuitem"]:hover,
.cui-context-menu [role="menuitem"]:focus,
.cui-context-menu [role="menuitem"].selected {
  background: #f0f0f0;
}

/* Disabled items */
.cui-context-menu [role="menuitem"][disabled],
.cui-context-menu [role="menuitem"].disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}
```

### Custom Styling Example

```vue
<style scoped>
/* Override default styles */
.cui-context-menu {
  border-color: #333;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.cui-context-menu [role="menuitem"]:hover {
  background: #007bff;
  color: white;
}
</style>
```

## Complete Example

```vue
<template>
  <div class="app">
    <h1>Context Menu Demo</h1>
    
    <button 
      id="contextMenuTrigger"
      @click="toggleMenu"
      @keydown.enter="toggleMenu"
      @keydown.space.prevent="toggleMenu">
      Right Click or Click Me
    </button>
    
    <p v-if="selectedItem">
      Last selected: {{ selectedItem }}
    </p>
    
    <cui-context-menu
      id="myContextMenu"
      v-model:show="showContextMenu"
      parent-tag="#contextMenuTrigger"
      @open="onMenuOpen"
      @close="onMenuClose"
      @changed="onItemSelected">
      <ul>
        <li data-action="new">New File</li>
        <li data-action="open">Open File</li>
        <li data-action="save">Save File</li>
        <li disabled data-action="save-as">Save As... (Disabled)</li>
        <li data-action="close">Close</li>
      </ul>
    </cui-context-menu>
  </div>
</template>

<script>
export default {
  data() {
    return {
      showContextMenu: false,
      selectedItem: null
    };
  },
  methods: {
    toggleMenu() {
      this.showContextMenu = !this.showContextMenu;
    },
    onMenuOpen() {
      console.log('Menu opened');
    },
    onMenuClose() {
      console.log('Menu closed');
    },
    onItemSelected({ event, item, data }) {
      this.selectedItem = item.textContent;
      console.log('Selected action:', data.action);
      console.log('Event type:', event.type);

      // Handle action using data attributes
      switch (data.action) {
        case 'new':
          this.createNewFile();
          break;
        case 'open':
          this.openFile();
          break;
        case 'save':
          this.saveFile();
          break;
        case 'close':
          this.closeFile();
          break;
      }
    },
    createNewFile() {
      console.log('Creating new file...');
    },
    openFile() {
      console.log('Opening file...');
    },
    saveFile() {
      console.log('Saving file...');
    },
    closeFile() {
      console.log('Closing file...');
    }
  }
};
</script>

<style scoped>
.app {
  padding: 20px;
}

button {
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
}
</style>
```

## Browser Support

- Modern browsers with `<dialog>` element support
- Chrome 37+
- Edge 79+
- Firefox 98+
- Safari 15.4+

## Best Practices

1. **Always provide a parent element**: The `parentTag` prop is required for positioning
2. **Use semantic HTML**: Use `<ul>` and `<li>` for menu items when possible
3. **Provide keyboard access**: Ensure the trigger element is keyboard accessible
4. **Clear item text**: Keep menu item text concise and clear
5. **Indicate disabled items**: Use both `disabled` attribute and visual styling
6. **Test with screen readers**: Verify ARIA attributes work with assistive technologies
7. **Handle item selection**: Always respond to the `changed` event
8. **Close explicitly when needed**: Use `v-model:show` or Escape key to close

## Common Issues

### Menu doesn't appear
- Verify `parentTag` selector is correct and element exists
- Check that `show` prop is being set to `true`
- Ensure parent element is visible and has layout

### Menu appears in wrong position
- Verify parent element has correct positioning
- Check for CSS transforms on parent elements (can affect positioning)
- Ensure viewport has enough space

### Keyboard navigation not working
- Verify menu items match `itemElementType` prop
- Ensure items are not nested incorrectly
- Check that menu has focus when opened

### Items not selectable
- Verify items don't have `disabled` attribute unless intended
- Verify menu items match `itemElementType` prop
- Ensure `changed` event handler is defined

## See Also

- [cui-PopupDialog](./cui-PopupDialog.md) - Modal dialog component
- [cui-Dropdown](./cui-Dropdown.md) - Dropdown select component
- [WAI-ARIA Menu Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menu/) - Accessibility guidelines
