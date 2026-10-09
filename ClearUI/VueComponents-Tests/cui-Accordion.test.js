// Copyright (c) Fast Forward, LLC. All rights reserved.
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CuiAccordion from '../VueComponents/cui-Accordion.vue';

const items = ['Panel One', 'Panel Two', 'Panel Three'];

describe('cui-accordion', () => {
    it('renders a trigger button per item', () => {
        const wrapper = mount(CuiAccordion, {
            props: { listItems: items }
        });
        expect(wrapper.findAll('.accordion-trigger').length).toBe(3);
    });

    it('expands a panel when its trigger is clicked (single expand)', async () => {
        const wrapper = mount(CuiAccordion, {
            props: { listItems: items, modelValue: null }
        });
        await wrapper.findAll('.accordion-trigger')[1].trigger('click');
        expect(wrapper.emitted('update:model-value').at(-1)).toEqual(['Panel Two']);
    });

    it('collapses an already-expanded panel when clicked again', async () => {
        const wrapper = mount(CuiAccordion, {
            props: { listItems: items, modelValue: 'Panel Two' }
        });
        await wrapper.findAll('.accordion-trigger')[1].trigger('click');
        expect(wrapper.emitted('update:model-value').at(-1)).toEqual([null]);
    });

    it('supports expanding multiple panels when multiExpand is true', async () => {
        const wrapper = mount(CuiAccordion, {
            props: { listItems: items, modelValue: ['Panel One'], multiExpand: true }
        });
        await wrapper.findAll('.accordion-trigger')[1].trigger('click');
        expect(wrapper.emitted('update:model-value').at(-1)).toEqual([['Panel One', 'Panel Two']]);
    });

    it('does not toggle when disabled', async () => {
        const wrapper = mount(CuiAccordion, {
            props: { listItems: items, disabled: true }
        });
        await wrapper.findAll('.accordion-trigger')[0].trigger('click');
        expect(wrapper.emitted('update:model-value')).toBeFalsy();
    });
});
