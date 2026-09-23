<!--
Copyright (c) Fast Forward, LLC. All rights reserved.
Licensed under the MIT License. See LICENSE file in the project root for full license information.
-->
<template>
    <tr>
        <slot :columns="gridContext.columns" :filterBy="gridContext.filterBy" :sortBy="gridContext.sortBy" :multiSort="multiSort">
        <cui-grid-hdr-cell v-for="(col, colIndex) in gridContext.columns" :key="colIndex"
                           :title="col.title" 
                           :column="col.column" 
                           :filter="col.filter" 
                           :sort="col.sort"
                           :multi-sort="multiSort"
                           scope="col">
        </cui-grid-hdr-cell>
        </slot>
    </tr>
</template>
<script>
    import { inject } from 'vue';
    import { constants } from '../js/Common.js'
    export default {
        props: {
            multiSort: { type: Boolean, default: false },
        },
        data() {
            return {
                gridContext: null,
            }
        },
        created() {
            this.gridContext = inject(constants.GridContext);
        }
    };
</script>