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

    it('serializes the selected value as JSON into the hidden input', async () => {
        const wrapper = mount(CuiListbox, {
            props: { listItems: items, valueField: 'id', textField: 'name', modelValue: 2 }
        });
        await wrapper.vm.$nextTick();
        await wrapper.vm.$nextTick();
        expect(wrapper.find('input[type=hidden]').element.value).toBe('2');
    });

    it('multiselect: ctrl+click toggles values in an array', async () => {
        const wrapper = mount(CuiListbox, {
            props: { listItems: items, valueField: 'id', textField: 'name', modelValue: [1], multiselect: true }
        });
        const options = wrapper.findAll('[role=option]');
        await options[1].trigger('click', { ctrlKey: true }); // add id 2
        expect(wrapper.emitted('update:model-value').at(-1)).toEqual([[1, 2]]);
    });

    it('multiselect: ctrl+click on a selected option removes it', async () => {
        const wrapper = mount(CuiListbox, {
            props: { listItems: items, valueField: 'id', textField: 'name', modelValue: [1, 2], multiselect: true }
        });
        const options = wrapper.findAll('[role=option]');
        await options[0].trigger('click', { ctrlKey: true }); // remove id 1
        expect(wrapper.emitted('update:model-value').at(-1)).toEqual([[2]]);
    });

    it('multiselect: plain click selects only the clicked item', async () => {
        const wrapper = mount(CuiListbox, {
            props: { listItems: items, valueField: 'id', textField: 'name', modelValue: [1, 2], multiselect: true }
        });
        const options = wrapper.findAll('[role=option]');
        await options[2].trigger('click');
        expect(wrapper.emitted('update:model-value').at(-1)).toEqual([[3]]);
    });

    it('multiselect: shift+click selects a range from the last selected item', async () => {
        const wrapper = mount(CuiListbox, {
            props: { listItems: items, valueField: 'id', textField: 'name', modelValue: [], multiselect: true }
        });
        const options = wrapper.findAll('[role=option]');
        await options[0].trigger('click'); // select id 1, lastSelectedIdx=0
        await options[2].trigger('click', { shiftKey: true }); // range 0..2
        expect(wrapper.emitted('update:model-value').at(-1)).toEqual([[1, 2, 3]]);
    });

    it('converts a single value to a one-item array when multiselect becomes true', async () => {
        const wrapper = mount(CuiListbox, {
            props: { listItems: items, valueField: 'id', textField: 'name', modelValue: 2, multiselect: false }
        });
        await wrapper.setProps({ multiselect: true });
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('update:model-value').at(-1)).toEqual([[2]]);
    });

    it('converts a non-empty array to its first value when multiselect becomes false', async () => {
        const wrapper = mount(CuiListbox, {
            props: { listItems: items, valueField: 'id', textField: 'name', modelValue: [2, 3], multiselect: true }
        });
        await wrapper.setProps({ multiselect: false });
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('update:model-value').at(-1)).toEqual([2]);
    });

    it('sets aria-multiselectable on the listbox when multiselect is enabled', () => {
        const wrapper = mount(CuiListbox, {
            props: { listItems: items, valueField: 'id', textField: 'name', multiselect: true }
        });
        expect(wrapper.find('[role=listbox]').attributes('aria-multiselectable')).toBe('true');
    });
});
