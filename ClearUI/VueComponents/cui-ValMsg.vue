<!--
Copyright (c) Fast Forward, LLC. All rights reserved.
Licensed under the MIT License. See LICENSE file in the project root for full license information.
-->
<template>
    <span class="cui cui-val-msg" ref="msg" :id="Id" :msgId="MsgId" :expr="expr" :disabled="disabled" v-show="showMsg">{{msg}}</span>
</template>
<script>
    import { ValError } from '../js/ValError.js';
    import ErrorList from '../js/ErrorList.js';
    export default {
        emits: ['update:modelValue', 'error', 'clear-error'],
        props: {
            id: { type: String },
            msgId: { type: String },
            ctrlId: { type: String },
            errorEventSelector: { type: String },
            expr: { type: Boolean },
            msg: { type: String },
            inline: { type: Boolean, default: null },
            priority: { type: Number, default: 1 },
            triggerOn: null,
            disabled: { type: Boolean, default: false },
            clearOnDisable: { type: Boolean, default: true },
            clearOn: null,
        },
        data() {
            return {
                Id: null,
                //Inline: (this.inline ?? !this.CtrlId),
                MsgId: null,
                showMsg: false,
                prevExpr: null,
                errorList: new ErrorList(),
            };
        },
        methods: {
            evalError() {
                if (this.disabled) return;
                if (this.prevExpr == this.expr) return;
                this.showMsg = !this.expr && this.inline;
                if (!this.expr) {
                    this.dispatchErrorEvent(this.errorList.dispatchSetErrorEvent, this.msg);
                    this.emit('error', this.msg);
                } else {
                    this.dispatchErrorEvent(this.errorList.dispatchClearErrorEvent, this.msg);
                    this.emit('error', null);
                    this.emit('clear-error', this.msg);
                }
                this.prevExpr = this.expr;
            },
            emit(eventName, msg) {
                this.$emit(eventName, new ValError(msg, this.priority, this.MsgId, this.CtrlId ?? this.Id));
            },
            dispatchErrorEvent(dispatchFn, msg) {
                let ctrl = (this.CtrlId) ? document.getElementById(this.CtrlId) : null;
                    
                if (ctrl) { dispatchFn.call(this.errorList, ctrl, new ValError(msg, this.priority, this.MsgId, this.CtrlId),this.$parent);
                } else {
                    dispatchFn.call(this.errorList, this.$refs.msg, new ValError(msg, this.priority, this.MsgId, this.MsgId));
                }
                if (this.errorEventSelector) {
                    let nodes = document.querySelectorAll(this.errorEventSelector);
                    if (nodes && nodes.length > 0)
                        nodes.forEach(node => {
                            dispatchFn.call(this.errorList, node, new ValError(msg, this.priority, this.MsgId, this.CtrlId), this.$parent);
                        });
                }
            },
            clear() {
                this.prevExpr = null;
                this.showMsg = false;
                this.$nextTick(() => {
                    this.dispatchErrorEvent(this.errorList.dispatchClearErrorEvent, this.msg);
                    this.emit('error', null);
                    this.emit('clear-error', this.msg);
                });
            }
        },
        watch: {
            triggerOn(newVal) {
                if (this.disabled) return;
                if (this.prevTrigger == newVal) return;
                this.prevTrigger = newVal;
                this.$nextTick(this.evalError);
            },
            disabled(newVal) {
                if (newVal && this.clearOnDisable) this.clear();
            },
            clearOn(newVal) {
                if (newVal) this.clear();
            },
            ctrlId: {
                handler(newVal) {
                    this.CtrlId = this.ctrlId;
                },
                immediate: true
            }
        },
        created() {
            this.Id = this.id ? this.id : 'valmsg' + (cnt++).toString().padStart(3, '0');
            this.MsgId = this.msgId ? this.msgId : this.Id;
        },
        mounted() {
            if (this.CtrlId == null && this.$parent.Id != null) this.CtrlId = this.$parent.Id;
        }
    };
    let cnt = 0;
</script>