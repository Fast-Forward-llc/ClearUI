// Copyright (c) Fast Forward, LLC. All rights reserved.
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CuiFilterSortPage from '../VueComponents/cui-FilterSortPage.vue';

const dataset = [
    { id: 1, name: 'Charlie' },
    { id: 2, name: 'Alice' },
    { id: 3, name: 'Bob' },
];

describe('cui-filter-sort-page', () => {
    it('emits the full dataset (paged) via update:fsp-dataset by default', async () => {
        const wrapper = mount(CuiFilterSortPage, {
            props: { srcDataset: dataset }
        });
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('update:filtered-item-count')).toBeTruthy();
        expect(wrapper.emitted('update:filtered-item-count').at(-1)).toEqual([3]);
    });

    it('filters items based on filterBy', async () => {
        const wrapper = mount(CuiFilterSortPage, {
            props: { srcDataset: dataset, filterBy: { name: 'A' }, debounceMs: 0 }
        });
        await new Promise(r => setTimeout(r, 10));
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('update:filtered-item-count').at(-1)).toEqual([1]);
    });

    it('paginates results based on itemsPerPage and pageNo', async () => {
        const wrapper = mount(CuiFilterSortPage, {
            props: { srcDataset: dataset, itemsPerPage: 2, pageNo: 1 }
        });
        await wrapper.vm.$nextTick();
        const emitted = wrapper.emitted('update:fsp-dataset');
        expect(emitted).toBeTruthy();
        expect(emitted.at(-1)[0].length).toBe(2);
    });
});
