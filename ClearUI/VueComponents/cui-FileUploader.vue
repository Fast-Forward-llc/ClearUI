<!--
Copyright (c) Fast Forward, LLC. All rights reserved.
Licensed under the MIT License. See LICENSE file in the project root for full license information.
-->
<template>
    <div :id="`${(id ?? 'fileUploader'+cnt++)}-component`" class="cui-file-uploader" :class="`${name}-uploader`">
        <input :id="id" ref="uploadInput" type="file" :name="name" v-on:change="selectFiles" v-bind="$attrs"/>
        <slot :isActive="isActive" :reset="reset_fn" :error="error" :files="files"></slot>
    </div>
</template>
<script>
    import { HttpRequestBase } from '../js/HttpRequestBase.js'
    export default {
        emits: ['update:model-value', 'update:reset', 'update:is-active', 'response', 'error', 'begin-request', 'end-request', 'change'],
        props: {
            id: null,
            modelValue: null,
            name: { type: String, default: "file" },
            url: { type: String, required: true },
            qparams: { type: Object, default: () => ({}) },
            headers: { type: Object, default: () => ({}) },
            credentials: { type: String, default: 'same-origin' },
            body: { type: [String, Object], default: null },
            bodyFormat: { type: String, default: 'json' },
            disabled: { type: Boolean, default: false },
            triggerOn: null,
            reset: null,
        },
        data() {
            return {
                fileBlob: null,
                isActive: false,
                error: null,
                files: null,
            };
        },
        methods: {
            reset_fn() {
                this.error = null;
                this.fileBlob = null;
                this.files = null;
                this.isActive = false;
                this.$refs.uploadInput.value = null;
                this.$emit('update:reset', false);
                this.$emit('error', null);
            },
            selectFiles(e) {
                if (this.disabled) return;
                this.error = null;
                const selectedFiles = e.target.files;
                if (!selectedFiles || selectedFiles.length === 0) {
                    this.error = 'No file selected.';
                    this.$emit('error', this.error);
                    return;
                }
                this.files = [...selectedFiles];
                this.$emit('change', this.files);
                if (this.triggerOn == null) this.uploadFiles();
            },
            uploadFiles() {
                if (this.disabled) return;
                if (!this.files || this.files.length === 0) {
                    this.error = 'No file selected.';
                    this.$emit('error', this.error);
                    return;
                }
                this.beginRequest();
                try {
                    let url = this.url;

                    let u = new URL(url, window.location.origin);
                    let token = sessionStorage.getItem(`api-auth-token|${u.origin}`);

                    let qParams = HttpRequestBase.encodeQueryParams(this.qparams);
                    if (qParams) url += (url.includes('?') ? '&' : '?') + qParams;

                    const formData = new FormData();
                    if (this.body) this.appendBodyToFormData(formData);

                    for (let i = 0; i < this.files.length; i++) {
                        formData.append(this.name.toString().trim(), this.files[i], this.files[i].name);
                    }
                    let headers = this.headers ?? {};
                    if (!headers['X-Requested-With']) headers['X-Requested-With'] = 'fetch';
                    if (!headers['Authorization'] && token) this.headers['Authorization'] = token;

                    fetch(this.url, {
                        method: 'POST',
                        headers: headers,
                        body: formData,
                        credentials: this.credentials ?? 'same-origin',
                    })
                        .then(async response => {
                            if (!response.ok) {
                                let respContentType = response.headers.get('Content-Type') || '';
                                let respBody = (respContentType && respContentType.includes('/json')) ? await response.json() : await response.text();
                                throw new Error(`Upload failed with status ${response.status}.\r\n${respBody}`);
                            }
                            return response.json();
                        })
                        .then(data => {
                            this.$emit('response', data);
                            this.$emit('update:model-value', data);
                        })
                        .catch(err => {
                            this.error = err.message;
                            this.$emit('error', this.error);
                        })
                        .finally(() => {
                            this.endRequest();

                        });
                }
                catch (err) {
                    this.error = err.message;
                    this.$emit('error', this.error);
                    this.endRequest();
                    return;
                }
            },
            appendBodyToFormData(formData) {
                if (this.body) {
                    if (this.bodyFormat === 'json') {
                        formData.append('data', JSON.stringify(this.body));
                    } else {
                        formData.append('data', this.body);
                    }
                }
            },
            beginRequest() {
                this.isActive = true;
                this.$emit('begin-request');
            },
            endRequest() {
                this.isActive = false;
                this.$emit('update:is-active', false);
                this.$emit('end-request');
            },
        },
        computed: {
        },
        watch: {
            triggerOn(newVal) {
                if (this.disabled) return;
                if (!newVal) return;
                this.$nextTick(() => {
                    this.uploadFiles();
                });
            },
            reset(newVal) {
                if (this.disabled) return;
                if (!newVal) return;
                this.reset_fn();
            },
        },
    };
    let cnt = 0;
</script>