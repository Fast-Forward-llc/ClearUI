// Copyright (c) Fast Forward, LLC. All rights reserved.
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CuiSortToggle from '../VueComponents/cui-SortToggle.vue';

describe('cui-sort-toggle', () => {
    it('sets ascending sort when the up arrow is clicked', async () => {
        const sortBy = {};
        const wrapper = mount(CuiSortToggle, {
            props: { column: 'name', sortBy }
        });
        await wrapper.find('.sort-arrow-up').trigger('click');
        expect(sortBy.name).toBe('asc');
    });

    it('sets descending sort when the down arrow is clicked', async () => {
        const sortBy = {};
        const wrapper = mount(CuiSortToggle, {
            props: { column: 'name', sortBy }
        });
        await wrapper.find('.sort-arrow-down').trigger('click');
        expect(sortBy.name).toBe('desc');
    });

    it('clears sort when toggled off single-sort mode', async () => {
        const sortBy = { name: 'asc' };
        const wrapper = mount(CuiSortToggle, {
            props: { column: 'name', sortBy }
        });
        await wrapper.find('.sort-arrow-up').trigger('click');
        expect(sortBy.name).toBeUndefined();
    });

    it('clears other columns when multiSort is false', async () => {
        const sortBy = { other: 'asc' };
        const wrapper = mount(CuiSortToggle, {
            props: { column: 'name', sortBy, multiSort: false }
        });
        await wrapper.find('.sort-arrow-up').trigger('click');
        expect(sortBy.other).toBeUndefined();
        expect(sortBy.name).toBe('asc');
    });

    it('preserves other columns when multiSort is true', async () => {
        const sortBy = { other: 'asc' };
        const wrapper = mount(CuiSortToggle, {
            props: { column: 'name', sortBy, multiSort: true }
        });
        await wrapper.find('.sort-arrow-up').trigger('click');
        expect(sortBy.other).toBe('asc');
        expect(sortBy.name).toBe('asc');
    });
});
