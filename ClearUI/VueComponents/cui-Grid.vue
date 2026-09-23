<!--
Copyright (c) Fast Forward, LLC. All rights reserved.
Licensed under the MIT License. See LICENSE file in the project root for full license information.
-->
<template>
    <div>
        <table ref="table" :id="Id" class="cui-grid" v-bind="$attrs">
            <caption v-if="caption||$slots.caption">
                <slot name="caption">
                    {{caption}}
                </slot>
            </caption>
            <thead v-if="!headless">
                <slot name="thead" :items="gridItems" :columns="gridContext.columns" :position="thead">
                    <cui-grid-hdr-row></cui-grid-hdr-row>
                </slot>
                <slot name="thead2" :position="thead">
                </slot>
            </thead>
            <tfoot v-if="$slots.tfoot">
                <slot name="tfoot" :items="gridItems" :columns="gridContext.columns" :position="tfoot">
                </slot>
            </tfoot>
            <tbody>
                <slot name="tbody-empty" v-if="gridItems==null||gridItems.length==0" :position="tbody">
                    <tr><td colspan="99">{{noDataMsg}}</td></tr>
                </slot>
                <slot name="tbody" :items="gridItems" :columns="gridContext.columns" :position="tbody">
                    <cui-grid-row v-for="i, rowIndex in gridItems" :grid-item="i" :key="rowIndex"></cui-grid-row>
                </slot>
            </tbody>
        </table>
        <slot name="errors"></slot>
        <slot name="components" :items="gridItems" :columns="gridContext.columns" :filterBy="gridContext.filterBy" :sortBy="gridContext.sortBy" ></slot>
    </div>
</template>

<script>
    const tbody = "tbody";
    const thead = "thead";
    const tfoot = "tfoot";
    import { provide, ref } from 'vue';
    export default {
        props: {
            caption: { type: String, required: false },
            gridItems: { type: Array, default: () => [] },
            columnConfig: { type: Array, required: false },
            headless: { type: Boolean, default: false },
            noDataMsg: { type: String, default: 'No data available' },
        },
        emits: [],
        data() {
            return {
                Id: this.id ?? `grid${idCnt++}`,
                autoColumns: true,
            };
        },
        setup() {
            return {
                gridContext: ref({
                    id: null,
                    columns: [],
                    filterBy: {},
                    sortBy: { },
                    initColumnMap: null,
                }),
                thead: thead,
                tbody: tbody,
                tfoot: tfoot, 
            }
        },
        watch: {
            columnNames(newVal) {
                this.gridContext.columns = newVal;
            },
            gridItems: {
                handler(newVal) {
                    if (!this.columnConfig && !this.gridContext.initColumnMap) this.autoGenerateColumnNames(newVal);
                },
                immediate: true
            }
        },
        methods: {
            initGridContext(context) {
                context.id = this.Id;
                if (this.columnConfig) context.columns = this.columnConfig;
                context.initColumnMap = context.initColumnMap ?? new Array(context.columns.length).fill(false);
            },
            breakpoint() {
                console.log('Grid.filterBy:', this.filterByFields);
            },
            titleCase(str) {
                return str.replace(/(?!^)([A-Z])(?!\s)/g, ' $1');
            },
            autoGenerateColumnNames(items) {
                if (this.columnNames && this.columnNames?.length > 0) return;
                this.autoColumns = true;
                this.gridContext.columns = [];
                if (items && items.length > 0) {
                    Object.keys(items[0]).forEach((x, idx) => this.gridContext.columns[idx] = { column: x, title: this.titleCase(x) });
                }
            },
        },
        created() {
            this.initGridContext(this.gridContext);
            provide('_GridContext_', this.gridContext);
        },
    };
    let idCnt = 0;
</script>
