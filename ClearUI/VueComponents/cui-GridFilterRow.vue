<!--
Copyright (c) Fast Forward, LLC. All rights reserved.
Licensed under the MIT License. See LICENSE file in the project root for full license information.
-->
<template>
    <tr v-if="position == tbody" class="grid-filter-row">
        <slot :columns="gridContext.columns" :filterBy="gridContext.filterBy" :sortBy="gridContext.sortBy" :filterPlaceholder="filterPlaceholder">
        <td v-for="(c,idx) in gridContext.columns">
            <input v-if="c.filter" type="text" v-model="gridContext.filterBy[c.column]" :placeholder="filterPlaceholder" />
        </td>
        </slot>
    </tr>
    <tr v-if="position == thead" class="grid-filter-row">
        <slot :columns="gridContext.columns" :filterBy="gridContext.filterBy" :sortBy="gridContext.sortBy" :filterPlaceholder="filterPlaceholder">
        <th v-for="(c,idx) in gridContext.columns">
            <input v-if="c.filter" type="text" v-model="gridContext.filterBy[c.column]" :placeholder="filterPlaceholder" />
        </th>
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
            position: {default:"thead", type:String},
            filterPlaceholder: { type: String, default: 'filter' },
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
        created() {
            this.gridContext = inject(constants.GridContext);
        }
    };</script>