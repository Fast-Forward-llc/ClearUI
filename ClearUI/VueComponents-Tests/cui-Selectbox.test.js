// Copyright (c) Fast Forward, LLC. All rights reserved.
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CuiSelectbox from '../VueComponents/cui-Selectbox.vue';

const items = [
    { id: 1, name: 'One' },
    { id: 2, name: 'Two' },
];

describe('cui-selectbox', () => {
    it('renders an option per item', () => {
        const wrapper = mount(CuiSelectbox, {
            props: { listItems: items, valueField: 'id', textField: 'name' }
        });
        expect(wrapper.findAll('option').length).toBe(2);
    });

    it('selecting an option emits update:model-value', async () => {
        const wrapper = mount(CuiSelectbox, {
            props: { listItems: items, valueField: 'id', textField: 'name', modelValue: null }
        });
        const select = wrapper.find('select');
        await select.setValue('2');
        expect(wrapper.emitted('update:model-value')).toBeTruthy();
    });

    it('groups items when groupField is provided', () => {
        const grouped = [
            { id: 1, name: 'A', grp: 'G1' },
            { id: 2, name: 'B', grp: 'G1' },
        ];
        const wrapper = mount(CuiSelectbox, {
            props: { listItems: grouped, valueField: 'id', textField: 'name', groupField: 'grp' }
        });
        expect(wrapper.findAll('optgroup').length).toBe(1);
    });
});
