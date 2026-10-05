<!--
Copyright (c) Fast Forward, LLC. All rights reserved.
Licensed under the MIT License. See LICENSE file in the project root for full license information.
-->
<template>
    <span http-request :url="url" :params="qparams" :verb="verb" :disabled="disabled"></span>
</template>
<script>
    import { HttpRequestBase } from '../js/HttpRequestBase.js'
    //const baseHttpRequest = new HttpRequestBase();
    export default {
        emits: ['update:model-value', 'update:is-active', 'received', 'error', 'begin-request', 'end-request'],
        props: {
            modelValue: null,
            url: { type: String, required: true },
            credentials: { type: String, default: 'same-origin' },
            qparams: { type: Object, default: () => ({}) },
            verb: { type: String, default: 'GET' },
            headers: { type: Object, default: () => ({}) },
            body: { type: [String, Object], default: null },
            disabled: { type: Boolean, default: false },
            triggerOn: null,
        },
        data() {
            return {
                isActive: false
            };
        },
        methods: HttpRequestBase,

        computed: {
        },
        watch: {
            triggerOnAny(newVal) {
                if (this.disabled) return;
                if (!newVal || this.triggerValue == newVal) {
                    this.triggerValue = newVal;
                    return;
                }
                this.triggerValue = newVal;
                this.$nextTick(() => {
                    this.sendRequest(this.qparams)
                });
            },
            triggerOn(newVal) {
                if (this.disabled) return;
                if (!newVal || this.triggerValue == newVal) {
                    this.triggerValue = newVal;
                    return;
                }
                this.triggerValue = newVal;
                this.$nextTick(() => {
                    this.sendRequest(this.qparams)
                });
            }
        },
        created() {
            this.triggerValue = null;
        },
        mounted() {
        }
    };
    let cnt = 0;
</script>