// Copyright (c) Fast Forward, LLC. All rights reserved.
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CuiTabbed from '../VueComponents/cui-Tabbed.vue';

const items = ['Tab One', 'Tab Two', 'Tab Three'];

describe('cui-tabbed', () => {
    it('renders a tab trigger per item', () => {
        const wrapper = mount(CuiTabbed, {
            props: { listItems: items }
        });
        expect(wrapper.findAll('[role=tab]').length).toBe(3);
    });

    it('selects the first tab by default', () => {
        const wrapper = mount(CuiTabbed, {
            props: { listItems: items }
        });
        const tabs = wrapper.findAll('[role=tab]');
        expect(tabs[0].attributes('aria-selected')).toBe('true');
    });

    it('selecting a tab emits update:model-value with its resolved value', async () => {
        const wrapper = mount(CuiTabbed, {
            props: { listItems: items, modelValue: null }
        });
        await wrapper.findAll('[role=tab]')[2].trigger('click');
        expect(wrapper.emitted('update:model-value').at(-1)).toEqual(['Tab Three']);
    });

    it('does not select when disabled', async () => {
        const wrapper = mount(CuiTabbed, {
            props: { listItems: items, disabled: true }
        });
        await wrapper.findAll('[role=tab]')[1].trigger('click');
        expect(wrapper.emitted('update:model-value')).toBeFalsy();
    });
});
