<!--
Copyright (c) Fast Forward, LLC. All rights reserved.
Licensed under the MIT License. See LICENSE file in the project root for full license information.
-->
<template>
    <th cui-grid-cell ref="th" :scope="scope" :aria-sort="thisCell?.sort ? sortDesc : null">
    <div :class="{sortWrap:thisCell?.sort}">
        <button v-if="thisCell?.sort" class="cellSortBtn"><slot>{{thisCell?.title}}</slot></button>
        <slot v-else>{{thisCell?.title}}</slot>
        <cui-sort-toggle v-if="thisCell?.sort" :column="thisCell?.column" v-model:sort-by="gridContext.sortBy" v-on:change="sortDesc = $event" :multi-sort="x_multiSort"></cui-sort-toggle>
    </div>
    </th>
</template>
<script>
    import { inject } from 'vue';
    import { constants } from '../js/Common.js'
    export default {
        props: {
            title: { type: String, required: false },
            column: { type: String, required: true },
            filter: { type: Boolean, default: false },
            sort: { type: Boolean, default: false },
            scope: null,
            tabindex: { type: Number, default: 0 },
            multiSort: { type: Boolean, default: false },
        },
        emits: [],
        data() {
            return {
                thisCell: {},
                gridContext: null,
                sortDesc: 'none',
                x_multiSort: false,
            };
        },
        watch: {
            title: { handler() { this.$nextTick(this.updateThisCell); }, immediate: true },
            column: { handler() { this.$nextTick(this.updateThisCell); }, immediate: true },
            filter: { handler() { this.$nextTick(this.updateThisCell); }, immediate: true },
            sort: { handler() { this.$nextTick(this.updateThisCell); }, immediate: true },
            multiSort: { handler(newVal) { this.x_multiSort = newVal; }, immediate: true },
        },
        computed: {
            Title() { return this.title ?? this.mySlotText; }
        },
        methods: {
            updateThisCell() {
                this.thisCell.title = this.Title;
                this.thisCell.column = this.column;
                this.thisCell.enableSort = this.sort;
                this.thisCell.filter = this.filter;
                this.thisCell.sort = this.sort;
            },
            getAllNodeText(node) {

                if (!node) return '';

                // Helper to check if an element is visible
                function isVisible(el) {
                    const style = window.getComputedStyle(el);
                    return style.display !== 'none' &&
                        style.visibility !== 'hidden' &&
                        parseFloat(style.opacity) > 0;
                }

                let combinedText = '';

                // Use TreeWalker to traverse text nodes only
                const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, {
                    acceptNode: (textNode) => {
                        const parent = textNode.parentElement;
                        return parent && isVisible(parent) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
                    }
                });

                while (walker.nextNode()) {
                    combinedText += walker.currentNode.nodeValue.trim() + ' ';
                }

                return combinedText.trim();

            },
        },
        created() {
            this.gridContext = inject(constants.GridContext);
            
        },
        mounted() {
            this.mySlotText = this.getAllNodeText(this.$refs.th);
            if (this.$parent.multiSort) this.x_multiSort = this.$parent.multiSort;
        },

    };
    let cnt = 0;
</script>
<style>
    th button.cellSortBtn {
        background-color: none;
        padding: 0;
        margin: 0;
        outline: none;
        border: none;
        background-color: transparent;
        font-weight: inherit;
        color: inherit;
        flex-grow:1;
        text-align:inherit;
    }
    th:has(button.cellSortBtn):focus-within{
        outline:auto;
    }
    th .sortWrap {
        display:flex;
    }
</style>
