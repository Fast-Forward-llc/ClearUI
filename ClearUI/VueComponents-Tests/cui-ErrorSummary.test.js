// Copyright (c) Fast Forward, LLC. All rights reserved.
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CuiErrorSummary from '../VueComponents/cui-ErrorSummary.vue';

describe('cui-error-summary', () => {
    it('is hidden when there are no errors', () => {
        const wrapper = mount(CuiErrorSummary);
        expect(wrapper.find('.cui-error-summary').isVisible()).toBe(false);
    });

    it('renders an error added via a set-error-msg event', async () => {
        const wrapper = mount(CuiErrorSummary, { attachTo: document.body });
        const evt = new Event('set-error-msg', { bubbles: true });
        evt.valError = { msg: 'Name is required.', ctrlId: 'name', msgId: 'name-req', priority: 1 };
        wrapper.element.dispatchEvent(evt);
        await wrapper.vm.$nextTick();
        expect(wrapper.find('.cui-error-summary').isVisible()).toBe(true);
        expect(wrapper.text()).toContain('Name is required.');
        wrapper.unmount();
    });

    it('removes an error via a clear-error-msg event', async () => {
        const wrapper = mount(CuiErrorSummary, { attachTo: document.body });
        const setEvt = new Event('set-error-msg', { bubbles: true });
        setEvt.valError = { msg: 'Name is required.', ctrlId: 'name', msgId: 'name-req', priority: 1 };
        wrapper.element.dispatchEvent(setEvt);
        await wrapper.vm.$nextTick();
        expect(wrapper.find('.cui-error-summary').isVisible()).toBe(true);

        const clearEvt = new Event('clear-error-msg', { bubbles: true });
        clearEvt.valError = { msg: 'Name is required.', ctrlId: 'name', msgId: 'name-req', priority: 1 };
        wrapper.element.dispatchEvent(clearEvt);
        await wrapper.vm.$nextTick();
        expect(wrapper.find('.cui-error-summary').isVisible()).toBe(false);
        wrapper.unmount();
    });
});
