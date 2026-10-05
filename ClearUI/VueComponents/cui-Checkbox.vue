<!--
Copyright (c) Fast Forward, LLC. All rights reserved.
Licensed under the MIT License. See LICENSE file in the project root for full license information.
-->
<template>
    <div class="cui cui-checkbox"
         :class="{checked: isChecked,disabled: disabled,readonly: readonly,required: required}"
         ref="checkbox"
         :id="Id+'-ctrl'"
         tabindex="0"
         role="checkbox"
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
        <div class="checkbox">
            <span v-if="isCheckbox" class="symbols checkbox-icon"></span>
            <div v-if="isSwitch" class="switch">
                <div class="switch-track"></div>
                <div class="switch-thumb"></div>
            </div>
            <span v-if="label" :id="Id+'-label'" class="label checkbox-label">{{ label }}</span>
        </div>
        <input type="hidden"
               :id="Id"
               :name="Name"
               :value="internalValue"
               :checked="isChecked"
               ref="hiddenInput"/>
        <div class="errors" role="status" :id="this.Id+'_valmsg'">
            <slot name="errors" :id="Id"
                  :value="lastEmittedValue"
                  :checkedValue="value"
                  :uncheckedValue="__uncheckedValue"
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
              :checkedValue="value"
              :uncheckedValue="__uncheckedValue"
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
                isCheckbox: true,
                isSwitch: false,
            };
        },
        computed: {
            isChecked() {
                if (this.internalValue == null) return false;
                if (Array.isArray(this.internalValue))
                    return this.internalValue.includes(this.value);
                else return this.value == this.internalValue;
                return false;
            },
        },
        watch: {
            '$attrs.class': {
                handler() {
                    if (this.$refs?.checkbox?.classList.contains('switch')) {
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
            value: {
                handler(newVal) {
                    if (this.uncheckedValue == null) {
                        if (newVal === true || newVal === false) this.__uncheckedValue = !newVal;
                        else this.__uncheckedValue = null;
                        console.log("__uncheckedValue:" + this.__uncheckedValue);
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
                this.internalValue = this.setValue(newValue);
                if (!this.modelModifiers.lazy) {
                    this.emitValue(this.internalValue);
                }
            },
            setValue(val) {
                let result = this.__uncheckedValue;
                if (cbNames[this.Name] > 1) { //multiple checkboxes with same name exist. store values as an array.
                    if (Array.isArray(this.modelValue)) { //modelvalue is already an array
                        result = [...this.modelValue];
                        if (val) {
                            if (!result.includes(this.value)) result.push(this.value);
                        }
                        else {
                            let idx = result.indexOf(this.value);
                            if (idx >= 0) result.splice(idx, 1);
                        }
                    } else { //modelvalue is not an array yet
                        if (this.modelValue == null || this.modelValue.toString().trim() == '')
                            result = val ? [this.value] : [];
                        else {
                            result = [this.modelValue];
                            if (!result.includes(this.value)) result.push(this.value);
                        }
                    }
                } else { result = val ? this.value : this.__uncheckedValue; }
                return result;
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
            //count instances with the same name
            if (!cbNames[this.Name]) cbNames[this.Name] = 1; else cbNames[this.Name] += 1;
            if (document.readyState != 'complete') {
                if (!cbNamesHandler) document.addEventListener('DOMContentLoaded', GetCBNames);
            }
            else if (!cbNamesHandler) GetCBNames()
            if (this.$refs?.checkbox?.classList.contains('switch')) {
                this.isCheckbox = false;
                this.isSwitch = true;
            } else {
                this.isCheckbox = true;
                this.isSwitch = false;
            }
        },
        beforeUnmount() {
            if (cbNames[this.Name]) {
                let cnt = parseInt(cbNames[this.Name]);
                if (cnt > 0) cbNames[this.Name] = --cnt;
            }
        }
    };

    let idCount = 0;
    let cbNames = {};
    let cbNamesHandler = false;

    function GetCBNames() {
        if (cbNamesHandler) return;
        cbNamesHandler = true;
        let allCbNames = document.querySelectorAll('.cui-checkbox[role=checkbox] input[type=hidden]');
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
    .cui-checkbox .checkbox {
        display: flex;
        align-items: center;
    }
    .cui-checkbox .checkbox-icon::before {
        content: "\e835";
    }

    .cui-checkbox.checked .checkbox-icon::before {
        content: "\e834";
    }

    

    .cui-checkbox .switch {
        position: relative;
        width: 40px;
        height: 22px;
        /* No display: inline-block or vertical-align needed */
        cursor: pointer;
        transition: opacity 0.2s;
        flex-shrink: 0;
    }

    .cui-checkbox.disabled .switch {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .cui-checkbox .switch-track {
        background: #ccc;
        border-radius: 11px;
        width: 100%;
        height: 100%;
        transition: background 0.2s;
    }

    .cui-checkbox.checked .switch .switch-track {
        background: #4caf50;
    }

    .cui-checkbox .switch-thumb {
        position: absolute;
        top: 2px;
        left: 2px;
        width: 18px;
        height: 18px;
        background: #fff;
        border-radius: 50%;
        box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        transition: left 0.2s;
    }

    .cui-checkbox.checked .switch .switch-thumb {
        left: 20px;
    }
</style>