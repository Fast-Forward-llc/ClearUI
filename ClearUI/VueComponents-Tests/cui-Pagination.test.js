// Copyright (c) Fast Forward, LLC. All rights reserved.
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CuiPagination from '../VueComponents/cui-Pagination.vue';

describe('cui-pagination', () => {
    it('renders page number buttons based on item count', () => {
        const wrapper = mount(CuiPagination, {
            props: { pageNo: 1, itemsPerPage: 10, itemCount: 25 }
        });
        expect(wrapper.findAll('.page-number').length).toBeGreaterThan(0);
        expect(wrapper.find('.prev-btn').attributes('disabled')).toBeDefined();
    });

    it('marks the current page as active', () => {
        const wrapper = mount(CuiPagination, {
            props: { pageNo: 2, itemsPerPage: 10, itemCount: 25 }
        });
        const active = wrapper.find('.page-number.active');
        expect(active.text()).toBe('2');
    });

    it('clicking a page button emits update:page-no', async () => {
        const wrapper = mount(CuiPagination, {
            props: { pageNo: 1, itemsPerPage: 10, itemCount: 25 }
        });
        const buttons = wrapper.findAll('.page-number');
        const target = buttons.find(b => b.text() === '2');
        await target.trigger('click');
        expect(wrapper.emitted('update:page-no').at(-1)).toEqual([2]);
    });

    it('disables the next button on the last page', () => {
        const wrapper = mount(CuiPagination, {
            props: { pageNo: 3, itemsPerPage: 10, itemCount: 25 }
        });
        expect(wrapper.find('.next-btn').attributes('disabled')).toBeDefined();
    });
});
