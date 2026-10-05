<!--
Copyright (c) Fast Forward, LLC. All rights reserved.
Licensed under the MIT License. See LICENSE file in the project root for full license information.
-->
<template>
    <slot></slot>
</template>

<script>
    import { deepCopy } from '../js/Common.js';

    export default {
        props: {
            srcDataset: { type: Array, default: () => [] },
            filterBy: { type: Object, default: () => ({}) },
            sortBy: { type: Object, default: () => ({}) },
            pageNo: { type: Number, default: 100 },
            itemsPerPage: { type: Number, required: false },
            debounceMs: { type: Number, default: 0 },
        },
        emits: ['update:fsp-dataset', 'update:filtered-item-count'],
        data() {
            return {
                updatePending: false,
                debounceTimer: null,
                internalFilterBy: deepCopy(this.filterBy),
                internalSortBy: deepCopy(this.sortBy),
                internalPageNo: this.pageNo,
                internalItemsPerPage: this.itemsPerPage,
            };
        },
        watch: {
            srcDataset: { handler() { this.scheduleUpdate(); }, deep: false },
            filterBy: { handler() { this.scheduleDebounce(); }, deep: true },
            sortBy: { handler() { this.scheduleDebounce(); }, deep: true },
            pageNo() { this.scheduleDebounce(); },
            itemsPerPage() { this.scheduleDebounce(); },
        },
        methods: {
            scheduleUpdate() {
                if (this.updatePending) return;
                this.updatePending = true;
                this.$nextTick(() => {
                    this.updatePending = false;
                    this.process();
                });
            },
            scheduleDebounce() {
                if (this.debounceTimer) clearTimeout(this.debounceTimer);
                this.debounceTimer = setTimeout(() => {
                    this.debounceTimer = null;
                    this.applyChanges();
                }, this.debounceMs);
            },
            applyChanges() {
                this.internalFilterBy = deepCopy(this.filterBy);
                this.internalSortBy = deepCopy(this.sortBy);
                this.internalPageNo = this.pageNo;
                this.internalItemsPerPage = this.itemsPerPage;
                this.scheduleUpdate();
            },
            filterDataset(dataset) {
                let filterKeys = Object.keys(this.internalFilterBy || {}).filter(k => this.internalFilterBy[k] !== null && this.internalFilterBy[k] !== undefined && this.internalFilterBy[k] !== '');
                if (filterKeys.length === 0) return dataset.slice();

                return dataset.filter(item => {
                    return filterKeys.every(key => {
                        let filterValue = String(this.internalFilterBy[key]).toLowerCase();
                        let itemValue = item[key];
                        if (itemValue === null || itemValue === undefined) return false;
                        return String(itemValue).toLowerCase().startsWith(filterValue);
                    });
                });
            },
            sortDataset(dataset) {
                let sortKeys = Object.keys(this.internalSortBy || {}).filter(k => this.internalSortBy[k] === 'asc' || this.internalSortBy[k] === 'desc');
                if (sortKeys.length === 0) return dataset.slice();

                let result = dataset.slice();
                result.sort((a, b) => {
                    for (let key of sortKeys) {
                        let direction = this.internalSortBy[key] === 'desc' ? -1 : 1;
                        let aValue = a[key];
                        let bValue = b[key];
                        if (aValue === bValue) continue;
                        if (aValue === null || aValue === undefined) return 1 * direction;
                        if (bValue === null || bValue === undefined) return -1 * direction;
                        if (aValue < bValue) return -1 * direction;
                        if (aValue > bValue) return 1 * direction;
                    }
                    return 0;
                });
                return result;
            },
            paginateDataset(dataset) {
                if (!this.internalItemsPerPage || this.internalItemsPerPage <= 0) return dataset.slice();

                let pageNo = this.internalPageNo && this.internalPageNo > 0 ? this.internalPageNo : 1;
                let startIndex = (pageNo - 1) * this.internalItemsPerPage;
                return dataset.slice(startIndex, startIndex + this.internalItemsPerPage);
            },
            process() {
                let workingSet = [];
                if (this.srcDataset?.length > 0) {
                    workingSet = this.filterDataset(this.srcDataset);
                    this.$emit('update:filtered-item-count', workingSet.length);
                    workingSet = this.sortDataset(workingSet);
                    workingSet = this.paginateDataset(workingSet);
                } else {
                    this.$emit('update:filtered-item-count', 0);
                }
                this.$emit('update:fsp-dataset', workingSet);
            }
        },
        created() {
            this.scheduleUpdate();
        },
        beforeUnmount() {
            if (this.debounceTimer) clearTimeout(this.debounceTimer);
        },
    };
</script>

