<!--
Copyright (c) Fast Forward, LLC. All rights reserved.
Licensed under the MIT License. See LICENSE file in the project root for full license information.
-->
<template>
    <div ref="component" id="`${Id}-container`" class="cui cui-listbox" v-bind:class="{disabled:disabled, readonly:readonly}" v-on:keydown="onKeydown">
        <span class="label" v-if="label" :id="`${Id}`-label">{{ label }}</span>
        <ul ref="listbox"
            class="listbox"
            role="listbox"
            tabindex="0"
            :aria-activedescendant="activeDescendantId"
            :aria-labelledby="label ? `${Id}-label` : `${Id}-container`"
            :aria-invalid="isInvalid"
            :aria-multiselectable="multiselect"
            v-on:focus="onFocus"
            v-on:focusout="onFocusOut"
            v-bind="$attrs">
            <slot :ctrlId="Id"
                :required="required"
                :disabled="disabled"
                :readonly="readonly"
                :isInvalid="isInvalid"
                :errorMsg="error_msg">
                <li v-for="(item,idx) in listItems"
                    :key="listItemValue(item)"
                    :id="listItemId(item,idx)"
                    role="option"
                    :tabindex="-1"
                    :class="{selected:isSelected(item)}"
                    :aria-selected="isSelected(item)"
                    @click.stop="onItemClick(item, idx, $event)">
                    <slot name="list-item-content"
                        :item="item"
                        :index="idx"
                        :isSelected="isSelected(item)"
                        :text="listItemText(item)"
                        :value="listItemValue(item)">
                        {{listItemText(item)}}
                    </slot>
                </li>
                <li v-if="listItems==null || listItems.length==0" class="empty-message">
                    <slot name="empty">
                        --No items available--
                    </slot>
                </li>
             </slot>
</ul>
        <div class="errors" role="status" :id="this.Id+'_valmsg'">
            <slot name="errors" :id="Id"
                  :value="lastEmittedValue"
                  :item="lastEmittedItem"
                  :required="required"
                  :disabled="disabled"
                  :readonly="readonly"
                  :validateTrigger="valTrigger">
                {{error_msg}}
            </slot>
        </div>
        <slot v-if="$slots.default"
              :id="Id"
              :value="lastEmittedValue"
              :item="lastEmittedItem"
              :required="required"
              :disabled="disabled"
              :readonly="readonly"
              :validateTrigger="valTrigger">
        </slot>
        <input ref="input" type="hidden" :id="Id" :name="Name" :value="serializedValue"/>
    </div>
</template>

