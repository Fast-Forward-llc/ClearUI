<!--
Copyright (c) Fast Forward, LLC. All rights reserved.
Licensed under the MIT License. See LICENSE file in the project root for full license information.
-->
<template>
    <div ref="component" class="cui-radio-grp-component" :class="{disabled: disabled, readonly: readonly, required: required}" v-on:focusout="onFocusOut">
        <fieldset class="cui-radio-grp">
            <legend>{{label}}</legend>
            <div ref="radiobtnlist" class="radio-list">
                <div v-for="(i,idx) in listItems"
                     class="cui cui-radio-btn"
                     :class="{checked: isChecked(i)}"
                     :tabindex="isFocusable(i,idx) ? 0 : -1"
                     role="radio"
                     :aria-labelledby="Id+'-label'+idx"
                     :aria-checked="isChecked(i)"
                     :aria-disabled="disabled"
                     :aria-required="required"
                     :aria-invalid="IsInvalid && isFocusable(i,idx)"
                     :aria-describedby="IsInvalid && isFocused(i,idx) ? this.Id+'_valmsg' : ''"
                     v-on:click="(e)=>onClick(idx,i,e)"
                     v-on:keydown="(e)=>onKeydown(idx,i,e)">

                    <div class="radio-btn">
                        <span class="symbols radio-btn-icon"></span>
                        <label v-show="listItemText(i)" :id="Id+'-label'+idx" class="radio-btn-label">{{listItemText(i)}}</label>
                    </div>
                </div>
            </div>
        </fieldset>
        <input type="hidden"
               :id="Id"
               :name="Name"
               :value="internalValue"
               :checked="isChecked"
               ref="hiddenInput" />
        <div class="errors" role="status" :id="this.Id+'_valmsg'">
            <slot name="errors"
                  :id="Id"
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
            allowUnselect: { type: Boolean, default: false },
            modelValue: null,
            disabled: { type: Boolean, default: false },
            readonly: { type: Boolean, default: false },
            required: { type: Boolean, default: false },
            uncheckedValue: null,
            modelModifiers: { type: Object, default: () => ({}) },
        },
        data() {
            return {
                Id: this.id || `radiogrp${++idCount}`,
                Name: null,
                internalValue: this.modelValue,
                valTrigger: 0,
                lastEmittedValue: null,
            };
        },
        computed: {
        },
        watch: {
            modelValue(newVal) {
                if (newVal != this.internalValue) {
                    this.internalValue = newVal;
                    this.emitValue(this.internalValue);
                }
            },
        },
        methods: {
            isChecked(i) {
                return this.listItemValue(i) === this.internalValue;
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
            onToggle(val, idx) {
                if (this.disabled || this.readonly) return;
                if (this.internalValue == val && this.allowUnselect) this.internalValue = this.uncheckedValue;
                else this.internalValue = val;

                if (!this.modelModifiers.lazy) {
                    this.emitValue(this.internalValue);
                }
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
                let container = this.$refs.radiobtnlist;
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

        },
    };

    let idCount = 0;

</script>
<style>
    .horizontal .cui-radio-grp .radio-list {
        display: flex;
        justify-content: flex-start;
        flex-direction: row;
        flex-wrap: wrap;
    }
    .horizontal .cui-radio-grp .radio-list > [role=radio] {
        padding-right: 0.5rem;
    }
    .horizontal .cui-radio-grp .radio-list > [role=radio]:not(:last-child) {
        margin-right: 1rem;
    }
</style>