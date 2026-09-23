<!--
Copyright (c) Fast Forward, LLC. All rights reserved.
Licensed under the MIT License. See LICENSE file in the project root for full license information.
-->
<template>
    <div class="cui cui-radio-btn"
         :class="{
        checked: isChecked,
        disabled: disabled,
        readonly: readonly,
        required: required
    }"
         ref="radiobtn"
         tabindex="0"
         role="radio"
         :aria-labelledby="Id+'-label'"
         :aria-checked="isChecked"
         :aria-disabled="disabled"
         :aria-readonly="readonly"
         :aria-required="required"
         :aria-invalid="IsInvalid"
         :aria-describedby="this.Id+'_valmsg'"
         @click="onClick"
         @keydown.space.prevent="onToggle"
         @keydown.enter.prevent="onToggle"
         @focus="onFocus"
         @blur="onBlur">
        <div class="radio-btn">
            <span class="symbols radio-btn-icon"></span>
            <label v-show="label" :id="Id+'-label'" class="radio-btn-label">{{ label }}</label>
        </div>
        <input type="hidden"
               :id="Id"
               :name="Name"
               :value="checkedValue"
               :checked="isChecked"
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
            modelValue: null,
            disabled: { type: Boolean, default: false },
            readonly: { type: Boolean, default: false },
            required: { type: Boolean, default: false },
            value: { default: true },
            uncheckedValue: null,
            modelModifiers: { type: Object, default: () => ({}) },
        },
        data() {
            return {
                Id: this.id || `chkbox${++idCount}`,
                Name: null,
                internalValue: this.modelValue,
                __uncheckedValue: this.uncheckedValue,
                valTrigger: 0,
                lastEmittedValue: null,
            };
        },
        computed: {
            isChecked() {
                if (this.internalValue == null) return false;
                return this.value == this.internalValue;
            },
            checkedValue() {
                return this.value;
            },
        },
        watch: {
            modelValue(newVal) {
                if (newVal != this.internalValue) {
                    this.internalValue = newVal;
                    this.emitValue(this.internalValue);
                }
            },
            value: {
                handler(newVal) {
                    if (this.uncheckedValue == null) {
                        if (newVal === true || newVal === false) this.__uncheckedValue = !newVal;
                        else this.__uncheckedValue = null;
                    }
                },
                immediate: true
            },
        },
        methods: {
            onToggle(e) {
                if (this.disabled || this.readonly) return;
                let newValue;
                if (this.isChecked) {
                    newValue = this.__uncheckedValue;
                } else {
                    newValue = this.value;
                }
                this.internalValue = newValue;
                if (!this.modelModifiers.lazy) {
                    this.emitValue(this.internalValue);
                }
            },
            onClick(e) {
                if (this.disabled || this.readonly) return;
                this.onToggle(e);
            },
            onFocus(e) {
                this.$emit("focus", e);
            },
            onBlur(e) {
                this.emitValue(this.internalValue);

            },
            emitValue(val) {
                if (this.disabled || this.readonly) return;
                this.$emit("update:model-value", val);
                this.$emit("input", val);
                this.$emit("change", val);
                this.lastEmittedValue = val;
                this.$nextTick(() => this.valTrigger++);
            },
        },
        created() {
            this.Name = this.name ?? this.Id;
        },
        mounted() {
            if (document.readyState === 'loading') {
                if (!cbNamesHandler) document.addEventListener('DOMContentLoaded', GetCBNames);
            }
            else if (!cbNamesHandler) GetCBNames()

        }
    };

    let idCount = 0;
    let cbNames = {};
    let cbNamesHandler = false;

    function GetCBNames() {
        if (cbNamesHandler) return;
        cbNamesHandler = true;
        let allCbNames = document.querySelectorAll('.cui-radio-btn[role=radio] input[type=radio]');
        if (!allCbNames?.length) return;
        cbNames = {}
        allCbNames.forEach((cb) => {
            if (!cb.name) return;
            cbNames[cb.name] = cbNames[cb.name] == null ? 1 : cbNames[cb.name] += 1;
        });
        cbNamesHandler = false;
    }
</script>
<style>
    .cui-radio-btn .radio-btn-icon::before {
        content: "\e836";
    }

    .cui-radio-btn.checked .radio-btn-icon::before {
        content: "\e837";
    }

    .cui-radio-btn .radio-btn {
        display: flex;
        align-items: center;
        flex-direction: row;
    }

    .cui-radio-btn .radio-btn-icon {
        margin-right: 0.5rem;
        display: flex;
        align-items: center;
    }

    .cui-radio-btn .radio-btn-label {
        display: flex;
        align-items: center;
    }
</style>