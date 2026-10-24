<!--
Copyright (c) Fast Forward, LLC. All rights reserved.
Licensed under the MIT License. See LICENSE file in the project root for full license information.
-->
<template>
    <div class="cui-date-range-component" ref="root">
        <div class="cui-date-range">
            <div class="cui-date-range-buttons" :style="{'anchor-name':'--'+Id}">
                <cui-textbox :key="'s' + startKey"
                             :id="Id+'-fromDate'"
                             :type="inputType()"
                             :label="startDateLabel"
                             class="cui-date-range-input start-input"
                             :name="StartName"
                             :model-value="inputValue(start)"
                             :model-modifiers="{ lazy: true }"
                             :mask="mask"
                             :placeholder="placeholder"
                             :disabled="disabled"
                             :readonly="readonly"
                             :required="required"
                             :aria-invalid="IsInvalid"
                             :aria-label="`${startDateLabel} date`"
                             :validateOn="valTrigger"
                             @update:model-value="onInputChange('start', $event)"
                             @error="onErrorMsg"
                             v-show="inputType()!='hidden'">
                    <template #errors>{{noop}}</template>
                </cui-textbox>
                <cui-textbox :key="'e' + endKey"
                             :id="Id+'-toDate'"
                             :type="inputType()"
                             :label="endDateLabel"
                             class="cui-date-range-input end-input"
                             :name="EndName"
                             :model-value="inputValue(end)"
                             :model-modifiers="{ lazy: true }"
                             :mask="mask"
                             :placeholder="placeholder"
                             :disabled="disabled"
                             :required="required"
                             :readonly="readonly"
                             :aria-invalid="IsInvalid"
                             :aria-label="`${endDateLabel} date`"
                             :validateOn="valTrigger"
                             @update:model-value="onInputChange('end', $event)"
                             @error="onErrorMsg"
                             :actionBtnConfig="PickerBtnConfig"
                             v-show="inputType()!='hidden'">
                    <template #errors>{{noop}}</template>
                </cui-textbox>
                <button v-if="inputType()==='hidden'"
                        class="cui-date-range-btn"
                        :title="'From: ' + this.start + ' To: ' + this.end"
                        aria-label="Open Date Range Picker"
                        :aria-expanded="open"
                        :disabled="disabled||readonly"
                        @click="togglePicker">
                    <span class="symbols">calendar_month</span><span class="symbols right-icon">calendar_month</span>
                </button>
            </div>
            <div v-show="open" class="cui-date-range-popup" role="dialog" aria-label="Date range picker" @keydown.esc="open = false" :style="{'position-anchor':'--'+Id, 'container-name':Id}">
                <div class="cui-date-range-header">
                    <span class="cui-date-range-year">{{ leftYear }}</span>
                    <button type="button"
                            class="cui-date-range-icon-btn"
                            aria-label="Select year"
                            @click="yearMode = !yearMode">
                        <span class="symbols">edit</span>
                    </button>
                    <button type="button"
                            class="cui-date-range-icon-btn cui-date-range-clear-btn"
                            aria-label="Clear dates"
                            title="Clear dates"
                            @click="clearDates">
                        <span class="symbols">event_busy</span>
                    </button>
                    <button type="button" ref="closeBtn"
                            class="cui-date-range-icon-btn cui-date-range-close-btn"
                            aria-label="Close"
                            title="Close"
                            @click="this.open = false">
                        <span class="symbols">close</span>
                    </button>
                </div>

                <div class="cui-date-range-body">
                    <div v-if="yearMode" class="cui-date-range-years">
                        <button v-for="y in years"
                                :key="y"
                                type="button"
                                class="cui-date-range-year-btn"
                                :class="{ active: y === leftYear }"
                                @click="selectYear(y)">
                            {{ y }}
                        </button>
                    </div>

                    <div v-else class="cui-date-range-calendars">
                        <div v-for="cal in calendars" :key="cal.side" class="cui-date-range-calendar">
                            <div class="cui-date-range-month-row">
                                <span class="cui-date-range-month-name">{{ cal.name }}</span><span class="cui-date-range-month-year" v-if="leftYear!=cal.year">{{cal.year}}</span>
                                <button type="button" class="cui-date-range-icon-btn" aria-label="Previous month" @click="cal.prev()">
                                    <span class="symbols">chevron_left</span>
                                </button>
                                <button type="button" class="cui-date-range-icon-btn" aria-label="Next month" @click="cal.next()">
                                    <span class="symbols">chevron_right</span>
                                </button>
                            </div>
                            <div class="cui-date-range-grid">
                                <span v-for="(d, i) in weekdays" :key="'w' + i" class="cui-date-range-weekday">{{ d }}</span>
                                <template v-for="(cell, i) in cal.cells" :key="i">
                                    <span v-if="!cell" class="cui-date-range-blank"></span>
                                    <button v-else
                                            type="button"
                                            class="cui-date-range-day"
                                            :class="dayClasses(cell.key)"
                                            @click="selectDate(cell.key)"
                                            :aria-label="DOW(i)+cal.name+' '+ordinalDay(cell.day)">
                                        {{ cell.day }}
                                    </button>
                                </template>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="errors" role="status" :id="this.Id+'_valmsg'">
            <slot name="errors" :id="Id"
                  :value="lastEmittedValue"
                  :required="required"
                  :disabled="disabled"
                  :readonly="readonly"
                  :validityInfo="validityInfo"
                  :validateTrigger="valTrigger">
                {{error_msg}}
            </slot>
        </div>
        <slot v-if="$slots.default"
              :id="Id"
              :value="lastEmittedValue"
              :required="required"
              :disabled="disabled"
              :readonly="readonly"
              :validityInfo="validityInfo"
              :validateTrigger="valTrigger">
        </slot>
    </div>
