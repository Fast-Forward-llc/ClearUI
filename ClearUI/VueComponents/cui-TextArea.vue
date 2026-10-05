<!--
Copyright (c) Fast Forward, LLC. All rights reserved.
Licensed under the MIT License. See LICENSE file in the project root for full license information.
-->
<template>
    <div class="cui cui-textbox" v-bind:class="{'disabled':disabled,'readonly':readonly,'required':required}" ref="textbox">
        <label :for="Id" v-if="this.label">{{label}}</label>
        <textarea :id="Id" ref="input" v-bind="$attrs"
                  :name="Name"
                  v-model="CurrValue"
                  :maxlength="maxlength"
                  :placeholder="placeholder"
                  :required="required"
                  :readonly="disabled||readonly"
                  :aria-invalid="IsInvalid"
                  :aria-describedby="this.Id+'_valmsg'"
                  v-on:focus="onFocus"
                  v-on:blur="onBlur"
                  v-on:change="onChange"
                  v-on:input="onInput"
                  v-on:keyup="keyup"
                  v-on:keydown="keydown" />
        <div v-if="maxlength" class="float-end" :id="Id+'-count'">{{CharCntRemaining}} Characters remaining</div>
        <div class="errors" role="status" :id="this.Id+'_valmsg'">
            <slot name="errors" :id="Id"
                  :value="lastEmittedValue"
                  :required="required"
                  :disabled="disabled"
                  :readonly="readonly"
                  :validityInfo="validityInfo"
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
              :validityInfo="validityInfo"
              :validateTrigger="valTrigger">
        </slot>
    </div>
</template>
<script>
    import InputComponentBase from '../js/InputComponentBase.js';

    export default {
        extends: InputComponentBase,
        emits: ['update:model-value', 'blur', 'focus', 'change', 'input', 'click', 'keyup', 'keydown', 'error', 'clear-error'],
        props: {
            id: { type: String },
            label: { type: String },
            modelValue: null,
            disabled: { type: Boolean },
            readonly: { type: Boolean },
            maxlength: {default:null, type:Number},
            value: null,
            type: null,
            required: { type: Boolean },
            placeholder: { type: String },
            modelModifiers: null,
            formatter: { type: Function, default: null },
            keyFilter: { type: Function, default: null },
            validateOn: null,
        },
        setup() {
            return {
                isMounted: false,
            };
        },
        data() {
            return {
                initValue: true,
                origValue: null,
                currValue: null,
                lastEmittedValue: null,
                valTrigger: 0,
            };
        },
        methods: {
            onValidate(e) {
                this.checkValidity(e);
                this.$nextTick(() => this.valTrigger++);
            },
            onBlur(e) {
                this.emitValue(e?.target?.value, true, e);
                this.$emit('blur', e);
            },
            onFocus(e) {
                this.origValue = this.CurrValue;
                this.$emit('focus', e);
            },
            onChange(e) {
                if (this.disabled || this.readonly) return;
                if (this.currValue == e?.target.value) return;
                this.emitValue(e?.target?.value, false, e);
                if (e?.target == null) this.$emit('change', e)
                else if (this.origValue != e?.target?.value) {
                    e.target.prevValue = this.origValue;
                    this.$emit('change', e)
                }
            },
            onInput(e) {
                if (this.disabled || this.readonly) return;
                if (e) this.evalValidity(e);
                this.$emit('input', e);
                if (e?.detail == 'ForceEmit') this.emitValue(e?.target?.value, true, e);
            },
            onClick(e) {
                if (this.readonly || this.disabled) return;
                this.$emit('click', e);
            },
            formatValue(val) {
                if (this.formatter != null && typeof this.formatter === 'function') {
                    return this.formatter(val);
                }
                return val;
            },
            onkeyup(e) {
                this.$emit('keyup', e);
            },
            onkeydown(e) {
                if (this.keyFilter != null && typeof this.keyFilter === 'function')
                    if (!this.keyFilter(e)) e.preventDefault();
                this.$emit('keydown', e);
            },
            emitValue(val, forceEmit, e) {
                if (this.disabled || this.readonly) return;
                if (this.modelModifiers?.trim) val = val?.trim();
                if (this.modelModifiers?.number) {
                    val = parseFloat(val);
                    if (isNaN(val)) val = null;
                }
                if (!this.modelModifiers || !this.modelModifiers?.lazy || forceEmit) {
                    this.checkValidity(e, forceEmit);
                    this.currValue = val.toString() === '' ? null : val;
                    this.$emit('update:model-value', this.currValue);
                    this.lastEmittedValue = this.currValue;
                    this.$nextTick(() => this.valTrigger++);
                }
            },
            checkValidity(e, forceEmit) {
                if (!e) {
                    setTimeout(() => {
                        this.$refs.input.checkValidity();
                        this.$refs.input.dispatchEvent(new CustomEvent('input', { detail: 'ForceEmit' }));
                    }, 0);
                    return;
                } else this.evalValidity(e, forceEmit);  
            },
        },
        computed: {
            CurrValue: {
                get() {
                    return this.currValue;
                },
                set(newValue) {
                    if (this.currValue == newValue || (!this.currValue && !newValue)) return;
                    this.currValue = newValue;
                    this.emitValue(newValue);
                }
            },
            CharCntRemaining() {
                let charCnt = this.maxlength - (this.currValue?.length ?? 0);
                return charCnt < 0 ? 0 : charCnt;
            }
        },
        watch: {
            validateOn(newVal) {
                if (this.disabled) return;
                if (this.prevValidateTrigger == newVal) return;
                this.prevValidateTrigger = newVal;
                if (!newVal) return;
                this.onValidate();
            },
            modelValue: {
                handler(newVal) {
                    if (newVal && !this.isMounted) this.lastEmittedValue = newVal;
                    if (newVal == null && this.initValue) return;
                    this.$nextTick(() => this.CurrValue = newVal);
                },
                immediate: true
            },
            value: {
                handler(newVal) {
                    if (newVal && !this.isMounted) this.lastEmittedValue = newVal;
                    if (newVal == null && this.initValue) return;
                    this.$nextTick(() => this.CurrValue = newVal);
                },
                immediate: true
            },
            disabled(newVal) {
                if (newVal) this.clearValErrors();
            },
            required() {
                this.checkValidity(null,true);
            }
        },
        created() {
            this.initValue = false;
            this.Id = !this.id ? 'txtarea' + cnt++ : this.id;
            this.Name = (this.name == null) ? this.Id : this.name;
        },
        mounted() {
            this.isMounted = true;
            this.$refs.textbox.addEventListener('validate', this.onValidate);
        },
        beforeUnmount() {
            if (this.$refs.textbox) {
                this.$refs.textbox.removeEventListener('validate', this.onValidate);
            }
        }
    };
    let cnt = 0;
</script>