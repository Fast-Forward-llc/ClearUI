// Copyright (c) Fast Forward, LLC. All rights reserved.
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CuiRadioBtnGrp from '../VueComponents/cui-RadioBtnGrp.vue';

const items = [
    { id: 'a', name: 'Alpha' },
    { id: 'b', name: 'Beta' },
];

describe('cui-radio-btn-grp', () => {
    it('renders one radio button per item', () => {
        const wrapper = mount(CuiRadioBtnGrp, {
            props: { listItems: items, valueField: 'id', textField: 'name' }
        });
        expect(wrapper.findAll('[role=radio]').length).toBe(2);
    });

    it('marks the item matching modelValue as checked', () => {
        const wrapper = mount(CuiRadioBtnGrp, {
            props: { listItems: items, valueField: 'id', textField: 'name', modelValue: 'b' }
        });
        const radios = wrapper.findAll('[role=radio]');
        expect(radios[1].attributes('aria-checked')).toBe('true');
        expect(radios[0].attributes('aria-checked')).toBe('false');
    });

    it('clicking an item emits its value', async () => {
        const wrapper = mount(CuiRadioBtnGrp, {
            props: { listItems: items, valueField: 'id', textField: 'name', modelValue: null }
        });
        await wrapper.findAll('[role=radio]')[0].trigger('click');
        expect(wrapper.emitted('update:model-value').at(-1)).toEqual(['a']);
    });

    it('allows unselecting the current item when allowUnselect is true', async () => {
        const wrapper = mount(CuiRadioBtnGrp, {
            props: { listItems: items, valueField: 'id', textField: 'name', modelValue: 'a', allowUnselect: true, uncheckedValue: null }
        });
        await wrapper.findAll('[role=radio]')[0].trigger('click');
        expect(wrapper.emitted('update:model-value').at(-1)).toEqual([null]);
    });
});
