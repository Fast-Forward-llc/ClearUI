// Copyright (c) Fast Forward, LLC. All rights reserved.
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import CuiPopupDialog from '../VueComponents/cui-PopupDialog.vue';

beforeEach(() => {
    if (!HTMLDialogElement.prototype.showModal) {
        HTMLDialogElement.prototype.showModal = function () { this.open = true; };
    }
    if (!HTMLDialogElement.prototype.close) {
        HTMLDialogElement.prototype.close = function () { this.open = false; };
    }
});

describe('cui-popup-dialog', () => {
    it('renders the heading and message', () => {
        const wrapper = mount(CuiPopupDialog, {
            props: { heading: 'Confirm', message: 'Are you sure?' }
        });
        expect(wrapper.find('h2').text()).toBe('Confirm');
        expect(wrapper.text()).toContain('Are you sure?');
    });

    it('renders a default OK button when none are provided', () => {
        const wrapper = mount(CuiPopupDialog, {
            props: { message: 'Done.' }
        });
        const buttons = wrapper.findAll('button');
        expect(buttons.length).toBe(1);
        expect(buttons[0].text()).toBe('OK');
    });

    it('opens the dialog and emits open when show becomes true', async () => {
        const wrapper = mount(CuiPopupDialog, {
            props: { message: 'Hi', show: false }
        });
        await wrapper.setProps({ show: true });
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('open')).toBeTruthy();
    });

    it('closing via a button emits the button-named event and close', async () => {
        const wrapper = mount(CuiPopupDialog, {
            props: { message: 'Hi', show: true, buttons: ['Yes', 'No'] }
        });
        await wrapper.vm.$nextTick();
        const buttons = wrapper.findAll('button');
        await buttons[0].trigger('click');
        expect(wrapper.emitted('yes')).toBeTruthy();
    });
});
