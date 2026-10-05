<!--
Copyright (c) Fast Forward, LLC. All rights reserved.
Licensed under the MIT License. See LICENSE file in the project root for full license information.
-->
<template>
    <dialog ref="dialog" 
            :id="id"
            class="cui cui-context-menu" 
            role="menu"
            tabindex="-1"
            v-on:keydown="onKeydown"
            v-on:focusout="onFocusOut">
        <slot></slot>
    </dialog>
</template>

<script>
    export default {
        props: {
            id: { type: String, default: null },
            show: { type: Boolean, default: false },
            parentTag: { type: String, required: true },
            itemElementType: { type: String, default: 'li' },
            closeOnFocusOut: { type: Boolean, default: true },
        },
        emits: ['open', 'close', 'changed', 'update:show', 'click'],
        data() {
            return {
                isOpen: false,
                parentElement: null,
            };
        },
        watch: {
            show(newVal) {
                if (newVal && !this.isOpen) {
                    this.openMenu();
                } else if (!newVal && this.isOpen) {
                    this.closeMenu();
                }
            }
        },
        methods: {
            openMenu() {
                if (this.isOpen) return;

                // Find parent element
                this.parentElement = document.querySelector(this.parentTag);
                if (!this.parentElement) {
                    console.warn(`Parent element not found: ${this.parentTag}`);
                    return;
                }

                // Show dialog
                this.$refs.dialog.show();
                this.isOpen = true;

                // Update parent ARIA attributes
                this.parentElement.setAttribute('aria-expanded', 'true');

                // Position the menu
                this.$nextTick(() => {
                    this.positionMenu();
                    this.focusFirstItem();
                });

                this.$emit('open');
                this.$emit('update:show', true);
            },
            closeMenu() {
                if (!this.isOpen) return;

                this.clearAllSelected();
                this.$refs.dialog.close();
                this.isOpen = false;

                // Update parent ARIA attributes
                if (this.parentElement) {
                    this.parentElement.setAttribute('aria-expanded', 'false');
                }

                this.$emit('close');
                this.$emit('update:show', false);
            },
            positionMenu() {
                if (!this.parentElement) return;

                const parentRect = this.parentElement.getBoundingClientRect();
                const dialog = this.$refs.dialog;

                // Position below parent element
                dialog.style.position = 'absolute';
                dialog.style.left = `${parentRect.left + window.scrollX}px`;
                dialog.style.top = `${parentRect.bottom + window.scrollY}px`;

                // Adjust if menu goes off screen
                this.$nextTick(() => {
                    const dialogRect = dialog.getBoundingClientRect();

                    // Check right edge
                    if (dialogRect.right > window.innerWidth) {
                        dialog.style.left = `${window.innerWidth - dialogRect.width - 10 + window.scrollX}px`;
                    }

                    // Check bottom edge
                    if (dialogRect.bottom > window.innerHeight) {
                        dialog.style.top = `${parentRect.top + window.scrollY - dialogRect.height}px`;
                    }
                });
            },
            isItemEnabled(item) {
                if (!item) return false;
                return !item.hasAttribute('disabled') && !item.classList.contains('disabled');
            },
            isMenuItem(element) {
                if (!element) return false;
                return element.tagName && element.tagName.toLowerCase() === this.itemElementType.toLowerCase();
            },
            getNextSiblingItem(currentItem) {
                if (!currentItem) return null;

                let nextItem = currentItem.nextElementSibling;

                // Find next enabled menu item
                while (nextItem) {
                    if (this.isMenuItem(nextItem) && this.isItemEnabled(nextItem)) {
                        return nextItem;
                    }
                    nextItem = nextItem.nextElementSibling;
                }

                // Wraparound: go to first item
                return this.getFirstItem();
            },
            getPreviousSiblingItem(currentItem) {
                if (!currentItem) return null;

                let prevItem = currentItem.previousElementSibling;

                // Find previous enabled menu item
                while (prevItem) {
                    if (this.isMenuItem(prevItem) && this.isItemEnabled(prevItem)) {
                        return prevItem;
                    }
                    prevItem = prevItem.previousElementSibling;
                }

                // Wraparound: go to last item
                return this.getLastItem();
            },
            getFirstItem() {
                const dialog = this.$refs.dialog;
                if (!dialog) return null;

                const allItems = dialog.querySelectorAll(this.itemElementType);
                for (let item of allItems) {
                    if (this.isItemEnabled(item)) {
                        return item;
                    }
                }
                return null;
            },
            getLastItem() {
                const dialog = this.$refs.dialog;
                if (!dialog) return null;

                const allItems = Array.from(dialog.querySelectorAll(this.itemElementType));
                for (let i = allItems.length - 1; i >= 0; i--) {
                    if (this.isItemEnabled(allItems[i])) {
                        return allItems[i];
                    }
                }
                return null;
            },
            focusFirstItem() {
                const firstItem = this.getFirstItem();
                if (firstItem) {
                    this.clearAllSelected();
                    firstItem.setAttribute('tabindex', '0');
                    firstItem.classList.add('selected');
                    firstItem.focus();
                }
            },
            focusLastItem() {
                const lastItem = this.getLastItem();
                if (lastItem) {
                    this.clearAllSelected();
                    lastItem.setAttribute('tabindex', '0');
                    lastItem.classList.add('selected');
                    lastItem.focus();
                }
            },
            focusNextItem(currentItem) {
                if (!currentItem) {
                    this.focusFirstItem();
                    return;
                }

                const nextItem = this.getNextSiblingItem(currentItem);
                if (nextItem) {
                    currentItem.setAttribute('tabindex', '-1');
                    currentItem.classList.remove('selected');
                    nextItem.setAttribute('tabindex', '0');
                    nextItem.classList.add('selected');
                    nextItem.focus();
                }
            },
            focusPreviousItem(currentItem) {
                if (!currentItem) {
                    this.focusLastItem();
                    return;
                }

                const prevItem = this.getPreviousSiblingItem(currentItem);
                if (prevItem) {
                    currentItem.setAttribute('tabindex', '-1');
                    currentItem.classList.remove('selected');
                    prevItem.setAttribute('tabindex', '0');
                    prevItem.classList.add('selected');
                    prevItem.focus();
                }
            },
            clearAllSelected() {
                const dialog = this.$refs.dialog;
                if (dialog) {
                    const items = dialog.querySelectorAll(this.itemElementType);
                    items.forEach(item => item.classList.remove('selected'));
                }
            },
            onKeydown(e) {
                const target = e.target.closest(this.itemElementType);

                switch (e.key) {
                    case 'ArrowDown':
                        e.preventDefault();
                        if (target) {
                            this.focusNextItem(target);
                        } else {
                            this.focusFirstItem();
                        }
                        break;

                    case 'ArrowUp':
                        e.preventDefault();
                        if (target) {
                            this.focusPreviousItem(target);
                        } else {
                            this.focusLastItem();
                        }
                        break;

                    case 'Home':
                        e.preventDefault();
                        this.focusFirstItem();
                        break;

                    case 'End':
                        e.preventDefault();
                        this.focusLastItem();
                        break;

                    case 'Enter':
                    case ' ':
                        e.preventDefault();
                        if (target) {
                            this.selectItem(e,target);
                        }
                        break;

                    case 'Escape':
                        e.preventDefault();
                        this.closeMenu();
                        break;
                }
            },
            selectItem(e,item) {
                if (!item) return;

                // Extract all data-* attributes into an object
                const dataAttributes = {};
                for (let i = 0; i < item.attributes.length; i++) {
                    const attr = item.attributes[i];
                    if (attr.name.startsWith('data-')) {
                        // Remove 'data-' prefix and use the rest as property name
                        const propertyName = attr.name.substring(5);
                        dataAttributes[propertyName] = attr.value;
                    }
                }

                // Emit changed event with the selected item and its data attributes
                this.$emit('changed', { event: e, item: item, data: dataAttributes });
                this.$emit('click', { event: e, item: item, data: dataAttributes });

                // Close the menu
                this.closeMenu();
            },
            onFocusOut(e) {
                // Only close menu if closeOnFocusOut is enabled
                if (!this.closeOnFocusOut) return;

                // Close menu if focus moves outside
                const dialog = this.$refs.dialog;
                const relatedTarget = e.relatedTarget;

                // Small delay to allow clicks to register
                setTimeout(() => {
                    if (!relatedTarget || !dialog.contains(relatedTarget)) {
                        if (this.isOpen) {
                            this.closeMenu();
                        }
                    }
                }, 100);
            },
            handleItemClick(e) {
                const item = e.target.closest(this.itemElementType);
                if (item && !item.hasAttribute('disabled') && !item.classList.contains('disabled')) {
                    this.selectItem(e,item);
                }
            }
        },
        created() {
            this.internalId = this.id ?? 'cui-context-menu-' + cnt++;
        },
        mounted() {
            // Setup click listeners on menu items
            const dialog = this.$refs.dialog;
            if (dialog) {
                dialog.addEventListener('click', this.handleItemClick);
            }

            // Setup initial tabindex for menu items
            this.$nextTick(() => {
                const dialog = this.$refs.dialog;
                if (dialog) {
                    const items = dialog.querySelectorAll(this.itemElementType);
                    items.forEach((item) => {
                        item.setAttribute('tabindex', '-1');
                        item.setAttribute('role', 'menuitem');
                        // Set aria-disabled for disabled items
                        if (!this.isItemEnabled(item)) {
                            item.setAttribute('aria-disabled', 'true');
                        }
                    });
                }

                // Setup parent ARIA attributes
                const parentElement = document.querySelector(this.parentTag);
                if (parentElement) {
                    parentElement.setAttribute('aria-haspopup', 'menu');
                    parentElement.setAttribute('aria-controls', this.id || this.internalId);
                    parentElement.setAttribute('aria-expanded', 'false');
                }
            });
        },
        unmounted() {
            const dialog = this.$refs.dialog;
            if (dialog) {
                dialog.removeEventListener('click', this.handleItemClick);
            }
        }
    };

    let cnt = 0;
</script>

<style>
.cui-context-menu {
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 4px 0;
    background: #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    min-width: 160px;
    margin: 0;
}

.cui-context-menu::backdrop {
    background: transparent;
}

.cui-context-menu li,
.cui-context-menu [role="menuitem"] {
    padding: 8px 16px;
    cursor: pointer;
    list-style: none;
    white-space: nowrap;
    outline: none;
}

.cui-context-menu li:hover,
.cui-context-menu li:focus,
.cui-context-menu li.selected,
.cui-context-menu [role="menuitem"]:hover,
.cui-context-menu [role="menuitem"]:focus,
.cui-context-menu [role="menuitem"].selected {
    background: #f0f0f0;
}

.cui-context-menu li[disabled],
.cui-context-menu li.disabled,
.cui-context-menu [role="menuitem"][disabled],
.cui-context-menu [role="menuitem"].disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
}

.cui-context-menu ul {
    margin: 0;
    padding: 0;
}
</style>
