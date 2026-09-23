<!--
Copyright (c) Fast Forward, LLC. All rights reserved.
Licensed under the MIT License. See LICENSE file in the project root for full license information.
-->
<template>
    <div ref="component" class="cui-checkbox-grp-component" :class="{disabled: disabled, readonly: readonly, required: required}" v-on:focusout="onFocusOut">
        <fieldset class="cui-checkbox-grp">
            <legend>{{label}}</legend>
            <div ref="checkboxlist" class="checkbox-list">
                <div v-for="(i,idx) in listItems"
                     class="cui cui-checkbox"
                     :class="{checked: isChecked(i)}"
                     :tabindex="isFocusable(i,idx) ? 0 : -1"
                     role="checkbox"
                     :aria-labelledby="Id+'-label'+idx"
                     :aria-checked="isChecked(i)"
                     :aria-disabled="disabled"
                     :aria-readonly="readonly"
                     :aria-required="required"
                     :aria-invalid="IsInvalid && isFocusable(i,idx)"
                     :aria-describedby="IsInvalid && isFocused(i,idx) ? this.Id+'_valmsg' : ''"
                     v-on:click="(e)=>onClick(idx,i,e)"
                     v-on:keydown="(e)=>onKeydown(idx,i,e)">
                    <div class="checkbox">
                        <span v-if="isCheckbox" class="symbols checkbox-icon"></span>
                        <div v-if="isSwitch" class="switch">
                            <div class="switch-track"></div>
                            <div class="switch-thumb"></div>
                        </div>
                        <span v-if="label" :id="Id+'-label'" class="label checkbox-label">{{ listItemText(i) }}</span>
                    </div>
                </div>
            </div>
        </fieldset>
        <input type="hidden"
               :id="Id"
               :name="Name"
               :value="internalValue"
               ref="hiddenInput" />
        <div class="errors" role="status" :id="this.Id+'_valmsg'">
            <slot name="errors" :id="Id"
                  :value="lastEmittedValue"
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
        emits: [
            "update:model-value",
            "change",
            "focus",
            "blur",
            "input",
            "error",
            "clear-error"
        ],
        props: {
            id: String,
            name: String,
            label: String,
            listItems: null,
            valueField: { type: String, default: null },
            textField: { type: String, default: null },
            modelValue: null,
            disabled: { type: Boolean, default: false },
            readonly: { type: Boolean, default: false },
            required: { type: Boolean, default: false },
            modelModifiers: { type: Object, default: () => ({}) },
        },
        data() {
            return {
                Id: this.id || `chkboxgrp${++idCount}`,
                Name: null,
                internalValue: this.modelValue,
                valTrigger: 0,
                lastEmittedValue: null,
                isCheckbox: true,
                isSwitch: false,
            };
        },
        computed: {

        },
        watch: {
            '$attrs.class': {
                handler() {
                    if (this.$refs?.component?.classList.contains('switch')) {
                        this.isCheckbox = false;
                        this.isSwitch = true;
                    } else {
                        this.isCheckbox = true;
                        this.isSwitch = false;
                    }
                },
                immediate: true
            },
            modelValue(newVal) {
                if (newVal != this.internalValue) {
                    this.internalValue = newVal;
                    this.emitValue(this.internalValue);
                }
            },
        },
        methods: {
            isChecked(i) {
                if (this.internalValue == null) return false;
                if (Array.isArray(this.internalValue))
                    return this.internalValue.includes(this.listItemValue(i));
                else return this.listItemValue(i) == this.internalValue;
                return false;
            },
            isFocusable(i, idx) {
                if (this.disabled || this.readonly) return false;
                if (this.internalValue == null) return idx === 0;
                return this.isChecked(i);
            },
            isFocused(i) {
                if (this.disabled || this.readonly) return false;
                return this.isChecked(i);
            },
            onToggle(e) {
                if (this.disabled || this.readonly) return;
                let newValue;
                this.internalValue = this.setValue(e);
                if (!this.modelModifiers.lazy) {
                    this.emitValue(this.internalValue);
                }
            },
            setValue(val) {
                if (val == null) return this.internalValue;
                let result = [];
                if (Array.isArray(this.internalValue)) { //modelvalue is already an array
                    result = [...this.internalValue];
                    if (!result.includes(val)) result.push(val);
                    else {
                        let idx = result.indexOf(val);
                        if (idx >= 0) result.splice(idx, 1);
                    }
                } else { //modelvalue is not an array yet
                    if (this.internalValue == null || this.internalValue.toString().trim() == '')
                        result = val ? [val] : [];
                    else {
                        result = [this.internalValue];
                        if (!result.includes(val)) result.push(val);
                    }
                }
                return result;
            },
            onClick(idx, i, e) {
                if (this.disabled || this.readonly) return;
                this.onToggle(this.listItemValue(i), idx);
            },
            onKeydown(idx, i, e) {
                switch (e.key) {
                    case ('Enter'):
                    case (' '):
                        e.preventDefault();
                        this.onClick(idx, i, e);
                        break;
                    case ('ArrowRight'):
                    case ('ArrowDown'): {
                        e.preventDefault();
                        let nextBtn = e.target.nextElementSibling;
                        nextBtn?.focus();
                        break;
                    }
                    case ('ArrowLeft'):
                    case ('ArrowUp'): {
                        e.preventDefault();
                        let nextBtn = e.target.previousElementSibling;
                        nextBtn?.focus();
                        break;
                    }
                }
            },
            onFocus(e) {
                this.$emit("focus", e);
            },
            onFocusOut(e) {
                let container = this.$refs.checkboxlist;
                let targetEl = e?.relatedTarget;
                if (!targetEl || !container.contains(targetEl)) {
                    const blurEvent = new Event('blur', { bubbles: true });
                    this.onBlur(blurEvent);
                }
            },
            onBlur(e) {
                this.emitValue(this.internalValue);
                this.$emit("blur", e);
            },
            emitValue(val) {
                if (this.disabled || this.readonly) return;
                this.$emit("update:model-value", val);
                this.$emit("input", val);
                this.$emit("change", val);
                this.lastEmittedValue = val;
                this.$nextTick(() => this.valTrigger++);
            },
            listItemValue(i) {
                return !this.valueField ? i : i?.[this.valueField];
            },
            listItemText(i) {
                return !this.textField ? i : i?.[this.textField];
            },
            listItemId(i) {
                return this.Id + '-' + this.listItemValue(i);
            },
        },
        created() {
            this.Name = this.name ?? this.Id;
        },
        mounted() {

            if (this.$refs?.component?.classList.contains('switch')) {
                this.isCheckbox = false;
                this.isSwitch = true;
            } else {
                this.isCheckbox = true;
                this.isSwitch = false;
            }
        },
    };

    let idCount = 0;

</script>
<style>
    .horizontal .cui-checkbox-grp .checkbox-list {
        display: flex;
        justify-content: flex-start;
        flex-direction: row;
        flex-wrap: wrap;
    }

    .horizontal .cui-checkbox-grp .checkbox-list > [role=checkbox] {
        padding-right: 0.5rem;
    }

        .horizontal .cui-checkbox-grp .checkbox-list > [role=checkbox]:not(:last-child) {
            margin-right: 1rem;
        }
</style>
