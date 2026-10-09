// Copyright (c) Fast Forward, LLC. All rights reserved.
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CuiPanel from '../VueComponents/cui-Panel.vue';

describe('cui-panel', () => {
    it('renders slot content and applies initialWidth', () => {
        const wrapper = mount(CuiPanel, {
            props: { initialWidth: 250 },
            slots: { default: '<div class="content">Hello</div>' }
        });
        expect(wrapper.find('.content').text()).toBe('Hello');
        expect(wrapper.find('.h-resizable').attributes('style')).toContain('250px');
    });

    it('emits resize while dragging, clamped between minWidth and maxWidth', async () => {
        const wrapper = mount(CuiPanel, {
            props: { initialWidth: 300, minWidth: 100, maxWidth: 400 }
        });
        const panelEl = wrapper.find('.h-resizable').element;
        panelEl.getBoundingClientRect = () => ({ left: 0, right: 400, top: 0, bottom: 100, width: 400, height: 100 });

        const handle = wrapper.find('.resize-handle');
        handle.element.setPointerCapture = () => {};
        const pointerDownEvent = new Event('pointerdown', { bubbles: true, cancelable: true });
        Object.assign(pointerDownEvent, { pointerId: 1, clientX: 300 });
        await handle.element.dispatchEvent(pointerDownEvent);

        const pointerMoveEvent = new Event('pointermove', { bubbles: true, cancelable: true });
        Object.assign(pointerMoveEvent, { pointerId: 1, clientX: 1000 });
        document.dispatchEvent(pointerMoveEvent);
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('resize').at(-1)).toEqual([400]);
    });
});
