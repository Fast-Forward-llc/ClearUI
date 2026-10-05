<!--
Copyright (c) Fast Forward, LLC. All rights reserved.
Licensed under the MIT License. See LICENSE file in the project root for full license information.
-->
<script>
    import { inject } from 'vue';
    import { constants } from '../js/Common.js'
    import GridHdrCell from './cui-GridHdrCell.vue'
    export default {
        extends: GridHdrCell,
        props: {
            //title: { type: String, required: false },
            //column: { type: String, required: true },
            order: { type: Number },
            //filter: { type: Boolean, default: false },
            //sort: { type: Boolean, default: false },
            //scope: null,
            //tabindex: {type:Number, default:0},
        },
        emits: [],
        data() {
            return {
                Order: this.order,
            };
        },
        watch: {
            title() { this.$nextTick(this.updateThisColumn); },
            column() { this.$nextTick(this.updateThisColumn); },
            order() { this.$nextTick(this.updateThisColumn); },
            filter() { this.$nextTick(this.updateThisColumn); },
            sort() { this.$nextTick(this.updateThisColumn); },
        },
        methods: {
            updateThisColumn() {
                this.updateThisCell();
                this.thisCell.order = this.Order;
                this.gridContext.columns[this.Order] = this.thisCell;
            }
        },
        created() {
            this.Order = this.order ?? this.gridContext.initColumnMap.indexOf(false);
            if (this.Order < 0) this.Order = this.gridContext.initColumnMap.length;
            this.gridContext.initColumnMap[this.Order] = true;
        },
        mounted() {
            this.updateThisColumn();
        },

    };
    let cnt = 0;
</script>