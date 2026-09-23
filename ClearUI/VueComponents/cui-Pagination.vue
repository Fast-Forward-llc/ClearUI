<!--
Copyright (c) Fast Forward, LLC. All rights reserved.
Licensed under the MIT License. See LICENSE file in the project root for full license information.
-->
<template>
    <slot>
        <nav class="cui-pagination" role="navigation" aria-label="Pagination">
            <button type="button"
                    class="page-btn prev-btn"
                    :disabled="currentPage <= 1"
                    @click="goToPage(currentPage - 1)">
                Prev
            </button>

            <template v-for="(item, index) in pageItems" :key="index">
                <span v-if="item === ellipsis" class="page-ellipsis">&hellip;</span>
                <button v-else
                        type="button"
                        class="page-btn page-number"
                        :class="{ active: item === currentPage }"
                        :aria-current="item === currentPage ? 'page' : null"
                        @click="goToPage(item)">
                    {{ item }}
                </button>
            </template>

            <button type="button"
                    class="page-btn next-btn"
                    :disabled="currentPage >= maxPage"
                    @click="goToPage(currentPage + 1)">
                Next
            </button>
        </nav>
    </slot>
</template>
<script>
    const ellipsis = '...';

    export default {
        props: {
            pageNo: { type: Number, default: 1 },
            itemsPerPage: { type: Number, required: true },
            itemCount: { type: Number, required: true },
            navButtonCount: { type: Number, default: 5 },
        },
        emits: ['update:page-no'],
        data() {
            return {
                ellipsis,
            };
        },
        watch: {
            maxPage(newVal) {
                if (this.pageNo > newVal) {
                    this.$emit('update:page-no', newVal);
                } else if (this.pageNo < 1) {
                    this.$emit('update:page-no', 1);
                }
            },
        },
        computed: {
            maxPage() {
                return Math.max(1, Math.ceil(this.itemCount / this.itemsPerPage));
            },
            currentPage() {
                let page = this.pageNo ?? 1;
                if (page < 1) page = 1;
                if (page > this.maxPage) page = this.maxPage;
                return page;
            },
            minNumButtons() {
                return Math.max(5, this.navButtonCount);
            },
            pageItems() {
                let maxPage = this.maxPage;
                let navButtonCount = Math.min(this.minNumButtons, maxPage);

                if (maxPage <= navButtonCount) {
                    let items = [];
                    for (let i = 1; i <= maxPage; i++) items.push(i);
                    return items;
                }

                let middleCount = navButtonCount - 2;
                let half = Math.floor(middleCount / 2);
                let start = this.currentPage - half;
                let end = this.currentPage + (middleCount - half - 1);

                if (start < 2) {
                    end += (2 - start);
                    start = 2;
                }
                if (end > maxPage - 1) {
                    start -= (end - (maxPage - 1));
                    end = maxPage - 1;
                }
                start = Math.max(2, start);
                end = Math.min(maxPage - 1, end);

                let items = [1];

                if (start > 2) items.push(ellipsis);

                for (let i = start; i <= end; i++) items.push(i);

                if (end < maxPage - 1) items.push(ellipsis);

                items.push(maxPage);

                return items;
            },
        },
        methods: {
            goToPage(page) {
                if (page < 1 || page > this.maxPage || page === this.currentPage) return;
                this.$emit('update:page-no', page);
            },
        },
    };
</script>
<style>
    .cui-pagination {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 0.25rem;
    }

    .cui-pagination .page-btn {
        min-width: 2rem;
        padding: 0.25rem 0.5rem;
        border: var(--ctrl-borders);
        background: var(--color-ctrl-background);
        color: var(--color-text);
        cursor: pointer;
    }

    .cui-pagination .page-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .cui-pagination .page-btn.active {
        background: var(--color-primary);
        color: #ffffff;
        font-weight: bold;
    }

    .cui-pagination .page-ellipsis {
        padding: 0 0.25rem;
    }
</style>
