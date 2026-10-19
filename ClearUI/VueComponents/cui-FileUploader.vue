<!--
Copyright (c) Fast Forward, LLC. All rights reserved.
Licensed under the MIT License. See LICENSE file in the project root for full license information.
-->
<template>
    <div :id="`${(id ?? 'fileUploader'+cnt++)}-component`" class="cui-file-uploader" :class="`${name}-uploader`">
        <input :id="id" ref="uploadInput" type="file" :name="name" v-on:change="selectFiles" v-bind="$attrs"/>
        <slot :isActive="isActive" :reset="reset_fn" :error="error" :files="files" :progress="progress" :cancel="cancel_fn"></slot>
    </div>
</template>
<script>
    import { HttpRequestBase } from '../js/HttpRequestBase.js'
    export default {
        emits: ['update:model-value', 'update:reset', 'update:is-active', 'response', 'error', 'begin-request', 'end-request', 'change', 'progress', 'chunk-uploaded', 'file-uploaded', 'file-error', 'cancel'],
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
            chunkSize: { type: Number, default: null },
            chunkRetries: { type: Number, default: 3 },
            fileConcurrency: { type: Number, default: 1 },
            continueOnError: { type: Boolean, default: false },
        },
        data() {
            return {
                fileBlob: null,
                isActive: false,
                error: null,
                files: null,
                progress: 0,
                abortController: null,
            };
        },
        methods: {
            cancel_fn() {
                if (this.abortController) this.abortController.abort();
                this.$emit('cancel');
            },
            reset_fn() {
                if (this.abortController) this.abortController.abort();
                this.progress = 0;
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
                if (this.chunking) {
                    this.uploadFilesChunked();
                    return;
                }
                if (this.fileConcurrency >= 1) {
                    this.uploadFilesIndividually();
                    return;
                }
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
                    let headers = { ...(this.headers ?? {}) };
                    if (!headers['X-Requested-With']) headers['X-Requested-With'] = 'fetch';
                    if (!headers['Authorization'] && token) headers['Authorization'] = token;

                    fetch(url, {
                        method: 'POST',
                        headers: headers,
                        body: formData,
                        credentials: this.credentials ?? 'same-origin',
                    })
                        .then(async response => {
                            if (!response.ok) {
                                let respContentType = response.headers.get('Content-Type') || '';
                                let respBody = (respContentType && respContentType.includes('/json')) ? JSON.stringify(await response.json()) : await response.text();
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
            async uploadFilesIndividually() {
                this.abortController = new AbortController();
                const signal = this.abortController.signal;
                this.progress = 0;
                const files = [...this.files];
                let done = 0;
                const uploadOne = async file => {
                    const data = await this.sendFile(file, signal);
                    done++;
                    this.progress = Math.round(done / files.length * 100);
                    this.$emit('progress', this.progress);
                    return data;
                };
                await this.processFiles(files, Math.floor(this.fileConcurrency), signal, uploadOne);
            },
            async processFiles(files, concurrency, signal, uploadOne) {
                const results = new Array(files.length);
                const succeeded = new Array(files.length).fill(false);
                let next = 0;
                const worker = async () => {
                    while (next < files.length && !signal.aborted) {
                        const i = next++;
                        try {
                            results[i] = await uploadOne(files[i], i);
                            succeeded[i] = true;
                            this.$emit('file-uploaded', { file: files[i], fileName: files[i].name, index: i, response: results[i] });
                        }
                        catch (err) {
                            if (signal.aborted || err.name === 'AbortError') return;
                            this.$emit('file-error', { file: files[i], fileName: files[i].name, index: i, error: err.message });
                            if (!this.continueOnError) {
                                this.error = err.message;
                                this.$emit('error', this.error);
                                this.abortController.abort();
                                return;
                            }
                        }
                    }
                };
                try {
                    const n = Math.min(files.length, Math.max(1, concurrency || 1));
                    await Promise.all(Array.from({ length: n }, worker));
                    if (signal.aborted) return;
                    const successes = results.filter((_, i) => succeeded[i]);
                    if (successes.length === 0) return;
                    const data = files.length === 1 ? successes[0] : successes;
                    this.$emit('response', data);
                    this.$emit('update:model-value', data);
                }
                finally {
                    this.endRequest();
                }
            },
            async sendFile(file, signal) {
                const formData = new FormData();
                if (this.body) this.appendBodyToFormData(formData);
                formData.append(this.name.toString().trim(), file, file.name);
                const response = await fetch(this.buildUrl(), {
                    method: 'POST',
                    headers: this.buildHeaders(),
                    body: formData,
                    credentials: this.credentials ?? 'same-origin',
                    signal: signal,
                });
                if (!response.ok) {
                    let respContentType = response.headers.get('Content-Type') || '';
                    let respBody = (respContentType && respContentType.includes('/json')) ? JSON.stringify(await response.json()) : await response.text();
                    throw new Error(`Upload of ${file.name} failed with status ${response.status}.\r\n${respBody}`);
                }
                return await response.json();
            },
            buildUrl() {
                let url = this.url;
                let qParams = HttpRequestBase.encodeQueryParams(this.qparams);
                if (qParams) url += (url.includes('?') ? '&' : '?') + qParams;
                return url;
            },
            buildHeaders() {
                let u = new URL(this.url, window.location.origin);
                let token = sessionStorage.getItem(`api-auth-token|${u.origin}`);
                let headers = { ...(this.headers ?? {}) };
                if (!headers['X-Requested-With']) headers['X-Requested-With'] = 'fetch';
                if (!headers['Authorization'] && token) headers['Authorization'] = token;
                return headers;
            },
            async uploadFilesChunked() {
                this.abortController = new AbortController();
                const signal = this.abortController.signal;
                this.progress = 0;
                const files = [...this.files];
                const size = Math.floor(this.chunkSize);
                const totals = files.map(f => Math.max(1, Math.ceil(f.size / size)));
                const totalAll = totals.reduce((a, b) => a + b, 0);
                let done = 0;
                const onChunkDone = () => {
                    done++;
                    this.progress = Math.round(done / totalAll * 100);
                    this.$emit('progress', this.progress);
                };
                const uploadOne = (file, i) => this.uploadFileInChunks(file, totals[i], size, signal, onChunkDone);
                await this.processFiles(files, Math.floor(this.fileConcurrency), signal, uploadOne);
            },
            async uploadFileInChunks(file, totalChunks, size, signal, onChunkDone) {
                const uploadId = crypto.randomUUID();
                let data = null;
                for (let index = 0; index < totalChunks; index++) {
                    let attempt = 0;
                    while (true) {
                        try {
                            data = await this.sendChunk(file, index, totalChunks, size, uploadId, signal);
                            break;
                        }
                        catch (err) {
                            if (signal.aborted || attempt >= (this.chunkRetries ?? 0)) throw err;
                            await new Promise(r => setTimeout(r, 500 * Math.pow(2, attempt)));
                            attempt++;
                        }
                    }
                    this.$emit('chunk-uploaded', { fileName: file.name, uploadId, chunkIndex: index, totalChunks, response: data });
                    onChunkDone();
                }
                return data;
            },
            async sendChunk(file, index, totalChunks, size, uploadId, signal) {
                const blob = file.slice(index * size, Math.min(file.size, (index + 1) * size), file.type);
                const formData = new FormData();
                if (this.body) this.appendBodyToFormData(formData);
                formData.append(this.name.toString().trim(), blob, file.name);
                const headers = this.buildHeaders();
                headers['X-Upload-Id'] = uploadId;
                headers['X-File-Size'] = file.size;
                headers['X-Chunk-Index'] = index;
                headers['X-Chunk-Size'] = this.chunkSize;
                headers['X-Total-Chunks'] = totalChunks;
                const response = await fetch(this.buildUrl(), {
                    method: 'POST',
                    headers: headers,
                    body: formData,
                    credentials: this.credentials ?? 'same-origin',
                    signal: signal,
                });
                if (!response.ok) {
                    let respContentType = response.headers.get('Content-Type') || '';
                    let respBody = (respContentType && respContentType.includes('/json')) ? JSON.stringify(await response.json()) : await response.text();
                    throw new Error(`Upload of chunk ${index + 1}/${totalChunks} failed with status ${response.status}.\r\n${respBody}`);
                }
                const data = await response.json();
                if (data && data.hash) {
                    const actual = await this.hashBlob(blob);
                    if (actual && actual.toLowerCase() !== String(data.hash).toLowerCase()) {
                        throw new Error(`Hash mismatch for chunk ${index + 1}/${totalChunks}.`);
                    }
                }
                return data;
            },
            async hashBlob(blob) {
                if (!crypto.subtle) return null;
                const digest = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer());
                return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
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
            chunking() {
                return this.chunkSize != null && this.chunkSize > 0;
            },
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