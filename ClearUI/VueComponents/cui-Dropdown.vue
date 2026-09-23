<!--
Copyright (c) Fast Forward, LLC. All rights reserved.
Licensed under the MIT License. See LICENSE file in the project root for full license information.
-->
<template>
    <div ref="component" class="cui cui-dropdown" v-bind:class="{disabled:disabled, readonly:readonly}">  
        <div ref="container" class="dropdown-container">
            <label :for="Id" v-if="this.label">{{ label }}</label>
            <div ref="dropdown" class="dropdown" @click="toggleDropdown" role="combobox" tabindex="0" v-on:focusout="onFocusOut" v-on:focus="onFocus" v-on:keydown="onKeydown">
                <input ref="input" type="text" :id="Id" :name="Name" :value="selectedText" tabindex="-1" :placeholder="placeholder" autocomplete="false"
                       :aria-invalid="isInvalid" v-on:focus="onFocus_Input" v-on:mousedown="noop" v-on:click="noop" />
                <span class="symbols expander"></span>
            </div>
            <dialog ref="list" class="dropdown-list" role="listbox" tabindex="-1" v-on:focusout="onFocusOut" v-on:keydown.stop="onKeydown_list">
                <div v-for="option in internalList"
                     :key="listItemValue(option)"
                     :role="isGroupItem(option)?'presentation':'option'"
                     :data-list-idx="option.$__idx"
                     :tabindex="-1"
                     :class="{selected:isSelected(option), 'option-group':isGroupItem(option)}"
                     :aria-selected="isSelected(option)"
                     @click.stop="selectOption(option)">
                    {{ listItemText(option) }}
                    <div v-if="option.subItems!=null && option.subItems.length>0" role="group" :aria-label="listItemText(option)">
                        <div v-for="subOpt in option.subItems"
                             :role="isGroupItem(subOpt)?'group':'option'"
                             :data-list-idx="subOpt.$__idx"
                             :tabindex="-1"
                             :aria-selected="isSelected(subOpt)"
                             :class="{selected:isSelected(subOpt), 'option-group':isGroupItem(subOpt)}"
                             v-on:click.stop="selectOption(subOpt)">
                            {{ listItemText(subOpt) }}
                        </div>
                    </div>
                    <div v-if="!internalList||internalList.length==0">No List Items</div>
                </div>
            </dialog>
        </div>
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
    </div>
</template>

