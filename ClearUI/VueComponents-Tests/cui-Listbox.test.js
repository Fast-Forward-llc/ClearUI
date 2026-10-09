// Copyright (c) Fast Forward, LLC. All rights reserved.
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CuiListbox from '../VueComponents/cui-Listbox.vue';

const items = [
    { id: 1, name: 'One' },
    { id: 2, name: 'Two' },
    { id: 3, name: 'Three' },
];

describe('cui-listbox', () => {
    it('renders one option per item', () => {
        const wrapper = mount(CuiListbox, {
            props: { listItems: items, valueField: 'id', textField: 'name' }
        });
        expect(wrapper.findAll('[role=option]').length).toBe(3);
    });

    it('marks the item matching modelValue as selected', async () => {
        const wrapper = mount(CuiListbox, {
            props: { listItems: items, valueField: 'id', textField: 'name', modelValue: 2 }
        });
        await wrapper.vm.$nextTick();
        await wrapper.vm.$nextTick();
        const options = wrapper.findAll('[role=option]');
        expect(options[1].attributes('aria-selected')).toBe('true');
        expect(options[0].attributes('aria-selected')).toBe('false');
    });

    it('clicking an item emits its value', async () => {
        const wrapper = mount(CuiListbox, {
            props: { listItems: items, valueField: 'id', textField: 'name', modelValue: null }
        });
        await wrapper.findAll('[role=option]')[2].trigger('click');
        expect(wrapper.emitted('update:model-value').at(-1)).toEqual([3]);
    });

    it('shows an empty message when there are no items', () => {
        const wrapper = mount(CuiListbox, {
            props: { listItems: [] }
        });
        expect(wrapper.text()).toContain('No items available');
    });
});