</template>
<script>
    import { nextTock } from "../js/common.js"
    import { ValError } from "../js/ValError.js"
    import InputComponentBase from '../js/InputComponentBase.js';
    import { ActionBtnConfig } from "../js/ActionBtnConfig.js"
    import CuiTextbox from './cui-TextBox.vue';
    let cnt = 1;
    const pad = (n) => String(n).padStart(2, '0');
    const toKey = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
    const ordinalNames = [
        "First ", "Second ", "Third ", "Fourth ", "Fifth ",
        "Sixth ", "Seventh ", "Eighth ", "Ninth ", "Tenth ",
        "Eleventh ", "Twelfth ", "Thirteenth ", "Fourteenth ", "Fifteenth ",
        "Sixteenth ", "Seventeenth ", "Eighteenth ", "Nineteenth ", "Twentieth ",
        "Twenty-first ", "Twenty-second ", "Twenty-third ", "Twenty-fourth ",
        "Twenty-fifth ", "Twenty-sixth ", "Twenty-seventh ", "Twenty-eighth ",
        "Twenty-ninth ", "Thirtieth ", "Thirty-first "
    ];
    const dayNames = {
        "1": "Monday ", "2": "Tuesday ", "3": "Wednesday ", "4": "Thursday ", "5": "Friday ", "6": "Saturday ", "0": "Sunday "
    };

    function normalize(value) {
        if (!value) return null;
        if (value instanceof Date) {
            return isNaN(value) ? null : toKey(value.getFullYear(), value.getMonth(), value.getDate());
        }
        const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
        return match ? `${match[1]}-${match[2]}-${match[3]}` : null;
    }

    const localeFormatter = new Intl.DateTimeFormat(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' });
    // Ordered date part types
    const localeOrder = localeFormatter.formatToParts(new Date(2000, 10, 22))
        .map(p => p.type)
        .filter(t => t === 'year' || t === 'month' || t === 'day');
    const localePlaceholder = localeFormatter.formatToParts(new Date(2000, 10, 22))
        .map(p => p.type === 'year' ? 'yyyy' : p.type === 'month' ? 'MM' : p.type === 'day' ? 'dd' : p.value)
        .join('');
    // cui-textbox mask for the locale format: every digit in a formatted sample date becomes 9.
    const localeMask = localeFormatter.format(new Date(2000, 10, 22))
        .replace(/[\u200e\u200f\u061c]/g, '')
        .replace(/\d/g, '9');

    // Formats a normalized yyyy-MM-dd key using the browser locale.
    function formatLocale(key) {
        if (!key) return '';
        const [y, m, d] = key.split('-').map(Number);
        return localeFormatter.format(new Date(y, m - 1, d));
    }

    // Parses text with numeric date parts in the given order (e.g. ['month', 'day', 'year']) into a
    // normalized yyyy-MM-dd key, or null when invalid.
    function parseWithOrder(text, order) {
        const nums = String(text).match(/\d+/g);
        if (!nums || nums.length !== order.length) return null;
        const parts = {};
        order.forEach((type, i) => { parts[type] = Number(nums[i]); });
        let year = parts.year;
        if (nums[order.indexOf('year')].length <= 2) year += 2000;
        const date = new Date(year, parts.month - 1, parts.day);
        if (date.getFullYear() !== year || date.getMonth() !== parts.month - 1 || date.getDate() !== parts.day) return null;
        return toKey(year, parts.month - 1, parts.day);
    }

    // Parses locale formatted text into a normalized yyyy-MM-dd key, or null when invalid.
    function parseLocale(text) {
        return parseWithOrder(text, localeOrder);
    }

    const localeFormat = { placeholder: localePlaceholder, mask: localeMask, format: formatLocale, parse: parseLocale };

    // Builds a date format from a pattern such as 'dd/MM/yyyy' or 'M/d/yyyy'. Tokens: yyyy, yy, MM, M, dd, d;
    // any other character is a literal. M and d accept one or two digits. Returns null unless the pattern
    // has a year, month and day token once each.
    function createPatternFormat(pattern) {
        const tokens = String(pattern).match(/yyyy|yy|MM|M|dd|d|[\s\S]/g) ?? [];
        const typeOf = (t) => t === 'yyyy' || t === 'yy' ? 'year' : t === 'MM' || t === 'M' ? 'month' : t === 'dd' || t === 'd' ? 'day' : null;
        const order = tokens.map(typeOf).filter(Boolean);
        if (order.length !== 3 || new Set(order).size !== 3) return null;
        // cui-textbox mask: 9 = required digit, # = optional digit. Literals that are mask characters are escaped.
        const maskOf = (t) => {
            if (t === 'yyyy') return '9999';
            if (t === 'yy' || t === 'MM' || t === 'dd') return '99';
            if (t === 'M' || t === 'd') return '9#';
            return /[9a*#?\\]/.test(t) ? '\\' + t : t;
        };
        return {
            placeholder: pattern,
            mask: tokens.map(maskOf).join(''),
            format(key) {
                if (!key) return '';
                const [y, m, d] = key.split('-');
                return tokens.map(t => t === 'yyyy' ? y : t === 'yy' ? y.slice(-2) : t === 'MM' ? m : t === 'M' ? String(Number(m)) : t === 'dd' ? d : t === 'd' ? String(Number(d)) : t).join('');
            },
            parse(text) {
                return parseWithOrder(text, order);
            },
        };
    }

    // Month index = year * 12 + zero based month
    function monthIndexOf(key) {
        const [y, m] = key.split('-').map(Number);
        return y * 12 + (m - 1);
    }

    export default {
        extends: InputComponentBase,
        components: { CuiTextbox },
        props: {
            id: null,
            // ISO 'yyyy-MM-dd' string (a Date is also accepted). Emitted values are ISO strings or null.
            startDate: { type: [String, Date], default: null },
            endDate: { type: [String, Date], default: null },
            min: { type: [String, Date], default: null },
            max: { type: [String, Date], default: null },
            required: { type: Boolean, default: false },
            disabled: { type: Boolean, default: false },
            readonly: { type: Boolean, default: false },
            // Optional form field names for the start/end inputs.
            startName: { type: String, default: undefined },
            endName: { type: String, default: undefined },
            startDateLabel: { type: String, default: 'From' },
            endDateLabel: { type: String, default: 'To' },
            // Overrides the browser locale date format, e.g. 'dd/MM/yyyy', 'M/d/yyyy' or 'yyyy-MM-dd'.
            // Tokens: yyyy, yy, MM, M, dd, d. M and d accept one or two digits. Any other character is a literal separator.
            dateMask: { type: String, default: null },
            validateOn: null,
        },
        emits: ['update:start-date', 'update:end-date', 'change', 'error'],
        data() {
            return {
                open: false,
                yearMode: false,
                activeButton: 'start',
                leftIdx: 0,
                rightIdx: 1,
                startKey: 0,
                endKey: 0,
                valTrigger: 0,
                lastEmittedValue: null,
            };
        },
        computed: {
            noop() { return null; },
            start() { return normalize(this.startDate); },
            end() { return normalize(this.endDate); },
            weekdays() { return ['S', 'M', 'T', 'W', 'T', 'F', 'S']; },
            dateFormat() {
                if (!this.dateMask) return localeFormat;
                const custom = createPatternFormat(this.dateMask);
                if (!custom) {
                    console.warn(`cui-date-range: invalid date-mask '${this.dateMask}'. It must contain yyyy (or yy), MM (or M) and dd (or d) once each. Using the browser locale format.`);
                    return localeFormat;
                }
                return custom;
            },
            placeholder() { return this.dateFormat.placeholder; },
            mask() { return this.inputType() === 'hidden' ? null : this.dateFormat.mask; },
            leftYear() { return Math.floor(this.leftIdx / 12); },
            years() {
                const min = this.min ? new Date(this.min) : null;
                const max = this.max ? new Date(this.max) : null;
                const startYear = min?.getFullYear() || new Date().getFullYear() - 31;
                const endYear = max?.getFullYear() || new Date().getFullYear() + 8;
                const hi = Math.max(startYear, endYear);
                const lo = Math.min(startYear, endYear);
                const list = [];
                for (let y = hi; y >= lo; y--) list.push(y);
                return list;
            },
            calendars() {
                return [
                    {
                        side: 'left',
                        ...this.buildMonth(this.leftIdx),
                        prev: () => { this.leftIdx--; },
                        next: () => {
                            this.leftIdx++;
                            if (this.rightIdx <= this.leftIdx) this.rightIdx = this.leftIdx + 1;
                        },
                    },
                    {
                        side: 'right',
                        ...this.buildMonth(this.rightIdx),
                        prev: () => {
                            this.rightIdx--;
                            if (this.leftIdx >= this.rightIdx) this.leftIdx = this.rightIdx - 1;
                        },
                        next: () => { this.rightIdx++; },
                    },
                ];
            },
            PickerBtnConfig() {
                return ActionBtnConfig.FromObject({
                    icon: 'calendar_month',
                    onClick: this.togglePicker,
                    label: 'Open Date Picker',
                })
            }
        },
        watch: {
            open(newVal) {
                //if (newVal && this.$refs.closeBtn) this.$refs.closeBtn.focus()
                if (newVal) this.$nextTick(() => this.$refs.closeBtn.focus());
            },
            validateOn(newVal) {
                if (newVal) this.checkValidity(this.start, this.end);
            },
            startDate(newVal) {
                this.$nextTick(() => this.checkValidity(this.start, this.end));
            },
            endDate(newVal) {
                this.$nextTick(() => this.checkValidity(this.start, this.end));
            }
        },
        created() {
            this.Id = this.id ? this.id : 'dateRange' + cnt++;
            this.StartName = this.startName ? this.startName : this.Id + '.FromDate';
            this.EndName = this.endName ? this.endName : this.Id + '.ToDate';
        },
        mounted() {
            document.addEventListener('mousedown', this.onDocumentMouseDown);
        },
        beforeUnmount() {
            document.removeEventListener('mousedown', this.onDocumentMouseDown);
        },
        methods: {
            ordinalDay(day) {
                return ordinalNames[day - 1];
            },
            DOW(day) {
                day = day % 7;
                return dayNames[day];
            },
            onDocumentMouseDown(e) {
                if (this.open && this.$refs.root && !this.$refs.root.contains(e.target)) {
                    this.open = false;
                }
            },
            togglePicker() {
                if (this.open) {
                    this.open = false;
                    return;
                }
                if (this.readonly || this.disabled) return;
                if (!this.open) this.resetMonths();
                this.yearMode = false;
                this.open = true;
            },
            resetMonths() {
                const now = new Date();
                this.leftIdx = this.start ? monthIndexOf(this.start) : now.getFullYear() * 12 + now.getMonth();
                this.rightIdx = this.end ? monthIndexOf(this.end) : this.leftIdx + 1;
                if (this.rightIdx <= this.leftIdx) this.rightIdx = this.leftIdx + 1;
            },
            selectYear(year) {
                this.leftIdx = year * 12 + (this.leftIdx % 12);
                this.rightIdx = this.leftIdx + 1;
                if (this.end) {
                    const endMonth = monthIndexOf(this.end) % 12;
                    const endIdx = year * 12 + endMonth;
                    if (endIdx > this.leftIdx) {
                        this.rightIdx = endIdx;
                    }
                }
                this.yearMode = false;
            },
            buildMonth(idx) {
                const year = Math.floor(idx / 12);
                const month = idx % 12;
                const name = new Date(year, month, 1).toLocaleString(undefined, { month: 'long' });
                const firstDow = new Date(year, month, 1).getDay();
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                const cells = [];
                for (let i = 0; i < firstDow; i++) cells.push(null);
                for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, key: toKey(year, month, d) });
                return { name, cells, year };
            },
            inputType() {
                const c = this.$attrs.class;
                const classes = Array.isArray(c) ? c.join(' ') : (c && typeof c === 'object' ? Object.keys(c).filter(k => c[k]).join(' ') : (c || ''));
                return classes.split(/\s+/).includes('compact') ? 'hidden' : 'text';
            },
            inputValue(key) {
                if (!key) return '';
                return this.inputType() === 'hidden' ? key : this.dateFormat.format(key);
            },
            resetInput(which) {
                if (which === 'start') this.startKey++;
                else this.endKey++;
            },
            emitValues(start, end) {
                this.checkValidity(start, end);
                if (start !== this.start) this.$emit('update:start-date', start);
                if (end !== this.end) this.$emit('update:end-date', end);
                this.emitRange(start, end)
            },
            emitRange(from, to) {
                if (this.readonly || this.disabled) return;
                if (from && to) {
                    this.checkValidity(from,to);
                    this.$emit('change', { fromDate: from, toDate: to });
                    this.lastEmittedValue = { fromDate: from, toDate: to }
                    this.$nextTick(() => this.valTrigger++);
                }
            },
            onInputChange(which, text) {
                if (this.readonly || this.disabled) return;
                text = (text ?? '').toString().trim();
                let value = null;
                if (text) {
                    value = this.dateFormat.parse(text);
                    if (!value) {
                        // Invalid text: re-create only this textbox to restore the stored value.
                        this.resetInput(which);
                        return;
                    }
                    if (this.dateFormat.format(value) !== text && this.inputType() !== 'hidden') this.resetInput(which);
                }
                let newFrom = which === 'start' ? value : this.start;
                let newTo = which === 'end' ? value : this.end;
                if (newFrom && newTo && newFrom > newTo) {
                    [newFrom, newTo] = [newTo, newFrom];
                }
                this.emitValues(newFrom, newTo);
            },
            clearDates() {
                if (this.readonly || this.disabled) return;
                this.emitValues(newFrom, newTo);
            },
            selectDate(key) {
                if (this.readonly || this.disabled) return;
                const s = this.start;
                const e = this.end;
                let newFrom;
                let newTo;
                if (s && e) {
                    if (key < s) {
                        newFrom = key;
                        newTo = e;
                    } else if (key > e) {
                        newFrom = s;
                        newTo = key;
                    } else {
                        newFrom = key;
                        newTo = key;
                    }
                } else if (!s) {
                    newFrom = key;
                    newTo = key;
                } else if (key < s) {
                    newFrom = key;
                    newTo = s;
                } else {
                    newFrom = s;
                    newTo = key;
                }
                this.emitValues(newFrom, newTo);
            },
            dayClasses(key) {
                const s = this.start;
                const e = this.end;
                if (s && e) {
                    return {
                        'range-start': key === s,
                        'range-end': key === e,
                        'range-mid': key > s && key < e,
                    };
                }
                return { single: key === (s || e) };
            },
            checkValidity(from, to) {
                if (this.readonly || this.disabled) return true;
                const s = from;
                const e = to;
                let valid = true;
                this.errList.removeId(this.Id);
                this.errList.removeId('native');
                this.$refs.startInput
                if (this.required && (!s || !e)) {
                    this.errList.addError(new ValError(`'${this.startDateLabel}' and '${this.endDateLabel}' dates are required.`, 98.05, this.Id, this.Id));
                    valid = false;
                }
                if (s && e && s > e) {
                    this.errList.addError(new ValError(`'${this.startDateLabel}' date must be before or equal to '${this.endDateLabel}' date.`, 98.04, this.Id, this.Id));
                    valid = false;
                }
                if (s && this.min && s < normalize(this.min)) {
                    this.errList.addError(new ValError(`'${this.startDateLabel}' date must be on or after ${this.dateFormat.format(normalize(this.min))}.`, 98.03, this.Id, this.Id));
                    valid = false;
                }
                if (e && this.max && e > normalize(this.max)) {
                    this.errList.addError(new ValError(`'${this.endDateLabel}' date must be on or before ${this.dateFormat.format(normalize(this.max))}.`, 98.03, this.Id, this.Id));
                    valid = false;
                }
                this.valTrigger++;
                this.error_msg = this.errList.getTopMsg();
                return valid;
            }
        },
    };
