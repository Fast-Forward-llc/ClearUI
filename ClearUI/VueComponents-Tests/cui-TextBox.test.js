// Copyright (c) Fast Forward, LLC. All rights reserved.
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CuiTextBox from '../VueComponents/cui-TextBox.vue';

describe('cui-textbox', () => {
    it('renders the label and initial modelValue', async () => {
        const wrapper = mount(CuiTextBox, {
            props: { label: 'Name', modelValue: 'Bob' }
        });
        await wrapper.vm.$nextTick();
        expect(wrapper.find('label').text()).toBe('Name');
        expect(wrapper.find('input').element.value).toBe('Bob');
    });

    it('emits update:model-value and change on blur when value changes', async () => {
        const wrapper = mount(CuiTextBox, {
            props: { modelValue: '' }
        });
        await wrapper.vm.$nextTick();
        const input = wrapper.find('input');
        await input.setValue('hello');
        await input.trigger('blur');
        expect(wrapper.emitted('update:model-value')).toBeTruthy();
        expect(wrapper.emitted('update:model-value').at(-1)).toEqual(['hello']);
    });

    it('reflects modelValue changes from the parent', async () => {
        const wrapper = mount(CuiTextBox, {
            props: { modelValue: 'first' }
        });
        await wrapper.setProps({ modelValue: 'second' });
        await wrapper.vm.$nextTick();
        await wrapper.vm.$nextTick();
        expect(wrapper.find('input').element.value).toBe('second');
    });

    it('marks the input readonly when disabled', () => {
        const wrapper = mount(CuiTextBox, {
            props: { modelValue: '', disabled: true }
        });
        expect(wrapper.find('input').attributes('readonly')).toBeDefined();
    });

    it('does not emit when disabled', async () => {
        const wrapper = mount(CuiTextBox, {
            props: { modelValue: '', disabled: true }
        });
        const input = wrapper.find('input');
        await input.trigger('change');
        expect(wrapper.emitted('update:model-value')).toBeFalsy();
    });
});
