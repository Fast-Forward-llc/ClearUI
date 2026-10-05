<!--
Copyright (c) Fast Forward, LLC. All rights reserved.
Licensed under the MIT License. See LICENSE file in the project root for full license information.
-->
<template>
    <slot :pageNo="internalPageNo"
          :itemsPerPage="internalItemsPerPage"
          :sortBy="internalSortBy"
          :filterBy="internalFilterBy"
          :asParams="AsParams",
          :asJson="AsJson">
    </slot>
</template>

<script>
    import { deepCopy } from '../js/Common.js';

    export default {
        props: {
            pageNo: { type: Number, default: 1 },
            itemsPerPage: { type: Number, required: false },
            sortBy: { type: Object, default: () => ({}) },
            filterBy: { type: Object, default: () => ({}) },
            debounceMs: { type: Number, default: 300 },
        },
        emits: ['change'],
        data() {
            return {
                internalPageNo: this.pageNo,
                internalItemsPerPage: this.itemsPerPage,
                internalSortBy: deepCopy(this.sortBy),
                internalFilterBy: deepCopy(this.filterBy),
                debounceTimer: null,
            };
        },
        watch: {
            pageNo() { this.scheduleDebounce(); },
            itemsPerPage() { this.scheduleDebounce(); },
            sortBy: { handler() { this.scheduleDebounce(); }, deep: true },
            filterBy: { handler() { this.scheduleDebounce(); }, deep: true },
        },
        methods: {
            scheduleDebounce() {
                if (this.debounceTimer) clearTimeout(this.debounceTimer);
                this.debounceTimer = setTimeout(() => {
                    this.debounceTimer = null;
                    this.applyChanges();
                }, this.debounceMs);
            },
            applyChanges() {
                this.internalPageNo = this.pageNo;
                this.internalItemsPerPage = this.itemsPerPage;
                this.internalSortBy = deepCopy(this.sortBy);
                this.internalFilterBy = deepCopy(this.filterBy);
                this.$emit('change', this.AsJson);
            },
        },
        computed: {
            AsParams() {
                return {
                    pageNo: this.internalPageNo,
                    itemsPerPage: this.internalItemsPerPage,
                    sortBy: this.internalSortBy != null ? JSON.stringify(this.internalSortBy) : null,
                    filterBy: this.internalFilterBy != null ? JSON.stringify(this.internalFilterBy) : null,
                }
            },
            AsJson() {
                return {
                    pageNo: this.internalPageNo,
                    itemsPerPage: this.internalItemsPerPage,
                    sortBy: this.internalSortBy,
                    filterBy: this.internalFilterBy,
                }
            }
        },
        beforeUnmount() {
            if (this.debounceTimer) clearTimeout(this.debounceTimer);
        },
    };
</script>
