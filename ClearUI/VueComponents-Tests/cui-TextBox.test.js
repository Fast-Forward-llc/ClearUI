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

    describe('checkValidity()', () => {
        // Mounts a textbox, sets the raw input value and runs the component's checkValidity().
        const validate = async (props, attrs, value) => {
            const wrapper = mount(CuiTextBox, {
                props: { modelValue: '', ...props },
                attrs,
                attachTo: document.body,
            });
            await wrapper.vm.$nextTick();
            const input = wrapper.find('input');
            input.element.value = value;
            wrapper.vm.checkValidity();
            // Snapshot synchronously: a later re-render resets the DOM value to the (empty) model value.
            const validity = {};
            for (const key in input.element.validity) validity[key] = input.element.validity[key];
            wrapper.unmount();
            return validity;
        };

        describe('required', () => {
            it.each([
                ['text', ''],
                ['number', ''],
                ['date', ''],
            ])('type %s: empty value is invalid (valueMissing)', async (type, value) => {
                const v = await validate({ type, required: true }, {}, value);
                expect(v.valid).toBe(false);
                expect(v.valueMissing).toBe(true);
            });

            it.each([
                ['text', 'abc'],
                ['number', '5'],
                ['date', '2024-03-15'],
            ])('type %s: a value is valid', async (type, value) => {
                const v = await validate({ type, required: true }, {}, value);
                expect(v.valid).toBe(true);
                expect(v.valueMissing).toBe(false);
            });

            it.each(['text', 'number', 'date'])('type %s: empty value is valid when not required', async (type) => {
                const v = await validate({ type }, {}, '');
                expect(v.valid).toBe(true);
            });
        });

        describe('number min/max', () => {
            const attrs = { min: 5, max: 10 };

            it('value below min is invalid (rangeUnderflow)', async () => {
                const v = await validate({ type: 'number' }, attrs, '4');
                expect(v.valid).toBe(false);
                expect(v.rangeUnderflow).toBe(true);
                expect(v.rangeOverflow).toBe(false);
            });

            it('value above max is invalid (rangeOverflow)', async () => {
                const v = await validate({ type: 'number' }, attrs, '11');
                expect(v.valid).toBe(false);
                expect(v.rangeOverflow).toBe(true);
                expect(v.rangeUnderflow).toBe(false);
            });

            it.each(['5', '7', '10'])('value %s within the range (inclusive) is valid', async (value) => {
                const v = await validate({ type: 'number' }, attrs, value);
                expect(v.valid).toBe(true);
            });

            it('only min set: a value above it is valid', async () => {
                const v = await validate({ type: 'number' }, { min: 5 }, '1000');
                expect(v.valid).toBe(true);
            });

            it('only max set: a value below it is valid', async () => {
                const v = await validate({ type: 'number' }, { max: 10 }, '-1000');
                expect(v.valid).toBe(true);
            });

            it('an empty value is valid when not required, even with min/max', async () => {
                const v = await validate({ type: 'number' }, attrs, '');
                expect(v.valid).toBe(true);
            });
        });

        describe('date min/max', () => {
            const attrs = { min: '2024-01-10', max: '2024-01-20' };

            it('date before min is invalid (rangeUnderflow)', async () => {
                const v = await validate({ type: 'date' }, attrs, '2024-01-09');
                expect(v.valid).toBe(false);
                expect(v.rangeUnderflow).toBe(true);
                expect(v.rangeOverflow).toBe(false);
            });

            it('date after max is invalid (rangeOverflow)', async () => {
                const v = await validate({ type: 'date' }, attrs, '2024-01-21');
                expect(v.valid).toBe(false);
                expect(v.rangeOverflow).toBe(true);
                expect(v.rangeUnderflow).toBe(false);
            });

            it.each(['2024-01-10', '2024-01-15', '2024-01-20'])('date %s within the range (inclusive) is valid', async (value) => {
                const v = await validate({ type: 'date' }, attrs, value);
                expect(v.valid).toBe(true);
            });

            it('an empty value is valid when not required, even with min/max', async () => {
                const v = await validate({ type: 'date' }, attrs, '');
                expect(v.valid).toBe(true);
            });
        });

        describe('text min/max', () => {
            // min and max only apply to numeric and date input types; text inputs ignore them.
            it('are ignored for type text', async () => {
                const v = await validate({ type: 'text' }, { min: 5, max: 10 }, 'zzz');
                expect(v.valid).toBe(true);
                expect(v.rangeUnderflow).toBe(false);
                expect(v.rangeOverflow).toBe(false);
            });
        });

        describe('component state', () => {
            const run = async (props, attrs, value) => {
                const wrapper = mount(CuiTextBox, {
                    props: { modelValue: '', ...props },
                    attrs,
                    attachTo: document.body,
                });
                await wrapper.vm.$nextTick();
                const input = wrapper.find('input');
                input.element.value = value;
                wrapper.vm.checkValidity();
                await wrapper.vm.$nextTick();
                return wrapper;
            };

            it('a valid value leaves the component valid with no error message', async () => {
                const wrapper = await run({ type: 'number', required: true }, { min: 1, max: 10 }, '5');
                expect(wrapper.vm.inputIsValid).toBe(true);
                expect(wrapper.vm.IsInvalid).toBe(false);
                expect(wrapper.vm.validityInfo.valid).toBe(true);
                wrapper.unmount();
            });

            // checkValidity() evaluates the input's validity for both valid and invalid values, so an invalid
            // value updates the component's error state.
            it('a required empty value marks the component invalid with an error message', async () => {
                const wrapper = await run({ type: 'text', required: true }, {}, '');
                expect(wrapper.vm.inputIsValid).toBe(false);
                expect(wrapper.vm.IsInvalid).toBe(true);
                expect(wrapper.vm.validityInfo.valueMissing).toBe(true);
                wrapper.unmount();
            });

            it('a number above max marks the component invalid', async () => {
                const wrapper = await run({ type: 'number' }, { max: 10 }, '11');
                expect(wrapper.vm.inputIsValid).toBe(false);
                expect(wrapper.vm.validityInfo.rangeOverflow).toBe(true);
                wrapper.unmount();
            });

            it('a date before min marks the component invalid', async () => {
                const wrapper = await run({ type: 'date' }, { min: '2024-01-10' }, '2024-01-09');
                expect(wrapper.vm.inputIsValid).toBe(false);
                expect(wrapper.vm.validityInfo.rangeUnderflow).toBe(true);
                wrapper.unmount();
            });

            it('an invalid value sets the error message', async () => {
                const wrapper = await run({ type: 'number' }, { max: 10 }, '11');
                expect(wrapper.vm.error_msg).toBeTruthy();
                expect(wrapper.vm.error_msg).toBe(wrapper.vm.nativeValidationMsg);
                wrapper.unmount();
            });

            it('correcting an invalid value clears the invalid state and error message', async () => {
                const wrapper = await run({ type: 'number' }, { min: 1, max: 10 }, '11');
                expect(wrapper.vm.IsInvalid).toBe(true);
                wrapper.find('input').element.value = '5';
                wrapper.vm.checkValidity();
                await wrapper.vm.$nextTick();
                expect(wrapper.vm.inputIsValid).toBe(true);
                expect(wrapper.vm.IsInvalid).toBe(false);
                expect(wrapper.vm.validityInfo.rangeOverflow).toBe(false);
                wrapper.unmount();
            });

            it('an invalid value emits an error event', async () => {
                const wrapper = await run({ type: 'text', required: true }, {}, '');
                const errors = wrapper.emitted('error');
                expect(errors).toBeTruthy();
                expect(errors.at(-1)[0].msg).toBeTruthy();
                wrapper.unmount();
            });
        });
    });
});
