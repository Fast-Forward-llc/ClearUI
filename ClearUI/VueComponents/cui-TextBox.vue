<!--
Copyright (c) Fast Forward, LLC. All rights reserved.
Licensed under the MIT License. See LICENSE file in the project root for full license information.
-->
<template>
    <div class="cui cui-textbox" v-bind:class="{'disabled':disabled,'readonly':readonly,'required':required}" ref="textbox">
        <label :for="Id" v-if="this.label">{{label}}</label>
        <div class="input-wrap">
            <input :id="Id" ref="input" v-bind="$attrs"
                   :name="Name"
                   :type="type"
                   v-model="CurrValue"
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
            <button v-if="actionBtnConfig?.icon"
                    type="button"
                    class="cui-textbox-btn"
                    :aria-label="actionBtnConfig?.label"
                    :title="actionBtnConfig?.title"
                    @click="actionBtnConfig?.onClick">
                <span class="symbols">{{actionBtnConfig?.icon}}</span>
            </button>
        </div>
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
    import { ActionBtnConfig } from '../js/ActionBtnConfig.js';
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
            value: null,
            type: null,
            required: { type: Boolean },
            placeholder: { type: String },
            modelModifiers: null,
            formatter: { type: Function, default: null },
            // Input mask: 9 = digit, a = letter, * = letter or digit, # = optional digit, ? = optional letter,
            // any other character is a literal. Precede a mask character with \ to use it as a literal (e.g. \# or \?).
            mask: { type: String, default: null },
            keyFilter: {
                type: Function,

                default: null
            },
            actionBtnConfig: { type: ActionBtnConfig },
            validateOn: null,
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
                if (this.mask && e?.target && typeof e.target.value === 'string') {
                    const el = e.target;
                    const raw = el.value;
                    const masked = this.applyMask(raw);
                    if (masked !== raw) {
                        const caret = el.selectionStart ?? raw.length;
                        const newCaret = this.applyMask(raw.slice(0, caret)).length;
                        el.value = masked;
                        if (document.activeElement === el && el.setSelectionRange) el.setSelectionRange(newCaret, newCaret);
                    }
                }
                this.$emit('input', e);
                if (e?.detail == 'ForceEmit') this.emitValue(e?.target?.value, true, e);
            },
            applyMask(raw) {
                if (!this.mask || raw == null) return raw;
                raw = raw.toString();
                const matches = {
                    '9': (c) => /[0-9]/.test(c),
                    'a': (c) => /[A-Za-z]/.test(c),
                    '*': (c) => /[A-Za-z0-9]/.test(c),
                };
                const optional = {
                    '#': matches['9'],
                    '?': matches['a'],
                };
                let out = '';
                let pending = '';
                let ri = 0;
                for (let mi = 0; mi < this.mask.length; mi++) {
                    let mc = this.mask[mi];
                    let escaped = false;
                    // A backslash makes the following mask character a literal (e.g. \# or \?).
                    if (mc === '\\' && mi + 1 < this.mask.length) {
                        mc = this.mask[++mi];
                        escaped = true;
                    }
                    const optTest = escaped ? null : optional[mc];
                    if (optTest) {
                        // Optional slot: consume the next character only if it fits, otherwise skip the slot.
                        if (ri < raw.length && optTest(raw[ri])) {
                            out += pending + raw[ri++];
                            pending = '';
                        }
                        continue;
                    }
                    const test = escaped ? null : matches[mc];
                    if (!test) {
                        // Literals are only emitted once a following character is accepted.
                        pending += mc;
                        if (raw[ri] === mc) ri++;
                        continue;
                    }
                    while (ri < raw.length && !test(raw[ri])) ri++;
                    if (ri >= raw.length) break;
                    out += pending + raw[ri++];
                    pending = '';
                }
                return out;
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
                    this.currValue = val?.toString() === '' ? null : val;
                    this.$emit('update:model-value', this.currValue);
                    this.lastEmittedValue = this.currValue;
                }
            },
            checkValidity(e, forceEmit) {
                if (!e) {
                    e = {
                        type: 'checkValidity',
                        target: this.$refs.input,
                        currentTarget: this.$refs.input,
                        stopPropagation: () => { return; },
                        preventDefault: () => { return; },
                    }
                }
                e.target.checkValidity();
                this.evalValidity(e, forceEmit);
                this.$nextTick(() => this.valTrigger++);
            },
        },
        computed: {
            CurrValue: {
                get() {
                    return this.currValue;
                },
                set(newValue) {
                    if (this.mask && typeof newValue === 'string') newValue = this.applyMask(newValue);
                    if (this.currValue == newValue || !this.currValue && !newValue) return;
                    this.currValue = newValue;
                    this.emitValue(newValue);
                }
            },
        },
        watch: {
            modelValue: {
                handler(newVal) {
                    if (newVal == null && this.initValue) return;
                    this.$nextTick(() => this.CurrValue = newVal);
                },
                immediate: true
            },
            value: {
                handler(newVal) {
                    if (newVal == null && this.initValue) return;
                    this.$nextTick(() => this.CurrValue = newVal);
                },
                immediate: true
            },
            disabled(newVal) {
                if (newVal) this.clearValErrors();
            },
            required() {
                this.checkValidity(null, true);
            },
            validateOn(newVal) {
                if (this.readonly || this.disabled) return;
                if (newVal) this.checkValidity();
            }
        },
        created() {
            this.initValue = false;
            this.Id = !this.id ? 'txtbox' + cnt++ : this.id;
            this.Name = (this.name == null) ? this.Id : this.name;
        },
    };
    let cnt = 0;
</script>
<style>
    .cui-textbox .input-wrap {
        display: flex;
    }

    .cui-textbox-btn,
    .cui-textbox-icon-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.25rem;
        border: var(--ctrl-borders);
        background: var(--color-ctrl-background);
        color: var(--color-text);
        cursor: pointer;
    }
</style>