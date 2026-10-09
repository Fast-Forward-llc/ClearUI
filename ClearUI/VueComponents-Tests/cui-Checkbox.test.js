// Copyright (c) Fast Forward, LLC. All rights reserved.
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CuiCheckbox from '../VueComponents/cui-Checkbox.vue';

describe('cui-checkbox', () => {
    it('is unchecked when modelValue does not match value', () => {
        const wrapper = mount(CuiCheckbox, {
            props: { modelValue: false, value: true }
        });
        expect(wrapper.find('.cui-checkbox').attributes('aria-checked')).toBe('false');
    });

    it('is checked when modelValue matches value', () => {
        const wrapper = mount(CuiCheckbox, {
            props: { modelValue: true, value: true }
        });
        expect(wrapper.find('.cui-checkbox').attributes('aria-checked')).toBe('true');
    });

    it('toggles on click and emits update:model-value', async () => {
        const wrapper = mount(CuiCheckbox, {
            props: { modelValue: false, value: true, uncheckedValue: false }
        });
        await wrapper.find('.cui-checkbox').trigger('click');
        expect(wrapper.emitted('update:model-value').at(-1)).toEqual([true]);
    });

    it('toggles off when clicked again', async () => {
        const wrapper = mount(CuiCheckbox, {
            props: { modelValue: true, value: true, uncheckedValue: false }
        });
        await wrapper.find('.cui-checkbox').trigger('click');
        expect(wrapper.emitted('update:model-value').at(-1)).toEqual([false]);
    });

    it('supports array modelValue for multi-value checkbox groups', () => {
        const wrapper = mount(CuiCheckbox, {
            props: { modelValue: ['a', 'b'], value: 'a' }
        });
        expect(wrapper.find('.cui-checkbox').attributes('aria-checked')).toBe('true');
    });

    it('does not toggle when disabled', async () => {
        const wrapper = mount(CuiCheckbox, {
            props: { modelValue: false, value: true, disabled: true }
        });
        await wrapper.find('.cui-checkbox').trigger('click');
        expect(wrapper.emitted('update:model-value')).toBeFalsy();
    });
});
