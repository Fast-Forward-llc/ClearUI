// Copyright (c) Fast Forward, LLC. All rights reserved.
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import CuiContextMenu from '../VueComponents/cui-ContextMenu.vue';

beforeEach(() => {
    if (!HTMLDialogElement.prototype.show) {
        HTMLDialogElement.prototype.show = function () { this.setAttribute('open', ''); };
    }
    if (!HTMLDialogElement.prototype.close) {
        HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
    }
});

describe('cui-context-menu', () => {
    it('renders a dialog with role=menu', () => {
        const trigger = document.createElement('button');
        trigger.className = 'menu-trigger';
        document.body.appendChild(trigger);

        const wrapper = mount(CuiContextMenu, {
            props: { parentTag: '.menu-trigger' }
        });
        expect(wrapper.find('[role=menu]').exists()).toBe(true);
        document.body.removeChild(trigger);
    });

    it('opens the menu and emits open when show becomes true', async () => {
        const trigger = document.createElement('button');
        trigger.className = 'menu-trigger';
        document.body.appendChild(trigger);

        const wrapper = mount(CuiContextMenu, {
            props: { parentTag: '.menu-trigger', show: false },
            attachTo: document.body
        });
        await wrapper.setProps({ show: true });
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('open')).toBeTruthy();

        wrapper.unmount();
        document.body.removeChild(trigger);
    });
});