<script>
    import InputComponentBase from '../js/InputComponentBase.js';

    export default {
        extends: InputComponentBase,
        props: {
            id: { type: String, default: null },
            name: { type: String, default: null },
            label: { type: String },
            modelValue: null,
            listItems: null,
            valueField: { type: String },
            textField: { type: String },
            itemElementType: { type: String, default: 'li' },
            required: { type: Boolean, default: false },
            disabled: { type: Boolean, default: false },
            readonly: { type: Boolean, default: false },
            multiselect: { type: Boolean, default: false },
        },
        emits: ['update:model-value', 'blur', 'click', 'focus', 'input', 'change', 'error', 'clear-error'],
        data() {
            return {
                Id: null,
                Name: null,
                origValue: null,
                currValue: null,
                currItem: null,
                lastEmittedValue: null,
                lastEmittedItem: null,
                internalList: null,
                valTrigger: 0,
                activeDescendantId: null,
                lastSelectedIdx: null,
            };
        },
        computed: {
            selectedValue: {
                get() {
                    return this.currValue;
                },
                set(i) {
                    this.currValue = i;
                    this.currItem = this.multiselect ? null : this.itemFromValue(i);
                }
            },
            selectedItem() {
                return this.currItem;
            },
            selectedItems() {
                if (!Array.isArray(this.currValue)) return [];
                return this.currValue.map(v => this.itemFromValue(v)).filter(i => i != null);
            },
            serializedValue() {
                return JSON.stringify(this.selectedValue ?? null);
            },
        },
        watch: {
            modelValue(newVal) {
                if (this.multiselect) {
                    if (!arraysEqual(this.currValue, newVal)) this.setValue(newVal, true);
                } else if (this.currValue != newVal) {
                    this.setValue(newVal, true);
                }
            },
            multiselect(newVal) {
                const converted = this.coerceValue(this.currValue, newVal);
                this.setValue(converted, null, true);
            },
            listItems: {
                handler(newVal) {
                    this.$nextTick(() => this.currItem = this.multiselect ? null : this.itemFromValue(this.selectedValue));
                },
                immediate: true
            },
        },
        methods: {
            listItemId(item,idx) {
                return `${this.Id}-option-${this.valueField ? this.listItemValue(item) : 'idx-'+idx }`;
            },
            isSelected(item) {
                if (item == null) return false;
                const val = this.listItemValue(item);
                if (this.multiselect) {
                    return Array.isArray(this.selectedValue) && this.selectedValue.some(v => v == val);
                }
                return val == this.selectedValue;
            },
            onItemClick(item, idx, e) {
                if (this.disabled || this.readonly) return;
                if (this.multiselect && e && e.shiftKey && this.lastSelectedIdx != null) {
                    this.selectRange(this.lastSelectedIdx, idx);
                } else if (this.multiselect && e && (e.ctrlKey || e.metaKey)) {
                    this.toggleItem(item);
                    this.lastSelectedIdx = idx;
                } else if (this.multiselect) {
                    this.setValue([this.listItemValue(item)]);
                    this.lastSelectedIdx = idx;
                } else {
                    this.selectItem(item);
                    this.lastSelectedIdx = idx;
                }
            },
            selectRange(fromIdx, toIdx) {
                if (this.listItems == null) return;
                const start = Math.min(fromIdx, toIdx);
                const end = Math.max(fromIdx, toIdx);
                const rangeValues = this.listItems.slice(start, end + 1).map(i => this.listItemValue(i));
                this.setValue(rangeValues);
            },
            toggleItem(item) {
                let curr = Array.isArray(this.currValue) ? [...this.currValue] : [];
                const val = this.listItemValue(item);
                const idx = curr.findIndex(v => v == val);
                if (idx >= 0) curr.splice(idx, 1);
                else curr.push(val);
                this.setValue(curr);
            },
            selectItem(item) {
                if (this.disabled || this.readonly) return;
                this.setValue(this.listItemValue(item));
            },
            coerceValue(val, toMultiselect) {
                if (toMultiselect) {
                    if (val == null) return null;
                    if (Array.isArray(val)) return val;
                    return [val];
                } else {
                    if (!Array.isArray(val)) return val;
                    if (val.length == 0) return null;
                    return val[0];
                }
            },
            listItemValue(item) {
                return !this.valueField ? item : item[this.valueField];
            },
            listItemText(item) {
                if (item == null) return null;
                return !this.textField ? item : item[this.textField];
            },
            itemFromValue(val) {
                if (this.listItems == null) return null;
                let item = this.listItems.find(i => this.listItemValue(i) == val);
                return item;
            },
            itemFromListElement(el) {
                if (!el || this.listItems == null) return null;
                const idx = Array.from(this.$refs.listbox.querySelectorAll(this.itemElementType)).indexOf(el);
                return idx >= 0 ? this.listItems[idx] : null;
            },
            setValue(val, e, forceEmit) {
                if (this.disabled || this.readonly) return;
                this.selectedValue = val;
                if (!this.modelModifiers || !this.modelModifiers?.lazy || forceEmit) {
                    this.$emit('update:model-value', val);
                    if (e && e.target) e.target.value = this.currValue;
                    this.$emit('input', e);
                    if (this.origValue != this.currValue) this.$emit('change', e);
                    this.lastEmittedValue = this.selectedValue;
                    this.lastEmittedItem = this.selectedItem;
                    this.$nextTick(() => this.valTrigger++);
                }
            },
            onBlur(e) {
                this.open = false;
                this.setValue(this.selectedValue, e, true);
                if (e && e.target) e.target.value = this.selectedValue;
                this.$emit('blur', e)
            },
            onFocus(e) {
                if (!this.modelValue === undefined)
                    this.origValue = this.modelValue;
                if (e && e.target) e.target.value = this.selectedValue;
                this.$emit('focus', e);
            },
            onFocusOut(e) {
                let container = this.$refs.listbox;
                let targetEl = e?.relatedTarget;
                if (!targetEl || !container.contains(targetEl)) {
                    const blurEvent = new Event('blur', { bubbles: true });
                    this.onBlur(blurEvent);
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
                        e.preventDefault();
                        e.target.click();
                        break;

                    case ' ':
                        e.preventDefault();
                        if (this.multiselect) {
                            const item = this.itemFromListElement(target);
                            if (item) this.toggleItem(item);
                        } else {
                            e.target.click();
                        }
                        break;

                    case ('escape'):
                        this.$refs.listbox.focus();
                        break;
                }
            },
            isItemEnabled(item) {
                if (!item) return false;
                return !item.hasAttribute('disabled') && !item.classList.contains('disabled');
            },
            isListItem(element) {
                if (!element) return false;
                return element.tagName && element.tagName.toLowerCase() === this.itemElementType.toLowerCase();
            },
            getNextSiblingItem(currentItem) {
                if (!currentItem) return null;

                let nextItem = currentItem.nextElementSibling;

                // Find next enabled menu item
                while (nextItem) {
                    if (this.isListItem(nextItem) && this.isItemEnabled(nextItem)) {
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
                    if (this.isListItem(prevItem) && this.isItemEnabled(prevItem)) {
                        return prevItem;
                    }
                    prevItem = prevItem.previousElementSibling;
                }

                // Wraparound: go to last item
                return this.getLastItem();
            },
            getFirstItem() {
                const listbox = this.$refs.listbox;
                if (!listbox) return null;

                const allItems = listbox.querySelectorAll(this.itemElementType);
                for (let item of allItems) {
                    if (this.isItemEnabled(item)) {
                        return item;
                    }
                }
                return null;
            },
            getLastItem() {
                const listbox = this.$refs.listbox;
                if (!listbox) return null;

                const allItems = Array.from(listbox.querySelectorAll(this.itemElementType));
                for (let i = allItems.length - 1; i >= 0; i--) {
                    if (this.isItemEnabled(allItems[i])) {
                        return allItems[i];
                    }
                }
                return null;
            },
            setActiveItem(item) {
                if (!item) return;
                item.setAttribute('tabindex', '0');
                this.activeDescendantId = item.id || null;
                item.focus();
            },
            clearActiveItem(item) {
                if (!item) return;
                item.setAttribute('tabindex', '-1');
            },
            focusFirstItem() {
                const firstItem = this.getFirstItem();
                if (firstItem) this.setActiveItem(firstItem);
            },
            focusLastItem() {
                const lastItem = this.getLastItem();
                if (lastItem) this.setActiveItem(lastItem);
            },
            focusNextItem(currentItem) {
                if (!currentItem) {
                    this.focusFirstItem();
                    return;
                }
                const nextItem = this.getNextSiblingItem(currentItem);
                if (nextItem) {
                    this.clearActiveItem(currentItem);
                    this.setActiveItem(nextItem);
                }
            },
            focusPreviousItem(currentItem) {
                if (!currentItem) {
                    this.focusLastItem();
                    return;
                }
                const prevItem = this.getPreviousSiblingItem(currentItem);
                if (prevItem) {
                    this.clearActiveItem(currentItem);
                    this.setActiveItem(prevItem);
                }
            },
        },
        created() {
            this.Id = !this.id ? 'listbox' + cnt++ : this.id;
            this.Name = (this.name == null) ? this.Id : this.name;
        },
        mounted() {
            this.currValue = this.coerceValue(this.modelValue, this.multiselect);
        }
    };

    let cnt = 0;
    function arraysEqual(a, b) {
        if (a === b) return true;
        if (!Array.isArray(a) || !Array.isArray(b)) return false;
        if (a.length != b.length) return false;
        for (let i = 0; i < a.length; i++) if (a[i] != b[i]) return false;
        return true;
    }
</script>

<style>
    .cui-listbox ul {
        border: 1px solid #ccc;
        border-radius: 4px;
        padding: 4px 0;
        margin: 0;
        padding: 0;
        list-style-type: none;
    }
    .cui-listbox li,
    .cui-listbox [role="option"] {
        padding: 4px 8px;
        cursor: pointer;
        list-style: none;
        white-space: nowrap;
        outline: none;
        text-align: left;
    }

        .cui-listbox li:hover,
        .cui-listbox li:focus,
        .cui-listbox li.selected,
        .cui-listbox [role="option"]:hover,
        .cui-listbox [role="option"]:focus,
        .cui-listbox [role="option"].selected {
            background: #f0f0f0;
        }

        .cui-listbox li[disabled],
        .cui-listbox li.disabled,
        .cui-listbox [role="option"][disabled],
        .cui-listbox [role="option"].disabled {
            opacity: 0.5;
            cursor: not-allowed;
            pointer-events: none;
        }
</style>