</script>
<style>
    .cui-date-range-component {
        position: relative;
        display: inline-block;
    }

    .cui-date-range-buttons {
        display: flex;
        flex-direction: row;
        gap: 0.25rem;
    }

        .cui-date-range-buttons .right-icon {
            margin-left: 1rem;
            display:none;
        }

    .cui-date-range-btn,
    .cui-date-range-icon-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.25rem;
        border: var(--ctrl-borders);
        background: var(--color-ctrl-background);
        color: var(--color-text);
        cursor: pointer;
    }

        .cui-date-range-btn.active {
            border-color: var(--color-primary);
        }

    .cui-date-range-input {
        width: 7.5rem;
    }

    .cui-date-range.compact .cui-date-range-input {
        display: none;
    }

    .cui-date-range-icon-btn {
        border: none;
        background: transparent;
    }

    .cui-date-range-clear-btn {
        margin-left: auto;
    }

    .cui-date-range-popup {
        --cui-date-range-calendar-width: 14rem;
        --cui-date-range-body-height: auto;
        position: absolute;
        top: 100%;
        left: 0;
        z-index: 1000;
        margin-top: 0.25rem;
        background: var(--color-tab-panel-background);
        border: var(--ctrl-borders);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        color: var(--color-text);
    }

    .cui-date-range-header {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.5rem 0.75rem;
        border-bottom: var(--ctrl-borders);
        font-weight: bold;
    }

    .cui-date-range-body {
        box-sizing: border-box;
        height: var(--cui-date-range-body-height);
        padding: 0.5rem;
        overflow: hidden;
    }

    .cui-date-range-years {
        box-sizing: border-box;
        display: flex;
        flex-wrap: wrap;
        align-content: flex-start;
        gap: 0.25rem;
        width: 100%;
        height: 100%;
        overflow-y: auto;
        overflow-x: hidden;
    }

    .cui-date-range-year-btn {
        min-width: 4rem;
        padding: 0.25rem 0.5rem;
        border: var(--ctrl-borders);
        background: var(--color-ctrl-background);
        color: var(--color-text);
        cursor: pointer;
    }

        .cui-date-range-year-btn.active {
            background: var(--color-primary);
            color: #ffffff;
        }

    .cui-date-range-calendars {
        display: flex;
        gap: 1rem;
        height: 100%;
    }

    .cui-date-range-calendar {
        flex: 1 1 0;
        min-width: var(--cui-date-range-calendar-width);
    }

    .cui-date-range-month-row {
        display: flex;
        align-items: center;
        margin-bottom: 0.25rem;
    }

    .cui-date-range-month-name {
        flex: 1 1 auto;
        font-weight: bold;
    }

    .cui-date-range-month-year {
        margin-left: 1rem;
        font-weight: bold;
    }

    .cui-date-range-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        text-align: center;
    }

    .cui-date-range-weekday {
        padding: 0.25rem 0;
        font-size: 0.8rem;
        opacity: 0.7;
    }

    .cui-date-range-day {
        height: 2rem;
        padding: 0;
        border: 0px solid transparent;
        border-top-width: 1px;
        border-bottom-width: 1px;
        background: transparent;
        color: var(--color-text);
        cursor: pointer;
    }

        .cui-date-range-day:hover {
            background: var(--color-background);
        }

        .cui-date-range-day.single {
            border-width:1px;
            border-color: var(--color-primary);
            background: color-mix(in srgb, var(--color-primary) 20%, transparent);
        }

        .cui-date-range-day.range-start {
            border-left-width: 1px;
            border-color: var(--color-primary);
            border-right-color: transparent;
            background: color-mix(in srgb, var(--color-primary) 20%, transparent);
        }

        .cui-date-range-day.range-end {
            border-right-width: 1px;
            border-color: var(--color-primary);
            border-left-color: transparent;
            background: color-mix(in srgb, var(--color-primary) 20%, transparent);
        }

        .cui-date-range-day.range-mid {
            border-top-color: var(--color-primary);
            border-bottom-color: var(--color-primary);
            background: color-mix(in srgb, var(--color-primary) 10%, transparent);
        }
        /* Start and end on the same day: full border */
        .cui-date-range-day.range-start.range-end {
            border-color: var(--color-primary);
        }

    @supports(position-anchor: --anchor) {
        .cui-date-range .cui-date-range-popup {
            position: fixed;
            top: anchor(bottom);
            left: anchor(left);
            position-try-fallbacks: flip-block;
        }
    }
</style>
