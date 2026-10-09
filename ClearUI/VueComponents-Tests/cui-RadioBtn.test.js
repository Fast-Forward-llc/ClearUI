// Copyright (c) Fast Forward, LLC. All rights reserved.
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CuiRadioBtn from '../VueComponents/cui-RadioBtn.vue';

describe('cui-radio-btn', () => {
    it('is checked only when modelValue matches value', () => {
        const wrapper = mount(CuiRadioBtn, {
            props: { modelValue: 'x', value: 'x' }
        });
        expect(wrapper.find('.cui-radio-btn').attributes('aria-checked')).toBe('true');
    });

    it('is not checked when modelValue does not match value', () => {
        const wrapper = mount(CuiRadioBtn, {
            props: { modelValue: 'y', value: 'x' }
        });
        expect(wrapper.find('.cui-radio-btn').attributes('aria-checked')).toBe('false');
    });

    it('emits update:model-value with the value when clicked', async () => {
        const wrapper = mount(CuiRadioBtn, {
            props: { modelValue: null, value: 'x' }
        });
        await wrapper.find('.cui-radio-btn').trigger('click');
        expect(wrapper.emitted('update:model-value').at(-1)).toEqual(['x']);
    });

    it('does not emit when disabled', async () => {
        const wrapper = mount(CuiRadioBtn, {
            props: { modelValue: null, value: 'x', disabled: true }
        });
        await wrapper.find('.cui-radio-btn').trigger('click');
        expect(wrapper.emitted('update:model-value')).toBeFalsy();
    });
});
