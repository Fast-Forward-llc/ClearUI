<!--
Copyright (c) Fast Forward, LLC. All rights reserved.
Licensed under the MIT License. See LICENSE file in the project root for full license information.
-->
<template>
    <div ref="component" class="cui cui-tabbed" v-bind:class="{disabled:disabled, readonly:readonly}">
        <div class="tab-list" role="tablist" :aria-orientation="orientation">
            <div class="tab" v-for="(item, idx) in internalList" :key="tabId(item,idx)">
                <button 
                        type="button"
                        role="tab"
                        :id="tabId(item,idx)"
                        class="tab-trigger"
                        :aria-selected="isSelected(idx)"
                        :aria-controls="panelId(item,idx)"
                        :disabled="disabled || readonly"
                        :tabindex="isSelected(idx) ? (disabled ? -1 : 0) : -1"
                        @click="select(idx)"
                        @keydown="(e)=>onKeydown(e,idx)">
                    <span class="tab-title">{{ listItemText(item) }}</span>
                </button>
                <div class="tab-bottom"></div>
            </div>
        </div>
        <div v-for="(item, idx) in internalList"
             :key="'panel-'+panelId(item,idx)"
             :id="panelId(item,idx)"
             class="tab-panel"
             role="tabpanel"
             tabindex="0"
             :aria-labelledby="tabId(item,idx)"
             v-show="isSelected(idx)">
            <slot :name="slotName(item)" :item="item" :index="idx" :selected="isSelected(idx)">
                {{ listItemText(item) }}
            </slot>
        </div>
        <div v-if="!internalList || internalList.length==0" class="no-items">{{noItemsMsg}}</div>
    </div>
</template>

<script>
    export default {
        props: {
            listItems: { type: Array, default: () => [] },
            textField: { type: String },
            valueField: { type: String },
            orientation: { type: String, default: 'horizontal', validator: (v) => v === 'horizontal' || v === 'vertical' },
            modelValue: null, // selected tab value (or index-derived value)
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
                selectedIdx: 0,
            };
        },
        watch: {
            listItems: {
                handler(newVal) {
                    this.internalList = newVal ?? [];
                    this.selectedIdx = this.valueToIndex(this.modelValue);
                },
                immediate: true
            },
            modelValue: {
                handler(newVal) {
                    this.selectedIdx = this.valueToIndex(newVal);
                },
                immediate: true
            },
        },
        methods: {
            listItemValue(item) {
                if (!this.valueField) return item;
                if (item instanceof Object && Object.prototype.hasOwnProperty.call(item, this.valueField)) return item[this.valueField];
                return item;
            },
            valueToIndex(val) {
                if (val == null) return 0;
                let idx = this.internalList.findIndex(i => this.listItemValue(i) === val);
                return idx >= 0 ? idx : 0;
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
            tabId(item, idx) {
                return this.Id + '-tab-' + idx;
            },
            isSelected(idx) {
                return this.selectedIdx === idx;
            },
            select(idx) {
                if (this.disabled || this.readonly) return;
                if (this.selectedIdx === idx) return;
                this.selectedIdx = idx;
                let emitValue = this.listItemValue(this.internalList[idx]);
                this.$emit('update:model-value', emitValue);
                this.$emit('change', emitValue);
            },
            focusTab(idx) {
                let el = this.$refs.component?.querySelector('#' + CSS.escape(this.tabId(this.internalList[idx], idx)));
                if (el) el.focus();
            },
            onKeydown(e, idx) {
                const count = this.internalList.length;
                const nextKey = this.orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight';
                const prevKey = this.orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft';
                switch (e.key) {
                    case nextKey: {
                        e.preventDefault();
                        let next = (idx + 1) % count;
                        this.focusTab(next);
                        this.select(next);
                        break;
                    }
                    case prevKey: {
                        e.preventDefault();
                        let prev = (idx - 1 + count) % count;
                        this.focusTab(prev);
                        this.select(prev);
                        break;
                    }
                    case 'Home':
                        e.preventDefault();
                        this.focusTab(0);
                        this.select(0);
                        break;
                    case 'End':
                        e.preventDefault();
                        this.focusTab(count - 1);
                        this.select(count - 1);
                        break;
                }
            },
        },
        created() {
            this.Id = !this.id ? 'tabbed' + cnt++ : this.id;
        },
    };
    let cnt = 0;
</script>

<style>
    .cui-tabbed {
        width: auto;
    }
        .cui-tabbed:has(.tab-list[aria-orientation="vertical"]) {
            display:flex;
        }

        .cui-tabbed .tab-list {
            display: flex;
            flex-direction: row;
        }

            .cui-tabbed .tab-list[aria-orientation="vertical"] {
                flex-direction: column;
            }

        .cui-tabbed .tab { position:relative; margin-right:2px;}
        .cui-tabbed .tab-bottom {
            position: absolute;
            bottom: -1px;
            border-bottom: none;
            width: calc(100% - 2px);
            left: 1px;
        }
        .cui-tabbed .tab-trigger[aria-selected="true"] + .tab-bottom {
            border-bottom: 2px solid var(--color-selected-tab-background);
        }

        .cui-tabbed .tab-trigger {
            padding: 8px 12px;
            border: var(--ctrl-borders);
            border-bottom: none;
            background: var(--color-tab-background);
            cursor: pointer;
            font: inherit;
            border-radius: 7px 7px 0 0;
        }

            .cui-tabbed .tab-list[aria-orientation="horizontal"] .tab-trigger + .tab-trigger {
                border-left: none;
            }

        .cui-tabbed .tab-list[aria-orientation="vertical"] .tab-trigger {
            width: 100%;
            border: var(--ctrl-borders);
            border-radius: 7px 0 0 7px;
        }
            .cui-tabbed .tab-list[aria-orientation="vertical"] .tab-bottom {
                right: -1px;
                left: unset;
                bottom: unset;
                width: auto;
                height: calc(100% - 2px);
                border-right: none;
                top: 1px;
            }
        .cui-tabbed .tab-list[aria-orientation="vertical"] .tab-trigger[aria-selected="true"] + .tab-bottom {
            border-right: 2px solid var(--color-selected-tab-background);
        }
        .cui-tabbed .tab-list[aria-orientation="vertical"] .tab {
            margin-right: 0;
        }

                .cui-tabbed .tab-list[aria-orientation="vertical"] .tab-trigger + .tab-trigger {
                    border-top: none;
                }

        .cui-tabbed .tab-trigger:disabled {
            cursor: default;
            opacity: 0.6;
        }

        .cui-tabbed .tab-trigger[aria-selected="true"] {
            background: var(--color-selected-tab-background);
            font-weight: 500;
        }

        .cui-tabbed .tab-panel {
            padding: 12px;
            border: var(--ctrl-borders);
            background-color: var(--color-tab-panel-background);
        }

        .cui-tabbed .tab-list[aria-orientation="vertical"] ~ .tab-panel {
            flex-grow:1;
        }

        .cui-tabbed .no-items {
            padding: 8px 12px;
            color: #666;
        }
</style>
