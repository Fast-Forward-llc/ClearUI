// Copyright (c) Fast Forward, LLC. All rights reserved.
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import CuiFspDebounce from '../VueComponents/cui-FspDebounce.vue';

describe('cui-fsp-debounce', () => {
    it('exposes initial prop values via the default slot', () => {
        const wrapper = mount(CuiFspDebounce, {
            props: { pageNo: 1, itemsPerPage: 10 },
            slots: { default: `<template #default="{ pageNo, itemsPerPage }"><div class="info">{{ pageNo }}-{{ itemsPerPage }}</div></template>` }
        });
        expect(wrapper.find('.info').text()).toBe('1-10');
    });

    it('debounces prop changes and emits change after debounceMs', async () => {
        vi.useFakeTimers();
        const wrapper = mount(CuiFspDebounce, {
            props: { pageNo: 1, itemsPerPage: 10, debounceMs: 100 }
        });
        await wrapper.setProps({ pageNo: 2 });
        expect(wrapper.emitted('change')).toBeFalsy();
        vi.advanceTimersByTime(100);
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('change')).toBeTruthy();
        expect(wrapper.emitted('change').at(-1)[0].pageNo).toBe(2);
        vi.useRealTimers();
    });
});
