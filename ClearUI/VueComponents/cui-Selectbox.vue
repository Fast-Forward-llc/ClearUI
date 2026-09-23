<!--
Copyright (c) Fast Forward, LLC. All rights reserved.
Licensed under the MIT License. See LICENSE file in the project root for full license information.
-->
<template>
    <div ref="component" class="cui cui-dropdown" v-bind:class="{disabled:disabled, readonly:readonly}">
        <label :for="Id" v-if="this.label">{{ label }}</label>
        <div ref="container" class="dropdown-container">
            <select :id="Id" :name="Name" v-model="selectedValue" class="dropdown"
                    :placeholder="placeholder" autocomplete="false"
                    :aria-invalid="IsInvalid"
                    v-on:blur="onBlur"
                    v-on:focus="onFocus">
                <template v-for="option in internalList">
                    <optgroup v-if="isGroupItem(option)" :value="listItemValue(option)"
                              :aria-selected="isSelected(option)"
                              :class="{selected:isSelected(option), 'option-group':isGroupItem(option)}"
                              :label="listItemText(option)">
                        <option v-for="sub in option.subItems"
                                :value="listItemValue(sub)"
                                :class="{selected:isSelected(sub), 'option-group':isGroupItem(sub)}">
                            {{listItemText(sub)}}
                        </option>
                    </optgroup>
                    <option v-else :value="listItemValue(option)"
                            :aria-selected="isSelected(option)"
                            :class="{selected:isSelected(option), 'option-group':isGroupItem(option)}">
                        {{listItemText(option)}}
                    </option>
                </template>
            </select>
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
                    this.setValue(i);
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
                this.currValue = val;
                this.currItem = this.itemFromValue(val);
                if (!this.modelModifiers || !this.modelModifiers?.lazy || forceEmit) {
                    this.$emit('update:model-value', val);
                    //if (e && e.target) e.target.value = this.currValue;
                    //this.$emit('input', e);
                    if (this.origValue != this.currValue) this.$emit('change', e);
                    this.lastEmittedValue = this.selectedValue;
                    this.lastEmittedItem = this.selectedItem;
                    this.$nextTick(() => this.valTrigger++);
                }
            },
            onBlur(e) {
                this.open = false;
                this.setValue(this.currValue, e, true);
                this.$emit('blur', e)
            },
            onFocus(e) {
                if (!this.modelValue === undefined)
                    this.origValue = this.modelValue;
                //if (e && e.target) e.target.value = this.selectedValue;
                this.$emit('focus', e);
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
