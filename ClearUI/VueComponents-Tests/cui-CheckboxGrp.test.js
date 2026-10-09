// Copyright (c) Fast Forward, LLC. All rights reserved.
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CuiCheckboxGrp from '../VueComponents/cui-CheckboxGrp.vue';

const items = [
    { id: 'a', name: 'Alpha' },
    { id: 'b', name: 'Beta' },
    { id: 'c', name: 'Gamma' },
];

describe('cui-checkbox-grp', () => {
    it('renders one checkbox per item', () => {
        const wrapper = mount(CuiCheckboxGrp, {
            props: { listItems: items, valueField: 'id', textField: 'name' }
        });
        expect(wrapper.findAll('[role=checkbox]').length).toBe(3);
    });

    it('marks items in the modelValue array as checked', () => {
        const wrapper = mount(CuiCheckboxGrp, {
            props: { listItems: items, valueField: 'id', textField: 'name', modelValue: ['b'] }
        });
        const checkboxes = wrapper.findAll('[role=checkbox]');
        expect(checkboxes[1].attributes('aria-checked')).toBe('true');
        expect(checkboxes[0].attributes('aria-checked')).toBe('false');
    });

    it('clicking an unchecked item adds it to the array', async () => {
        const wrapper = mount(CuiCheckboxGrp, {
            props: { listItems: items, valueField: 'id', textField: 'name', modelValue: ['a'] }
        });
        await wrapper.findAll('[role=checkbox]')[1].trigger('click');
        expect(wrapper.emitted('update:model-value').at(-1)).toEqual([['a', 'b']]);
    });

    it('clicking a checked item removes it from the array', async () => {
        const wrapper = mount(CuiCheckboxGrp, {
            props: { listItems: items, valueField: 'id', textField: 'name', modelValue: ['a', 'b'] }
        });
        await wrapper.findAll('[role=checkbox]')[0].trigger('click');
        expect(wrapper.emitted('update:model-value').at(-1)).toEqual([['b']]);
    });
});
