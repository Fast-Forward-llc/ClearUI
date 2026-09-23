<!--
Copyright (c) Fast Forward, LLC. All rights reserved.
Licensed under the MIT License. See LICENSE file in the project root for full license information.
-->
<template>
    <tr v-if="position == thead" :data-position="position">
        <slot :item="gridItem" :columns="gridContext.columns" :filterBy="gridContext.filterBy" :sortBy="gridContext.sortBy">
            <th v-for="(col, colIndex) in gridContext.columns" :key="colIndex">{{ gridItem?.[col.column] }}</th>
        </slot>
    </tr>
    <tr v-if="(position == null || position == tbody) && gridItem" :data-position="position">
        <slot :item="gridItem" :columns="gridContext.columns" :filterBy="gridContext.filterBy" :sortBy="gridContext.sortBy">
            <td v-for="(col, colIndex) in gridContext.columns" :key="colIndex">{{ gridItem?.[col.column] }}</td>
        </slot>
    </tr>
</template>
<script>
    const tbody = "tbody";
    const thead = "thead";
    import { inject } from 'vue';
    import { constants } from '../js/Common.js'
    export default {
        props: {
            position: { default: "tbody", type: String },
            gridItem: null,
        },
        data() {
            return {
                gridContext: null,
            }
        },
        setup() {
            return {
                thead: thead,
                tbody: tbody,
            }
        },
        method: {
            colScope(idx) {
                if (this.scope == null) return null;
                let s = this.scope?.toLowerCase();
                if ( s == 'col' || s.startsWith('col|') || s.endsWith('|col')) return true;
                return false;
            },
            rowScope(idx) {
                if (this.scope == null) return null;
                let s = this.scope?.toLowerCase();
                if (s == 'col' || s.startsWith('col|') || s.endsWith('|col')) return true;
                return false;
            }
        },
        created() {
            this.gridContext = inject(constants.GridContext);
        }
    };</script>