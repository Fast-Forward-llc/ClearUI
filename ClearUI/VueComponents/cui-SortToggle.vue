<!--
Copyright (c) Fast Forward, LLC. All rights reserved.
Licensed under the MIT License. See LICENSE file in the project root for full license information.
-->
<template>
    <span class="cui-sort-toggle">
        <span class="symbols sort-arrow sort-arrow-up"
              :class="{ active: sortBy[column] === 'asc' }"
              :aria-checked="sortDir == 'asc'"
              :tabindex="sortDir == 'asc' ? tabindex : -1"
              :aria-label="!cellElement ? sortAscLabel : null"
              @click.prevent.stop="onUpClick"
              @keydown.space.prevent="onUpClick"
              @keydown.enter.prevent="onUpClick"></span>
        <span class="symbols sort-arrow sort-arrow-down"
              :class="{ active: sortBy[column] === 'desc' }"
              :aria-checked="sortDir == 'desc'"
              :tabindex="sortDir == 'desc' ? tabindex : -1"
              :aria-label="!cellElement ? sortDscLabel : null"
              @click.prevent.stop="onDownClick"
              @keydown.space.prevent="onDownClick"
              @keydown.enter.prevent="onDownClick"></span>
    </span>
</template>
<script>
    export default {
        props: {
            column: { type: String, required: true },
            sortBy: { type: Object, default: () => ({})},
            multiSort: { type: Boolean, default: false },
            tabindex: { type: Number, default: -1 },
        },
        emits: ['change'],
        data() {
            return {
                cellElement: null,
                xcellElement: null,
            };
        },
        setup() {
            return {
                sortAscLabel: "Sort ascending",
                sortDscLabel: "Sort descending",
            }
        },
        methods: {
            dispatchChange() {
                this.$el.dispatchEvent(new Event('change', { bubbles: true }));
                this.$emit('change', this.sortDesc);
            },
            applySort(value) {
                if (!this.multiSort) {
                    Object.keys(this.sortBy).forEach(key => {
                        if (key !== this.column) delete this.sortBy[key];
                    });
                }
                if (value) this.sortBy[this.column] = value;
                else delete this.sortBy[this.column];
            },
            onUpClick() {
                this.applySort(this.sortBy[this.column] === 'asc' ? null : 'asc');
                this.dispatchChange();
            },
            onDownClick() {
                this.applySort(this.sortBy[this.column] === 'desc' ? null : 'desc');
                this.dispatchChange();
            },
            onCellClick(event) {
                //if (event.target !== this.cellElement) return;
                let current = this.sortBy[this.column];
                let next = current === 'asc' ? 'desc' : current === 'desc' ? null : 'asc';
                this.applySort(next);
                this.dispatchChange();
            },
        },
        computed: {
            sortDesc() {
                if (this.sortBy?.[this.column] == null) return "none";
                if (this.sortBy?.[this.column] == 'asc') return "ascending";
                return "descending";
            },
            sortDir() {
                return this.sortBy?.[this.column];
            }
        },
        mounted() {
            let parent = this.$el.closest("td, th");
            if (parent) {
                this.cellElement = parent;
                this.cellElement.addEventListener('click', this.onCellClick);
            }
        },
        beforeUnmount() {
            if (this.cellElement) {
                this.cellElement.removeEventListener('click', this.onCellClick);
            }
        },

    };
</script>
<style>
    .cui-sort-toggle {
        display: inline-flex;
        flex-direction: column;
        vertical-align: middle;
    }

    .cui-sort-toggle .sort-arrow {
        cursor: pointer;
        font-size: 1.2rem;
        line-height: 0.6;
    }

    .cui-sort-toggle .sort-arrow-up::before {
        content: "\e5c7";
    }

    .cui-sort-toggle .sort-arrow-down::before {
        content: "\e5c5";
    }

    .cui-sort-toggle .sort-arrow.active {
        color: var(--color-primary);
    }
</style>
