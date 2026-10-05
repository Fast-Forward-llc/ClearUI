<!--
Copyright (c) Fast Forward, LLC. All rights reserved.
Licensed under the MIT License. See LICENSE file in the project root for full license information.
-->
<template>
    <div ref="component" class="cui cui-accordion" v-bind:class="{disabled:disabled, readonly:readonly}">
        <div v-for="(item, idx) in internalList" :key="panelId(item,idx)">
            <component :is="headingTag" class="accordion-header">
                <button type="button"
                        :id="headerId(item,idx)"
                        class="accordion-trigger"
                        :class="'expander-'+expanderPosition"
                        :aria-expanded="isExpanded(item,idx)"
                        :aria-controls="panelId(item,idx)"
                        :disabled="disabled || readonly"
                        :tabindex="disabled ? -1 : 0"
                        @click="toggle(idx)"
                        @keydown="(e)=>onKeydown(e,idx)">
                    <span class="symbols expander" :class="{expanded:isExpanded(item,idx)}"></span>
                    <span class="accordion-title">{{ listItemText(item) }}</span>
                </button>
            </component>
            <Transition name="accordion-panel"
                        @enter="onPanelEnter"
                        @after-enter="onPanelAfterEnter"
                        @leave="onPanelLeave">
                <div v-show="isExpanded(item,idx)"
                     :id="panelId(item,idx)"
                     class="accordion-panel"
                     role="region"
                     :aria-labelledby="headerId(item,idx)">
                    <slot :name="slotName(item)" :item="item" :index="idx" :expanded="isExpanded(item,idx)">
                        {{ listItemText(item) }}
                    </slot>
                </div>
            </Transition>
            <div v-if="!internalList || internalList.length==0" class="no-items">{{noItemsMsg}}</div>
        </div>
    </div>
</template>

<script>
    export default {
        props: {
            listItems: { type: Array, default: () => [] },
            textField: { type: String },
            valueField: { type: String },
            headingTag: { type: String, default: 'h3' },
            expanderPosition: { type: String, default: 'left', validator: (v) => v === 'left' || v === 'right' },
            modelValue: null, // expanded panel index, or array of indexes when multiExpand
            multiExpand: { type: Boolean, default: false },
            disabled: { type: Boolean, default: false },
            readonly: { type: Boolean, default: false },
            noItemsMsg: { type: String, default: 'No items available' },
            id: { type: String },
        },
        emits: ['update:model-value', 'change'],
        data() {
            return {
                Id: null,
                internalList: [],
                expandedIdx: [],
            };
        },
        watch: {
            listItems: {
                handler(newVal) {
                    this.internalList = newVal ?? [];
                    this.expandedIdx = this.valuesToIndexes(this.modelValue);
                },
                immediate: true
            },
            modelValue: {
                handler(newVal) {
                    this.expandedIdx = this.valuesToIndexes(newVal);
                },
                immediate: true
            },
        },
        methods: {
            normalizeModelValue(val) {
                if (val == null) return [];
                if (Array.isArray(val)) return val;
                return [val];
            },
            listItemValue(item) {
                if (!this.valueField) return item;
                if (item instanceof Object && Object.prototype.hasOwnProperty.call(item, this.valueField)) return item[this.valueField];
                return item;
            },
            valuesToIndexes(val) {
                let values = this.normalizeModelValue(val);
                return values
                    .map(v => this.internalList.findIndex(i => this.listItemValue(i) === v))
                    .filter(idx => idx >= 0);
            },
            indexesToValue(indexes) {
                let values = indexes.map(idx => this.listItemValue(this.internalList[idx]));
                return this.multiExpand ? values : (values.length ? values[0] : null);
            },
            listItemText(item) {
                if (item == null) return null;
                if (!(item instanceof Object)) return item;
                return !this.textField ? item : item[this.textField];
            },
            sanitize(text) {
                if (text == null) return '';
                return text.toString().trim().replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase();
            },
            slotName(item) {
                return 'panel-' + this.sanitize(this.listItemText(item));
            },
            panelId(item, idx) {
                return this.Id + '-panel-' + idx;
            },
            headerId(item, idx) {
                return this.Id + '-header-' + idx;
            },
            isExpanded(item, idx) {
                return this.expandedIdx.includes(idx);
            },
            toggle(idx) {
                if (this.disabled || this.readonly) return;
                let newExpanded;
                if (this.multiExpand) {
                    newExpanded = [...this.expandedIdx];
                    let pos = newExpanded.indexOf(idx);
                    if (pos >= 0) newExpanded.splice(pos, 1);
                    else newExpanded.push(idx);
                } else {
                    newExpanded = this.expandedIdx.includes(idx) ? [] : [idx];
                }
                this.expandedIdx = newExpanded;
                let emitValue = this.indexesToValue(newExpanded);
                this.$emit('update:model-value', emitValue);
                this.$emit('change', emitValue);
            },
            focusTrigger(idx) {
                let el = this.$refs.component?.querySelector('#' + CSS.escape(this.headerId(this.internalList[idx], idx)));
                if (el) el.focus();
            },
            onKeydown(e, idx) {
                const count = this.internalList.length;
                switch (e.key) {
                    case 'ArrowDown':
                        e.preventDefault();
                        this.focusTrigger((idx + 1) % count);
                        break;
                    case 'ArrowUp':
                        e.preventDefault();
                        this.focusTrigger((idx - 1 + count) % count);
                        break;
                    case 'Home':
                        e.preventDefault();
                        this.focusTrigger(0);
                        break;
                    case 'End':
                        e.preventDefault();
                        this.focusTrigger(count - 1);
                        break;
                }
            },
            onPanelEnter(el) {
                el.style.height = '0px';
                el.style.overflow = 'hidden';
                // Force reflow so the transition from 0 actually animates.
                void el.offsetHeight;
                el.style.height = el.scrollHeight + 'px';
                el.addEventListener('transitionend', () => {
                    el.style.height = '';
                    el.style.overflow = '';
                }, { once: true });
            },
            onPanelAfterEnter(el) {
                el.style.height = '';
                el.style.overflow = '';
            },
            onPanelLeave(el) {
                el.style.height = el.scrollHeight + 'px';
                el.style.overflow = 'hidden';
                void el.offsetHeight;
                el.style.height = '0px';
            },
        },
        created() {
            this.Id = !this.id ? 'accordion' + cnt++ : this.id;
        },
    };
    let cnt = 0;