<script>
    import InputComponentBase from '../js/InputComponentBase.js';

    export default {
        extends: InputComponentBase,
        props: {
            label: { type: String },
            listItems: { type: Array },
            modelValue: null,
            modelModifiers: null,
            valueField: { type: String },
            textField: { type: String },
            groupField: { type: String },
            firstItem: null,

            placeholder: { type: String },
            required: { type: Boolean, default: false },
            disabled: { type: Boolean, default: false },
            readonly: { type: Boolean, default: false },

        },
        emits: ['update:model-value', 'blur', 'click', 'focus', 'input', 'change'],
        data() {
            return {
                Id: null,
                Name: null,
                open: false,
                origValue: null,
                currValue: null,
                currItem: null,
                lastEmittedValue: null,
                lastEmittedItem: null,
                internalList: null,
                valTrigger: 0,
            };
        },
        computed: {
            selectedText() {
                return this.listItemText(this.selectedItem);
            },
            selectedValue: {
                get() {
                    return this.currValue;
                },
                set(i) {
                    this.currValue = i;
                    this.currItem = this.itemFromValue(i);
                }
            },
            selectedItem() {
                return this.currItem;
            },
        },
        watch: {
            open(newVal) {
                console.log('open-newVal: ', newVal);
                if (newVal) this.$refs.list.show();
                else this.$refs.list.close();
            },
            modelValue(newVal) {
                if (this.currValue != newVal) {
                    this.setValue(newVal, true);
                }
            },
            listItems: {
                handler(newVal) {
                    this.parseItemList(newVal);
                    this.$nextTick(() => this.currItem = this.itemFromValue(this.selectedValue));
                },
                immediate: true
            }
        },
        methods: {
            noop() {
                this.$refs.dropdown.focus();
            },
            toggleDropdown(e) {
                if (this.disabled || this.readonly) return;
                console.log('click');
                this.open = !this.open;
                this.$emit('click', e);
            },
            selectOption(option) {
                if (this.disabled || this.readonly) return;
                if (this.isGroupItem(option)) return;
                this.setValue(this.listItemValue(option));
                this.open = false;
                this.$refs.dropdown.focus();
            },
            isSelected(item) {
                if (item == null) return false;
                if (this.isGroupItem(item)) return false;
                return this.listItemValue(item) == this.selectedValue;
            },
            listItemValue(item) {
                return !this.valueField ? item : item[this.valueField];
            },
            listItemText(item) {
                if (item == null) return null;
                return !this.textField ? item : item[this.textField];
            },
            itemFromValue(val) {
                console.log("itemFromValue: ", val, !this.listItems);
                if (this.firstItem) {
                    if (this.listItemValue(this.firstItem) == val) return this.firstItem;
                }
                if (this.listItems==null) return null;
                let item = this.listItems.find(i => this.listItemValue(i) == val);
                return item;
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
            onFocus_Input(e) {
                this.$refs.dropdown.focus();
            },
            onFocusOut(e) {
                let container = this.$refs.container;
                let targetEl = e?.relatedTarget;
                console.log('focusout: ', container, targetEl);
                if (!targetEl || !container.contains(targetEl)) {
                    const blurEvent = new Event('blur', { bubbles: true });
                    this.onBlur(blurEvent);
                }
            },
            isGroupItem(item) {
                if (item == null) return false;
                if (this.groupField == null) return false;
                return item.$__isGroupItem == true;
            },
            parseItemList(list) {
                if (this.firstItem != null && list?.length > 0 && list[0] != this.firstItem) list = [this.firstItem, ...list];
                if (!this.groupField || !list) {
                    this.internalList = list;
                    this.currItem = this.itemFromValue(this.selectedValue);
                    return;
                }
                this.internalList = [];
                let _currGroup = null;
                let _idx = 0;
                for (let i of list) {
                    if (!(i instanceof Object)) {
                        this.internalList.push(i);
                        continue;
                    }
                    i.$__idx = _idx;
                    if (i[this.groupField] == null) {
                        this.internalList.push(i);
                    } else {
                        if (_currGroup == null || _currGroup[this.textField] != i[this.groupField]) {
                            let grpItem = { $__isGroupItem: true };
                            grpItem[this.textField] = i[this.groupField];
                            if (this.valueField != null) grpItem[this.valueField] = -999.999;
                            _currGroup = grpItem;
                            this.internalList.push(grpItem);
                        }
                        if (!_currGroup.subItems) _currGroup.subItems = [];
                        _currGroup.subItems.push(i);
                    }
                    _idx++;
                }
            },
            onKeydown(e) {
                switch (e.key) {
                    case ('escape'):
                        this.open = false;
                        this.$refs.dropdown.focus();
                        break;

                    case ('Enter'):
                    case (' '):
                        e.target.click();
                        break;
                }
            },
            onKeydown_list(e) {
                switch (e.key) {
                    case ('escape'):
                        this.open = false;
                        this.$refs.dropdown.focus();
                        break;

                    case ('Enter'):
                    case (' '):
                        e.target.click();
                        break;
                    case ('ArrowDown'): {
                        let found = false;
                        let nextSib = GetNextItem(e.target);
                        if (nextSib) nextSib.focus();
                        break;
                        function GetNextItem(el) {
                            if (!el) return null;
                            let role = el.getAttribute('role');
                            if (role?.toString().toLowerCase().trim() == 'listbox') return null;
                            let nextSib = el.nextElementSibling;
                            if (!nextSib) return GetNextItem(el.parentElement);
                            role = nextSib.getAttribute('role');
                            if (role?.toString().trim() == '' || role?.toString().toLowerCase().trim() == 'option') return nextSib;
                            let nextChild = nextSib.querySelector('div[role=option]');
                            return nextChild ?? GetNextItem(nextSib);
                        }
                    }
                    case ('ArrowUp'): {
                        let found = false;
                        let prevSib = GetPrevItem(e.target);
                        if (prevSib) prevSib.focus();
                        break;
                        function GetPrevItem(el) {
                            if (!el) return null;
                            let role = el.getAttribute('role');
                            if (role?.toString().toLowerCase().trim() == 'listbox') return null;
                            let prevSib = el.previousElementSibling;
                            if (!prevSib) return GetPrevItem(el.parentElement);
                            role = prevSib.getAttribute('role');
                            if (role?.toString().trim() == '' || role?.toString().toLowerCase().trim() == 'option') return prevSib;
                            let nextChild = prevSib.querySelector('div[role=option]');
                            return nextChild ?? GetPrevItem(prevSib);
                        }
                    }
                    default: //support searching based on keypress
                        this.open = true;
                        if (this.lastSearchKey == e.key) this.lastSearchKeyIdx++;
                        else this.lastSearchKeyIdx = 0;
                        let i = 0;
                        for (i = this.lastSearchKeyIdx; i < this.listItems.length; i++) {
                            let item = this.listItems[i];
                            if (!this.ListItemText(item).toLowerCase().startsWith(e.key.toLowerCase())) continue;
                            let option = this.$refs.list.querySelector(`div[data-list-idx=${i}]`);
                            option.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
                            option.focus();
                            this.selectItem(item);
                            break;
                        }
                        this.lastSearchKey = e.key;
                        this.lastSearchKeyIdx = i;
                }
            },
        },
        created() {
            this.Id = !this.id ? 'dropdown' + cnt++ : this.id;
            this.Name = (this.name == null) ? this.Id : this.name;
        },
        mounted() {
            this.currValue = this.modelValue;
        }
    };
    let cnt = 0;
</script>

<style>
    .cui-dropdown {
        min-width: 160px;
        width: auto;
    }

        .cui-dropdown .expander::before {
            content: "\e313";
            vertical-align: middle;
        }

        .cui-dropdown .dropdown-container {
            position: relative;
        }

        .cui-dropdown .dropdown {
            display: flex;
            border: 1px solid #ccc;
            padding: 0;
            cursor: pointer;
            background: #fff;
        }

            .cui-dropdown .dropdown input {
                border: none;
                outline: none;
                width:100%;
            }

        .cui-dropdown .dropdown-list {
            margin: 0;
            width: 100%;
            z-index: 99;
            position: absolute;
            padding: 4px;
            background: #fff;
            border: 1px solid #ccc;
            border-radius: 0 0 9px 9px;
            text-align: left;
        }

        .cui-dropdown .option-group{
            font-weight:500;
        }

        .cui-dropdown [role=option] {
            font-weight: normal;
            display: block;
            padding: 8px;
            cursor: pointer;
        }

            .cui-dropdown [role=option]:hover {
                background: #eee;
            }

            .cui-dropdown [role=option].selected {
                background: #eee;
            }
</style>