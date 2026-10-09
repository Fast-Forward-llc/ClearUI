// Copyright (c) Fast Forward, LLC. All rights reserved.
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CuiValMsg from '../VueComponents/cui-ValMsg.vue';

describe('cui-valmsg', () => {
    it('shows the message inline when expr is false', async () => {
        const wrapper = mount(CuiValMsg, {
            props: { expr: false, msg: 'Field is required.', inline: true, triggerOn: 0 }
        });
        await wrapper.setProps({ triggerOn: 1 });
        await wrapper.vm.$nextTick();
        await wrapper.vm.$nextTick();
        expect(wrapper.find('span').isVisible()).toBe(true);
        expect(wrapper.text()).toBe('Field is required.');
    });

    it('hides the message when expr is true', async () => {
        const wrapper = mount(CuiValMsg, {
            props: { expr: true, msg: 'Field is required.', inline: true, triggerOn: 0 }
        });
        await wrapper.setProps({ triggerOn: 1 });
        await wrapper.vm.$nextTick();
        await wrapper.vm.$nextTick();
        expect(wrapper.find('span').isVisible()).toBe(false);
    });

    it('emits error when expr is false', async () => {
        const wrapper = mount(CuiValMsg, {
            props: { expr: false, msg: 'Invalid value.', triggerOn: 0 }
        });
        await wrapper.setProps({ triggerOn: 1 });
        await wrapper.vm.$nextTick();
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('error')).toBeTruthy();
        const evt = wrapper.emitted('error').at(-1)[0];
        expect(evt.msg).toBe('Invalid value.');
    });

    it('emits clear-error when expr becomes true after being false', async () => {
        const wrapper = mount(CuiValMsg, {
            props: { expr: false, msg: 'Invalid value.', triggerOn: 0 }
        });
        await wrapper.setProps({ triggerOn: 1 });
        await wrapper.vm.$nextTick();
        await wrapper.vm.$nextTick();
        await wrapper.setProps({ expr: true, triggerOn: 2 });
        await wrapper.vm.$nextTick();
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('clear-error')).toBeTruthy();
    });

    it('does not evaluate when disabled', async () => {
        const wrapper = mount(CuiValMsg, {
            props: { expr: false, msg: 'Invalid value.', disabled: true, triggerOn: 0 }
        });
        await wrapper.setProps({ triggerOn: 1 });
        await wrapper.vm.$nextTick();
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('error')).toBeFalsy();
    });

    it('clears the message when clearOn is truthy', async () => {
        const wrapper = mount(CuiValMsg, {
            props: { expr: false, msg: 'Invalid value.', triggerOn: 0 }
        });
        await wrapper.setProps({ triggerOn: 1 });
        await wrapper.vm.$nextTick();
        await wrapper.vm.$nextTick();
        await wrapper.setProps({ clearOn: true });
        await wrapper.vm.$nextTick();
        expect(wrapper.find('span').isVisible()).toBe(false);
    });
});