</script>

<style>
    .cui-accordion {
        width: auto;
    }

        .cui-accordion .accordion-header {
            margin: 0;
        }

        .cui-accordion .accordion-trigger {
            display: flex;
            align-items: center;
            width: 100%;
            text-align: left;
            padding: 8px 12px;
            border: 1px solid #ccc;
            border-bottom: none;
            background: #fff;
            cursor: pointer;
            font: inherit;
        }

            .cui-accordion .accordion-trigger.expander-right {
                justify-content: space-between;
            }

                .cui-accordion .accordion-trigger.expander-right .expander {
                    order: 1;
                    margin-right: 0;
                    margin-left: 0.5rem;
                }

            .cui-accordion .accordion-header:last-of-type .accordion-trigger {
                border-bottom: 1px solid #ccc;
            }

        .cui-accordion .accordion-trigger:disabled {
            cursor: default;
            opacity: 0.6;
        }

        .cui-accordion .expander {
            margin-right: 0.5rem;
            display: flex;
            align-items: center;
            transition: transform 0.15s ease-in-out;
        }

            .cui-accordion .expander::before {
                content: "\e313";
            }

            .cui-accordion .expander.expanded {
                transform: rotate(180deg);
            }

        .cui-accordion .accordion-panel {
            padding: 12px;
            border: 1px solid #ccc;
            border-top: none;
        }

        .cui-accordion .accordion-panel-enter-active,
        .cui-accordion .accordion-panel-leave-active {
            transition: height 0.2s ease-in-out;
        }

        @media (prefers-reduced-motion: reduce) {
            .cui-accordion .accordion-panel-enter-active,
            .cui-accordion .accordion-panel-leave-active {
                transition: none;
            }
        }

        .cui-accordion .no-items {
            padding: 8px 12px;
            color: #666;
        }
</style>
