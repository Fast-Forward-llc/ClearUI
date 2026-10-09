// Copyright (c) Fast Forward, LLC. All rights reserved.
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CuiDropdown from '../VueComponents/cui-Dropdown.vue';

const items = [
    { id: 1, name: 'One' },
    { id: 2, name: 'Two' },
    { id: 3, name: 'Three' },
];

describe('cui-dropdown', () => {
    it('renders selected text based on modelValue', async () => {
        const wrapper = mount(CuiDropdown, {
            props: { listItems: items, valueField: 'id', textField: 'name', modelValue: 2 }
        });
        await wrapper.vm.$nextTick();
        await wrapper.vm.$nextTick();
        expect(wrapper.find('input').element.value).toBe('Two');
    });

    it('selecting an option emits update:model-value with the resolved value', async () => {
        const wrapper = mount(CuiDropdown, {
            props: { listItems: items, valueField: 'id', textField: 'name', modelValue: null }
        });
        const options = wrapper.findAll('[role=option]');
        expect(options.length).toBe(3);
        await options[1].trigger('click');
        expect(wrapper.emitted('update:model-value').at(-1)).toEqual([2]);
    });

    it('supports multiselect: toggles values in an array', async () => {
        const wrapper = mount(CuiDropdown, {
            props: { listItems: items, valueField: 'id', textField: 'name', modelValue: [1], multiselect: true }
        });
        const options = wrapper.findAll('[role=option]');
        await options[1].trigger('click'); // select id 2
        expect(wrapper.emitted('update:model-value').at(-1)).toEqual([[1, 2]]);
    });

    it('multiselect: clicking a selected option removes it', async () => {
        const wrapper = mount(CuiDropdown, {
            props: { listItems: items, valueField: 'id', textField: 'name', modelValue: [1, 2], multiselect: true }
        });
        const options = wrapper.findAll('[role=option]');
        await options[0].trigger('click'); // deselect id 1
        expect(wrapper.emitted('update:model-value').at(-1)).toEqual([[2]]);
    });

    it('converts a single value to a one-item array when multiselect becomes true', async () => {
        const wrapper = mount(CuiDropdown, {
            props: { listItems: items, valueField: 'id', textField: 'name', modelValue: 2, multiselect: false }
        });
        await wrapper.setProps({ multiselect: true });
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('update:model-value').at(-1)).toEqual([[2]]);
    });

    it('converts a non-empty array to its first value when multiselect becomes false', async () => {
        const wrapper = mount(CuiDropdown, {
            props: { listItems: items, valueField: 'id', textField: 'name', modelValue: [2, 3], multiselect: true }
        });
        await wrapper.setProps({ multiselect: false });
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('update:model-value').at(-1)).toEqual([2]);
    });

    it('converts an empty array to null when multiselect becomes false', async () => {
        const wrapper = mount(CuiDropdown, {
            props: { listItems: items, valueField: 'id', textField: 'name', modelValue: [], multiselect: true }
        });
        await wrapper.setProps({ multiselect: false });
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('update:model-value').at(-1)).toEqual([null]);
    });

    it('groups items when groupField is provided', () => {
        const grouped = [
            { id: 1, name: 'A', grp: 'G1' },
            { id: 2, name: 'B', grp: 'G1' },
            { id: 3, name: 'C', grp: 'G2' },
        ];
        const wrapper = mount(CuiDropdown, {
            props: { listItems: grouped, valueField: 'id', textField: 'name', groupField: 'grp' }
        });
        expect(wrapper.findAll('[role=presentation]').length).toBe(2);
    });

    it('does not respond to clicks when disabled', async () => {
        const wrapper = mount(CuiDropdown, {
            props: { listItems: items, valueField: 'id', textField: 'name', disabled: true }
        });
        const options = wrapper.findAll('[role=option]');
        await options[0].trigger('click');
        expect(wrapper.emitted('update:model-value')).toBeFalsy();
    });

    it('exposes listItemText via the option-list slot', () => {
        const wrapper = mount(CuiDropdown, {
            props: { listItems: items, valueField: 'id', textField: 'name' },
            slots: {
                'option-list': `<template #option-list="{ items, listItemText }">
                    <div v-for="i in items" class="custom-opt">{{ listItemText(i) }}</div>
                </template>`
            }
        });
        const customOpts = wrapper.findAll('.custom-opt');
        expect(customOpts.length).toBe(3);
        expect(customOpts[0].text()).toBe('One');
    });

    it('serializes the selected value as JSON into the hidden input', async () => {
        const wrapper = mount(CuiDropdown, {
            props: { listItems: items, valueField: 'id', textField: 'name', modelValue: 2 }
        });
        await wrapper.vm.$nextTick();
        await wrapper.vm.$nextTick();
        expect(wrapper.find('input[type=hidden]').element.value).toBe('2');
    });

    it('serializes a multiselect array value as JSON into the hidden input', async () => {
        const wrapper = mount(CuiDropdown, {
            props: { listItems: items, valueField: 'id', textField: 'name', modelValue: [1, 2], multiselect: true }
        });
        await wrapper.vm.$nextTick();
        await wrapper.vm.$nextTick();
        expect(wrapper.find('input[type=hidden]').element.value).toBe('[1,2]');
    });

    it('sets aria-multiselectable on the listbox when multiselect is enabled', () => {
        const wrapper = mount(CuiDropdown, {
            props: { listItems: items, valueField: 'id', textField: 'name', multiselect: true }
        });
        expect(wrapper.find('[role=listbox]').attributes('aria-multiselectable')).toBe('true');
    });
});
