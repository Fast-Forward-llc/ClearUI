// Copyright (c) Fast Forward, LLC. All rights reserved.
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CuiTextArea from '../VueComponents/cui-TextArea.vue';

describe('cui-textarea', () => {
    it('renders the label and initial modelValue', async () => {
        const wrapper = mount(CuiTextArea, {
            props: { label: 'Comments', modelValue: 'hi there' }
        });
        await wrapper.vm.$nextTick();
        expect(wrapper.find('label').text()).toBe('Comments');
        expect(wrapper.find('textarea').element.value).toBe('hi there');
    });

    it('emits update:model-value on blur', async () => {
        const wrapper = mount(CuiTextArea, {
            props: { modelValue: '' }
        });
        await wrapper.vm.$nextTick();
        const textarea = wrapper.find('textarea');
        await textarea.setValue('new content');
        await textarea.trigger('blur');
        expect(wrapper.emitted('update:model-value').at(-1)).toEqual(['new content']);
    });

    it('shows a character count when maxlength is set', () => {
        const wrapper = mount(CuiTextArea, {
            props: { modelValue: 'abc', maxlength: 10 }
        });
        expect(wrapper.text()).toContain('Characters remaining');
    });
});
