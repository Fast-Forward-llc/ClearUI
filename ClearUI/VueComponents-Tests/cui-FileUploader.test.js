// Copyright (c) Fast Forward, LLC. All rights reserved.
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CuiFileUploader from '../VueComponents/cui-FileUploader.vue';

function createFile(name = 'test.txt') {
    return new File(['hello'], name, { type: 'text/plain' });
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
});
