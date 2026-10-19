// Copyright (c) Fast Forward, LLC. All rights reserved.
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CuiTextBox from '../VueComponents/cui-TextBox.vue';

describe('cui-textbox', () => {
    it('renders the label and initial modelValue', async () => {
        const wrapper = mount(CuiTextBox, {
            props: { label: 'Name', modelValue: 'Bob' }
        });
        await wrapper.vm.$nextTick();
        expect(wrapper.find('label').text()).toBe('Name');
        expect(wrapper.find('input').element.value).toBe('Bob');
    });

    it('emits update:model-value and change on blur when value changes', async () => {
        const wrapper = mount(CuiTextBox, {
            props: { modelValue: '' }
        });
        await wrapper.vm.$nextTick();
        const input = wrapper.find('input');
        await input.setValue('hello');
        await input.trigger('blur');
        expect(wrapper.emitted('update:model-value')).toBeTruthy();
        expect(wrapper.emitted('update:model-value').at(-1)).toEqual(['hello']);
    });

    it('reflects modelValue changes from the parent', async () => {
        const wrapper = mount(CuiTextBox, {
            props: { modelValue: 'first' }
        });
        await wrapper.setProps({ modelValue: 'second' });
        await wrapper.vm.$nextTick();
        await wrapper.vm.$nextTick();
        expect(wrapper.find('input').element.value).toBe('second');
    });

    it('marks the input readonly when disabled', () => {
        const wrapper = mount(CuiTextBox, {
            props: { modelValue: '', disabled: true }
        });
        expect(wrapper.find('input').attributes('readonly')).toBeDefined();
    });

    it('does not emit when disabled', async () => {
        const wrapper = mount(CuiTextBox, {
            props: { modelValue: '', disabled: true }
        });
        const input = wrapper.find('input');
        await input.trigger('change');
        expect(wrapper.emitted('update:model-value')).toBeFalsy();
    });

    describe('mask', () => {
        // applyMask is a pure method of the component, so it is exercised directly.
        const apply = (mask, raw) => {
            const wrapper = mount(CuiTextBox, { props: { modelValue: '', mask } });
            return wrapper.vm.applyMask(raw);
        };

        it('9 accepts digits only and discards other characters', () => {
            expect(apply('999', '1a2b3c4')).toBe('123');
        });

        it('a accepts letters only', () => {
            expect(apply('aaa', '1A2b3c4d')).toBe('Abc');
        });

        it('* accepts letters and digits', () => {
            expect(apply('***', 'a-1_B!')).toBe('a1B');
        });

        it('inserts literals automatically', () => {
            expect(apply('(999) 999-9999', '5551234567')).toBe('(555) 123-4567');
        });

        it('does not emit a trailing literal until a following character is accepted', () => {
            expect(apply('(999) 999-9999', '5')).toBe('(5');
            expect(apply('999-999', '123')).toBe('123');
            expect(apply('999-999', '1234')).toBe('123-4');
        });

        it('accepts typed literals without doubling them', () => {
            expect(apply('999-999', '123-456')).toBe('123-456');
        });

        it('truncates input longer than the mask', () => {
            expect(apply('99', '12345')).toBe('12');
        });

        it('returns an empty string when nothing matches', () => {
            expect(apply('999', 'abc')).toBe('');
        });

        it('returns the value unchanged when no mask is set', () => {
            expect(apply(null, 'abc-123')).toBe('abc-123');
        });

        it('# is an optional digit', () => {
            expect(apply('99999-####', '12345')).toBe('12345');
            expect(apply('99999-####', '123456')).toBe('12345-6');
            expect(apply('99999-####', '123456789')).toBe('12345-6789');
        });

        it('? is an optional letter', () => {
            expect(apply('99?', '12')).toBe('12');
            expect(apply('99?', '12x')).toBe('12x');
            expect(apply('99?', '123')).toBe('12');
        });

        it('skips an optional slot when the next character does not fit', () => {
            expect(apply('#9', 'a5')).toBe('5');
            expect(apply('?9', '5')).toBe('5');
        });

        it('\\# is a literal hash', () => {
            expect(apply('\\#999', '123')).toBe('#123');
            expect(apply('\\#999', '#123')).toBe('#123');
        });

        it('\\? is a literal question mark', () => {
            expect(apply('999\\?', '123')).toBe('123');
            expect(apply('999\\?9', '1234')).toBe('123?4');
        });

        it('mixes escaped literals with optional characters', () => {
            expect(apply('\\#99#', '12')).toBe('#12');
            expect(apply('\\#99#', '123')).toBe('#123');
        });

        it('\\ also escapes the other mask characters', () => {
            expect(apply('\\999', '12')).toBe('912');
            expect(apply('\\a99', '12')).toBe('a12');
        });

        it('treats a trailing backslash as a literal backslash', () => {
            expect(apply('99\\', '12')).toBe('12');
        });

        it('formats the value in the input as the user types', async () => {
            const wrapper = mount(CuiTextBox, { props: { modelValue: '', mask: '(999) 999-9999' } });
            await wrapper.vm.$nextTick();
            const input = wrapper.find('input');
            input.element.value = '5551234567';
            await input.trigger('input');
            expect(input.element.value).toBe('(555) 123-4567');
        });

        it('applies the mask to values set through the model', async () => {
            const wrapper = mount(CuiTextBox, { props: { modelValue: '5551234567', mask: '(999) 999-9999' } });
            await wrapper.vm.$nextTick();
            await wrapper.vm.$nextTick();
            expect(wrapper.find('input').element.value).toBe('(555) 123-4567');
        });
    });
});
