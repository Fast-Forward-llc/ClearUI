// Copyright (c) Fast Forward, LLC. All rights reserved.
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import CuiFileUploader from '../VueComponents/cui-FileUploader.vue';

function createFile(name = 'test.txt', content = 'hello') {
    return new File([content], name, { type: 'text/plain' });
}

function jsonResponse(data = { ok: true }, status = 200) {
    return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

function errorResponse(status = 500) {
    return new Response('err', { status, headers: { 'Content-Type': 'text/plain' } });
}

async function selectFiles(wrapper, files) {
    const input = wrapper.find('input[type=file]');
    Object.defineProperty(input.element, 'files', { value: files, configurable: true });
    await input.trigger('change');
}

function waitForEnd(wrapper) {
    return vi.waitFor(() => expect(wrapper.emitted('end-request')).toBeTruthy(), { timeout: 4000 });
}

function headerOf(call, name) {
    return new Headers(call[1].headers).get(name);
}

describe('cui-file-uploader', () => {
    it('renders a file input', () => {
        const wrapper = mount(CuiFileUploader, {
            props: { url: '/api/upload' }
        });
        expect(wrapper.find('input[type=file]').exists()).toBe(true);
    });

    it('emits an error when no file is selected', async () => {
        const wrapper = mount(CuiFileUploader, {
            props: { url: '/api/upload', triggerOn: 1 }
        });
        const input = wrapper.find('input[type=file]');
        Object.defineProperty(input.element, 'files', { value: [], configurable: true });
        await input.trigger('change');
        expect(wrapper.emitted('error')).toBeTruthy();
        expect(wrapper.emitted('error').at(-1)).toEqual(['No file selected.']);
    });

    it('emits change with the selected files', async () => {
        const wrapper = mount(CuiFileUploader, {
            props: { url: '/api/upload', triggerOn: 1 }
        });
        const input = wrapper.find('input[type=file]');
        const file = createFile();
        Object.defineProperty(input.element, 'files', { value: [file], configurable: true });
        await input.trigger('change');
        expect(wrapper.emitted('change')).toBeTruthy();
        expect(wrapper.emitted('change').at(-1)[0]).toEqual([file]);
    });

    describe('uploads', () => {
        let fetchMock;

        beforeEach(() => {
            fetchMock = vi.fn(async () => jsonResponse());
            vi.stubGlobal('fetch', fetchMock);
            sessionStorage.clear();
        });

        afterEach(() => {
            vi.unstubAllGlobals();
            vi.restoreAllMocks();
        });

        function trackConcurrency(delay) {
            const state = { inFlight: 0, max: 0 };
            fetchMock.mockImplementation(async () => {
                state.inFlight++;
                state.max = Math.max(state.max, state.inFlight);
                await new Promise(r => setTimeout(r, delay));
                state.inFlight--;
                return jsonResponse();
            });
            return state;
        }

        describe('single request (fileConcurrency <= 0, unchunked)', () => {
            it('sends all files in one FormData request', async () => {
                const wrapper = mount(CuiFileUploader, { props: { url: '/api/upload', fileConcurrency: 0 } });
                await selectFiles(wrapper, [createFile('a.txt'), createFile('b.txt')]);
                await waitForEnd(wrapper);

                expect(fetchMock).toHaveBeenCalledTimes(1);
                const body = fetchMock.mock.calls[0][1].body;
                expect(body.getAll('file').map(f => f.name)).toEqual(['a.txt', 'b.txt']);
                expect(wrapper.emitted('response').at(-1)).toEqual([{ ok: true }]);
            });

            it('treats negative values the same as 0', async () => {
                const wrapper = mount(CuiFileUploader, { props: { url: '/api/upload', fileConcurrency: -1 } });
                await selectFiles(wrapper, [createFile('a.txt'), createFile('b.txt')]);
                await waitForEnd(wrapper);
                expect(fetchMock).toHaveBeenCalledTimes(1);
            });

            it('uses the url with query params and does not mutate the headers prop', async () => {
                sessionStorage.setItem(`api-auth-token|${window.location.origin}`, 'Bearer abc');
                const headers = { 'X-Custom': '1' };
                const wrapper = mount(CuiFileUploader, {
                    props: { url: '/api/upload', fileConcurrency: 0, qparams: { folder: 'docs' }, headers }
                });
                await selectFiles(wrapper, [createFile()]);
                await waitForEnd(wrapper);

                const call = fetchMock.mock.calls[0];
                expect(call[0]).toContain('/api/upload?');
                expect(call[0]).toContain('folder=docs');
                expect(headerOf(call, 'Authorization')).toBe('Bearer abc');
                expect(headerOf(call, 'X-Custom')).toBe('1');
                expect(headers).toEqual({ 'X-Custom': '1' });
            });

            it('emits error when the server returns a failure status', async () => {
                fetchMock.mockResolvedValue(errorResponse());
                const wrapper = mount(CuiFileUploader, { props: { url: '/api/upload', fileConcurrency: 0 } });
                await selectFiles(wrapper, [createFile()]);
                await waitForEnd(wrapper);
                expect(wrapper.emitted('error').at(-1)[0]).toContain('status 500');
                expect(wrapper.emitted('response')).toBeFalsy();
            });

            it('includes a JSON error body in the error message', async () => {
                fetchMock.mockResolvedValue(jsonResponse({ error: 'File type not allowed.' }, 400));
                const wrapper = mount(CuiFileUploader, { props: { url: '/api/upload', fileConcurrency: 0 } });
                await selectFiles(wrapper, [createFile()]);
                await waitForEnd(wrapper);
                const message = wrapper.emitted('error').at(-1)[0];
                expect(message).toContain('status 400');
                expect(message).toContain('{"error":"File type not allowed."}');
                expect(message).not.toContain('[object Object]');
            });

            it('emits error when the request itself fails (network error)', async () => {
                fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
                const wrapper = mount(CuiFileUploader, { props: { url: '/api/upload', fileConcurrency: 0 } });
                await selectFiles(wrapper, [createFile()]);
                await waitForEnd(wrapper);
                expect(wrapper.emitted('error').at(-1)).toEqual(['Failed to fetch']);
                expect(wrapper.emitted('response')).toBeFalsy();
                expect(wrapper.emitted('file-error')).toBeFalsy();
            });

            it('emits error when a successful response is not JSON', async () => {
                fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
                const wrapper = mount(CuiFileUploader, { props: { url: '/api/upload', fileConcurrency: 0 } });
                await selectFiles(wrapper, [createFile()]);
                await waitForEnd(wrapper);
                expect(wrapper.emitted('error')).toBeTruthy();
                expect(wrapper.emitted('response')).toBeFalsy();
            });
        });

        describe('one request per file (fileConcurrency >= 1, unchunked)', () => {
            it('sends one request per file', async () => {
                const wrapper = mount(CuiFileUploader, { props: { url: '/api/upload', fileConcurrency: 1 } });
                await selectFiles(wrapper, [createFile('a.txt'), createFile('b.txt'), createFile('c.txt')]);
                await waitForEnd(wrapper);

                expect(fetchMock).toHaveBeenCalledTimes(3);
                const names = fetchMock.mock.calls.map(c => c[1].body.getAll('file').map(f => f.name));
                expect(names).toEqual([['a.txt'], ['b.txt'], ['c.txt']]);
            });

            it('emits a single response for one file and an array in file order for several', async () => {
                let n = 0;
                fetchMock.mockImplementation(async () => jsonResponse({ n: ++n }));
                const wrapper = mount(CuiFileUploader, { props: { url: '/api/upload', fileConcurrency: 1 } });
                await selectFiles(wrapper, [createFile('a.txt'), createFile('b.txt')]);
                await waitForEnd(wrapper);
                expect(wrapper.emitted('response').at(-1)).toEqual([[{ n: 1 }, { n: 2 }]]);
                expect(wrapper.emitted('update:model-value').at(-1)).toEqual([[{ n: 1 }, { n: 2 }]]);

                const single = mount(CuiFileUploader, { props: { url: '/api/upload', fileConcurrency: 1 } });
                await selectFiles(single, [createFile('a.txt')]);
                await waitForEnd(single);
                expect(single.emitted('response').at(-1)).toEqual([{ n: 3 }]);
            });

            it('limits in-flight requests to fileConcurrency', async () => {
                const state = trackConcurrency(20);
                const wrapper = mount(CuiFileUploader, { props: { url: '/api/upload', fileConcurrency: 2 } });
                await selectFiles(wrapper, [1, 2, 3, 4, 5].map(i => createFile(`f${i}.txt`)));
                await waitForEnd(wrapper);

                expect(fetchMock).toHaveBeenCalledTimes(5);
                expect(state.max).toBe(2);
            });

            it('emits progress based on completed files', async () => {
                const wrapper = mount(CuiFileUploader, { props: { url: '/api/upload', fileConcurrency: 1 } });
                await selectFiles(wrapper, [createFile('a.txt'), createFile('b.txt')]);
                await waitForEnd(wrapper);
                expect(wrapper.emitted('progress').map(e => e[0])).toEqual([50, 100]);
            });

            it('continueOnError sends remaining files and emits only successful responses', async () => {
                fetchMock.mockResolvedValueOnce(jsonResponse({ n: 1 }));
                fetchMock.mockResolvedValueOnce(errorResponse());
                fetchMock.mockResolvedValueOnce(jsonResponse({ n: 3 }));
                const wrapper = mount(CuiFileUploader, { props: { url: '/api/upload', fileConcurrency: 1, continueOnError: true } });
                await selectFiles(wrapper, [createFile('a.txt'), createFile('b.txt'), createFile('c.txt')]);
                await waitForEnd(wrapper);

                expect(fetchMock).toHaveBeenCalledTimes(3);
                expect(wrapper.emitted('file-uploaded').map(e => e[0].fileName)).toEqual(['a.txt', 'c.txt']);
                const failed = wrapper.emitted('file-error').map(e => e[0]);
                expect(failed.map(f => f.fileName)).toEqual(['b.txt']);
                expect(failed[0].index).toBe(1);
                expect(wrapper.emitted('error')).toBeFalsy();
                expect(wrapper.emitted('response').at(-1)).toEqual([[{ n: 1 }, { n: 3 }]]);
            });

            it('emits file-uploaded per file and file-error before error when stopping', async () => {
                fetchMock.mockResolvedValueOnce(jsonResponse({ n: 1 }));
                fetchMock.mockResolvedValueOnce(errorResponse());
                const wrapper = mount(CuiFileUploader, { props: { url: '/api/upload', fileConcurrency: 1 } });
                await selectFiles(wrapper, [createFile('a.txt'), createFile('b.txt'), createFile('c.txt')]);
                await waitForEnd(wrapper);

                expect(wrapper.emitted('file-uploaded').map(e => e[0].response)).toEqual([{ n: 1 }]);
                expect(wrapper.emitted('file-error').map(e => e[0].fileName)).toEqual(['b.txt']);
                expect(wrapper.emitted('error')).toHaveLength(1);
            });

            it('stops and emits error when a file fails', async () => {
                fetchMock.mockResolvedValueOnce(jsonResponse());
                fetchMock.mockResolvedValueOnce(errorResponse());
                const wrapper = mount(CuiFileUploader, { props: { url: '/api/upload', fileConcurrency: 1 } });
                await selectFiles(wrapper, [createFile('a.txt'), createFile('b.txt'), createFile('c.txt')]);
                await waitForEnd(wrapper);

                expect(fetchMock).toHaveBeenCalledTimes(2);
                expect(wrapper.emitted('error').at(-1)[0]).toContain('b.txt');
                expect(wrapper.emitted('response')).toBeFalsy();
            });
        });

        describe('chunked', () => {
            it('is not used when chunkSize is null, 0 or negative', async () => {
                for (const chunkSize of [null, 0, -5]) {
                    fetchMock.mockClear();
                    const wrapper = mount(CuiFileUploader, { props: { url: '/api/upload', fileConcurrency: 0, chunkSize } });
                    await selectFiles(wrapper, [createFile('a.txt', 'abcdefghij')]);
                    await waitForEnd(wrapper);
                    expect(fetchMock).toHaveBeenCalledTimes(1);
                    expect(headerOf(fetchMock.mock.calls[0], 'X-Chunk-Index')).toBeNull();
                }
            });

            it('splits a file into chunks with the expected headers and form data', async () => {
                const wrapper = mount(CuiFileUploader, {
                    props: { url: '/api/upload', chunkSize: 4, body: { desc: 'x' }, qparams: { q: '1' }, headers: { 'X-Custom': 'y' } }
                });
                await selectFiles(wrapper, [createFile('a.txt', 'abcdefghij')]);
                await waitForEnd(wrapper);

                expect(fetchMock).toHaveBeenCalledTimes(3);
                const calls = fetchMock.mock.calls;
                expect(new Set(calls.map(c => headerOf(c, 'X-Upload-Id'))).size).toBe(1);
                expect(headerOf(calls[0], 'X-Upload-Id')).toBeTruthy();
                calls.forEach((c, i) => {
                    expect(c[0]).toContain('q=1');
                    expect(headerOf(c, 'X-Chunk-Index')).toBe(String(i));
                    expect(headerOf(c, 'X-Total-Chunks')).toBe('3');
                    expect(headerOf(c, 'X-Chunk-Size')).toBe('4');
                    expect(headerOf(c, 'X-File-Size')).toBe('10');
                    expect(headerOf(c, 'X-Custom')).toBe('y');
                    const body = c[1].body;
                    expect(body.get('data')).toBe(JSON.stringify({ desc: 'x' }));
                    ['uploadId', 'fileSize', 'fileName', 'contentType'].forEach(f => expect(body.has(f)).toBe(false));
                    expect(body.get('file').name).toBe('a.txt');
                });
                expect(calls.map(c => c[1].body.get('file').size)).toEqual([4, 4, 2]);
            });

            it('keeps the original content type on each chunk', async () => {
                const wrapper = mount(CuiFileUploader, { props: { url: '/api/upload', chunkSize: 4 } });
                await selectFiles(wrapper, [createFile('a.txt', 'abcdefghij')]);
                await waitForEnd(wrapper);
                expect(fetchMock.mock.calls[0][1].body.get('file').type).toBe('text/plain');
            });

            it('sends one chunk when the file is smaller than chunkSize', async () => {
                const wrapper = mount(CuiFileUploader, { props: { url: '/api/upload', chunkSize: 1000 } });
                await selectFiles(wrapper, [createFile('a.txt', 'abc')]);
                await waitForEnd(wrapper);
                expect(fetchMock).toHaveBeenCalledTimes(1);
                expect(headerOf(fetchMock.mock.calls[0], 'X-Total-Chunks')).toBe('1');
            });

            it('sends chunks of a file sequentially', async () => {
                const state = trackConcurrency(10);
                const wrapper = mount(CuiFileUploader, { props: { url: '/api/upload', chunkSize: 2 } });
                await selectFiles(wrapper, [createFile('a.txt', 'abcdefgh')]);
                await waitForEnd(wrapper);
                expect(fetchMock).toHaveBeenCalledTimes(4);
                expect(state.max).toBe(1);
            });

            it.each([[1, 1], [3, 3], [0, 1]])('with fileConcurrency %i uploads up to %i files at once', async (fileConcurrency, expected) => {
                const state = trackConcurrency(15);
                const wrapper = mount(CuiFileUploader, { props: { url: '/api/upload', chunkSize: 2, fileConcurrency } });
                await selectFiles(wrapper, [1, 2, 3, 4].map(i => createFile(`f${i}.txt`, 'abcd')));
                await waitForEnd(wrapper);
                expect(state.max).toBe(expected);
            });

            it('emits chunk-uploaded and progress based on chunks', async () => {
                const wrapper = mount(CuiFileUploader, { props: { url: '/api/upload', chunkSize: 4 } });
                await selectFiles(wrapper, [createFile('a.txt', 'abcdefghij')]);
                await waitForEnd(wrapper);

                const chunkEvents = wrapper.emitted('chunk-uploaded').map(e => e[0]);
                expect(chunkEvents.map(e => e.chunkIndex)).toEqual([0, 1, 2]);
                expect(chunkEvents.every(e => e.totalChunks === 3 && e.fileName === 'a.txt')).toBe(true);
                expect(wrapper.emitted('progress').map(e => e[0])).toEqual([33, 67, 100]);
            });

            it('emits the last chunk response for one file and an array for several', async () => {
                let n = 0;
                fetchMock.mockImplementation(async () => jsonResponse({ n: ++n }));
                const wrapper = mount(CuiFileUploader, { props: { url: '/api/upload', chunkSize: 4 } });
                await selectFiles(wrapper, [createFile('a.txt', 'abcdefghij')]);
                await waitForEnd(wrapper);
                expect(wrapper.emitted('response').at(-1)).toEqual([{ n: 3 }]);

                n = 0;
                const multi = mount(CuiFileUploader, { props: { url: '/api/upload', chunkSize: 10 } });
                await selectFiles(multi, [createFile('a.txt', 'abc'), createFile('b.txt', 'def')]);
                await waitForEnd(multi);
                expect(multi.emitted('response').at(-1)).toEqual([[{ n: 1 }, { n: 2 }]]);
                expect(multi.emitted('update:model-value').at(-1)).toEqual([[{ n: 1 }, { n: 2 }]]);
            });

            it('retries a failed chunk and then continues', async () => {
                fetchMock.mockResolvedValueOnce(errorResponse());
                const wrapper = mount(CuiFileUploader, { props: { url: '/api/upload', chunkSize: 4, chunkRetries: 1 } });
                await selectFiles(wrapper, [createFile('a.txt', 'abcdefgh')]);
                await waitForEnd(wrapper);

                expect(fetchMock.mock.calls.map(c => headerOf(c, 'X-Chunk-Index'))).toEqual(['0', '0', '1']);
                expect(wrapper.emitted('error')).toBeFalsy();
                expect(wrapper.emitted('response')).toBeTruthy();
            });

            it('emits error after retries are exhausted and does not send later chunks', async () => {
                fetchMock.mockImplementation(async () => errorResponse());
                const wrapper = mount(CuiFileUploader, { props: { url: '/api/upload', chunkSize: 4, chunkRetries: 0 } });
                await selectFiles(wrapper, [createFile('a.txt', 'abcdefgh')]);
                await waitForEnd(wrapper);

                expect(fetchMock).toHaveBeenCalledTimes(1);
                expect(wrapper.emitted('error').at(-1)[0]).toContain('chunk 1/2');
                expect(wrapper.emitted('response')).toBeFalsy();
            });

            it('accepts a matching chunk hash from the server', async () => {
                vi.spyOn(CuiFileUploader.methods, 'hashBlob').mockResolvedValue('ABC123');
                fetchMock.mockImplementation(async () => jsonResponse({ hash: 'abc123' }));
                const wrapper = mount(CuiFileUploader, { props: { url: '/api/upload', chunkSize: 10 } });
                await selectFiles(wrapper, [createFile('a.txt', 'abc')]);
                await waitForEnd(wrapper);
                expect(wrapper.emitted('error')).toBeFalsy();
                expect(wrapper.emitted('response')).toBeTruthy();
            });

            it('errors on a chunk hash mismatch when retries are exhausted', async () => {
                vi.spyOn(CuiFileUploader.methods, 'hashBlob').mockResolvedValue('aaaa');
                fetchMock.mockImplementation(async () => jsonResponse({ hash: 'bbbb' }));
                const wrapper = mount(CuiFileUploader, { props: { url: '/api/upload', chunkSize: 10, chunkRetries: 0 } });
                await selectFiles(wrapper, [createFile('a.txt', 'abc')]);
                await waitForEnd(wrapper);
                expect(wrapper.emitted('error').at(-1)[0]).toContain('Hash mismatch');
            });

            it('does not verify a hash when the server response has none', async () => {
                const hashSpy = vi.spyOn(CuiFileUploader.methods, 'hashBlob').mockResolvedValue('zzz');
                const wrapper = mount(CuiFileUploader, { props: { url: '/api/upload', chunkSize: 10 } });
                await selectFiles(wrapper, [createFile('a.txt', 'abc')]);
                await waitForEnd(wrapper);
                expect(hashSpy).not.toHaveBeenCalled();
                expect(wrapper.emitted('error')).toBeFalsy();
            });

            it('cancel aborts the upload without emitting an error', async () => {
                fetchMock.mockImplementation((url, init) => new Promise((resolve, reject) => {
                    init.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
                }));
                const wrapper = mount(CuiFileUploader, { props: { url: '/api/upload', chunkSize: 4 } });
                await selectFiles(wrapper, [createFile('a.txt', 'abcdefgh')]);
                await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled());
                wrapper.vm.cancel_fn();
                await waitForEnd(wrapper);

                expect(wrapper.emitted('cancel')).toBeTruthy();
                expect(wrapper.emitted('error')).toBeFalsy();
                expect(wrapper.emitted('response')).toBeFalsy();
                expect(fetchMock).toHaveBeenCalledTimes(1);
            });

            it('stops all files when one fails by default and emits file-error', async () => {
                fetchMock.mockImplementation(async (url, init) => {
                    const name = init.body.get('file').name;
                    return name === 'b.txt' ? errorResponse() : jsonResponse({ name });
                });
                const wrapper = mount(CuiFileUploader, { props: { url: '/api/upload', chunkSize: 10, chunkRetries: 0 } });
                await selectFiles(wrapper, [createFile('a.txt', 'abc'), createFile('b.txt', 'def'), createFile('c.txt', 'ghi')]);
                await waitForEnd(wrapper);

                expect(wrapper.emitted('file-error').map(e => e[0].fileName)).toEqual(['b.txt']);
                expect(wrapper.emitted('error')).toHaveLength(1);
                expect(wrapper.emitted('response')).toBeFalsy();
                expect(fetchMock).toHaveBeenCalledTimes(2);
            });

            it('continueOnError uploads remaining files and emits only successful responses', async () => {
                fetchMock.mockImplementation(async (url, init) => {
                    const name = init.body.get('file').name;
                    return name === 'b.txt' ? errorResponse() : jsonResponse({ name });
                });
                const wrapper = mount(CuiFileUploader, {
                    props: { url: '/api/upload', chunkSize: 10, chunkRetries: 0, continueOnError: true }
                });
                await selectFiles(wrapper, [createFile('a.txt', 'abc'), createFile('b.txt', 'def'), createFile('c.txt', 'ghi')]);
                await waitForEnd(wrapper);

                expect(fetchMock).toHaveBeenCalledTimes(3);
                expect(wrapper.emitted('file-uploaded').map(e => e[0].fileName)).toEqual(['a.txt', 'c.txt']);
                const failed = wrapper.emitted('file-error').map(e => e[0]);
                expect(failed.map(f => f.fileName)).toEqual(['b.txt']);
                expect(failed[0].error).toContain('status 500');
                expect(wrapper.emitted('error')).toBeFalsy();
                expect(wrapper.emitted('response').at(-1)).toEqual([[{ name: 'a.txt' }, { name: 'c.txt' }]]);
                expect(wrapper.emitted('update:model-value').at(-1)).toEqual([[{ name: 'a.txt' }, { name: 'c.txt' }]]);
            });

            it('continueOnError emits no response when every file fails', async () => {
                fetchMock.mockImplementation(async () => errorResponse());
                const wrapper = mount(CuiFileUploader, {
                    props: { url: '/api/upload', chunkSize: 10, chunkRetries: 0, continueOnError: true }
                });
                await selectFiles(wrapper, [createFile('a.txt', 'abc'), createFile('b.txt', 'def')]);
                await waitForEnd(wrapper);
                expect(wrapper.emitted('file-error')).toHaveLength(2);
                expect(wrapper.emitted('response')).toBeFalsy();
                expect(wrapper.emitted('error')).toBeFalsy();
            });

            it('emits file-uploaded with the final chunk response', async () => {
                fetchMock.mockImplementation(async () => jsonResponse({ done: true }));
                const wrapper = mount(CuiFileUploader, { props: { url: '/api/upload', chunkSize: 4 } });
                await selectFiles(wrapper, [createFile('a.txt', 'abcdefghij')]);
                await waitForEnd(wrapper);
                const e = wrapper.emitted('file-uploaded').map(x => x[0]);
                expect(e).toHaveLength(1);
                expect(e[0]).toMatchObject({ fileName: 'a.txt', index: 0, response: { done: true } });
            });

            it('waits for triggerOn before uploading', async () => {
                const wrapper = mount(CuiFileUploader, { props: { url: '/api/upload', chunkSize: 4, triggerOn: 0 } });
                await selectFiles(wrapper, [createFile('a.txt', 'abcdefgh')]);
                expect(fetchMock).not.toHaveBeenCalled();
                await wrapper.setProps({ triggerOn: 1 });
                await waitForEnd(wrapper);
                expect(fetchMock).toHaveBeenCalledTimes(2);
            });
        });
    });
});
