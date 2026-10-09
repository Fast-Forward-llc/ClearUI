<!--
Copyright (c) Fast Forward, LLC. All rights reserved.
Licensed under the MIT License. See LICENSE file in the project root for full license information.
-->
<template>
    <div ref="component" class="cui cui-dropdown" v-bind:class="{disabled:disabled, readonly:readonly}">  
        <div ref="container" class="dropdown-container">
            <label :for="Id" v-if="this.label">{{ label }}</label>
            <div ref="dropdown" class="dropdown" @click="toggleDropdown" role="combobox" tabindex="0" v-on:focusout="onFocusOut" v-on:focus="onFocus" v-on:keydown="onKeydown" :style="{'anchor-name':'--'+Id}">
                <input ref="input" type="text" :id="Id" :value="selectedText" tabindex="-1" :placeholder="placeholder" autocomplete="false"
                       :aria-invalid="isInvalid" v-on:focus="onFocus_Input" v-on:mousedown="noop" v-on:click="noop" />
                <input ref="hiddenInput" type="hidden" :name="Name" :value="serializedValue" />
                <span class="symbols expander"></span>
            </div>
            <dialog ref="list" class="dropdown-list" role="listbox" tabindex="-1" :aria-multiselectable="multiselect" v-on:focusout="onFocusOut" v-on:keydown.stop="onKeydown_list" 
                    :style="{'position-anchor':'--'+Id, 'container-name':Id}">
                <slot name="option-list" :items="internalList" :selectedValue="selectedValue" :listItemValue="listItemValue" :listItemText="listItemText" :isSelected="isSelected" :selectOption="selectOption" :isGroupItem="isGroupItem" >
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
                </slot>
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
            multiselect: { type: Boolean, default: false },

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
                if (this.multiselect) return this.selectedItems.map(i => this.listItemText(i)).join(', ');
                return this.listItemText(this.selectedItem);
            },
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
            open(newVal) {
                console.log('open-newVal: ', newVal);
                if (newVal) this.$refs.list.show();
                else this.$refs.list.close();
            },
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
                    this.parseItemList(newVal);
                    this.$nextTick(() => this.currItem = this.multiselect ? null : this.itemFromValue(this.selectedValue));
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
                const val = this.listItemValue(option);
                if (this.multiselect) {
                    let curr = Array.isArray(this.currValue) ? [...this.currValue] : [];
                    const idx = curr.findIndex(v => v == val);
                    if (idx >= 0) curr.splice(idx, 1);
                    else curr.push(val);
                    this.setValue(curr);
                } else {
                    this.setValue(val);
                    this.open = false;
                    this.$refs.dropdown.focus();
                }
            },
            isSelected(item) {
                if (item == null) return false;
                if (this.isGroupItem(item)) return false;
                const val = this.listItemValue(item);
                if (this.multiselect) {
                    return Array.isArray(this.selectedValue) && this.selectedValue.some(v => v == val);
                }
                return val == this.selectedValue;
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
                    this.currItem = this.multiselect ? null : this.itemFromValue(this.selectedValue);
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
                            if (!this.listItemText(item).toLowerCase().startsWith(e.key.toLowerCase())) continue;
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
            checkListPosition(entries) {
                entries.forEach((entry) => {
                    console.log('ratio:' + entry.intersectionRatio);
                });

                const popup = this.$refs.list;
                const anchor = this.$refs.dropdown;

                const rectPopup = popup.getBoundingClientRect();
                const rectAnchor = anchor.getBoundingClientRect();

                const flippedToTop = rectPopup.bottom <= rectAnchor.top;
                const flippedToBottom = rectPopup.top >= rectAnchor.bottom;
                console.log(`popup.bottom:${rectPopup.bottom} anchor.top:${rectAnchor.top}`);
                if(flippedToTop) {
                    console.log("Popup is now above the anchor (block-start)");
                    popup.classList.add("anchored-top");
                } else if(flippedToBottom) {
                    console.log("Popup is now below the anchor (block-end)");
                    popup.classList.remove("anchored-top");
                }
            },
            detectFlip() {
                
                const anchorRect = this.$refs.dropdown.getBoundingClientRect();
                const popupRect = this.$refs.list.getBoundingClientRect();

                const anchoredTop = popupRect.top < anchorRect.top;
                if (this.anchoredTop != anchoredTop) {
                    console.log(`detectFlip - popupRect.top:${popupRect.top} anchorRect.top:${anchorRect.top}`);
                    this.$refs.list.classList.toggle("anchored-top", anchoredTop);
                    this.anchoredTop = anchoredTop;
                }
                requestAnimationFrame(this.detectFlip);
            }
        },
        created() {
            this.Id = !this.id ? 'dropdown' + cnt++ : this.id;
            this.Name = (this.name == null) ? this.Id : this.name;
        },
        mounted() {
            this.currValue = this.coerceValue(this.modelValue, this.multiselect);
            const popup = this.$refs.list;
            const anchor = this.$refs.dropdown;

            let lastTop = null;
            requestAnimationFrame(this.detectFlip);
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
            text-align: left;
            border: 1px solid #ccc;
            border-radius: 0 0 9px 9px;
            max-height: min(320px, 50vh);
            overflow-y: auto;
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

    @supports(position-anchor: --anchor) {
        .cui-dropdown dialog.dropdown-list {
            position: fixed;
            top: anchor(bottom);
            left: anchor(left);
            width: anchor-size(width);
            position-try-fallbacks: flip-block;
        }
    }

    .cui-dropdown dialog.dropdown-list.anchored-top {
        border-radius: 9px 9px 0 0;
    }

</style>