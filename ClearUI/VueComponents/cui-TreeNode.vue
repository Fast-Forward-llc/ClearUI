<!--
Copyright (c) Fast Forward, LLC. All rights reserved.
Licensed under the MIT License. See LICENSE file in the project root for full license information.
-->
<template>
    <div role="treeitem" :type="listItemType(item)" v-bind="$attrs"
         v-bind:class="{'selected' : selected,'hasChildNodes':HasChildNodes, expanded:IsExpanded, partial:NotAllChildrenSelected}"
         v-bind:tabindex="-1"
         v-bind:aria-label="listItemText(item)"
         v-bind:aria-selected="selected"
         v-on:click="(evt)=>this.$emit('click',evt,this.item,this.options)"
         :data-depth="depth"
         :data-node-id="item.__nodeId">
        <slot :item="item" :itemText="listItemText(item)" :HasChildNodes="HasChildNodes" :selected="selected" :selectable="selectable"
              :onExpand="onExpandClick" :onSelect="onSelectClick">
            <div v-if="selectable" class="selector" v-on:click="onSelectClick"></div>
            <div class="item" v-on:dblclick="onExpandClick">
                {{listItemText(item)}}
            </div>
        </slot>
    </div>
    <div v-if="HasChildNodes" :class="{expanded:IsExpanded}" v-bind:aria-label="listItemText(item)" role="group">
        <cui-tree-node v-for="i in ChildNodes"
                    :item="i"
                    :text-field="textField"
                    :value-field="valueField"
                    :type-field="typeField"
                    :child-nodes-field="childNodesField"
                    :selected="isChildSelected(i)"
                    :selectable="selectable"
                    :selected-values="selectedValues"
                    :collapsible="collapsible"
                    :depth="depth+1"
                    v-on:select="(e,i2,options)=>this.$emit('select',e,i2,options)"
                    v-on:expanded="(e,i2,options)=>this.$emit('expanded', e, i2,options)"
                    v-on:click="(e,i2,options)=>this.$emit('click',e,i2,options)">
            <template #default="node">
                <slot name="default" v-bind="node || {}" />
            </template>
        </cui-tree-node>
    </div>
</template>
<script>
    export default {
        emits: ['click', 'expanded', 'select', 'update:is-expanded'],
        props: {
            item: null,
            textField: null,
            valueField: null,
            typeField: null,
            childNodesField: null,
            selected: { default: false, type: Boolean },
            selectable: { default: true, type: Boolean },
            selectedValues: { default: [], type: Array },
            isExpanded: { default: false, type: Boolean },
            collapsible: { default: true, type: Boolean },
            depth: { default: 1, type: Number }
        },
        methods: {
            listItemText: function (item) {
                if (item == null) return '';
                return this.textField == null ? item : item[this.textField];
            },
            listItemValue: function (item) {
                if (item == null) return null;
                return this.valueField == null ? item : item[this.valueField];
            },
            listItemType: function (item) {
                if (item == null) return null;
                return this.typeField == null ? null : item[this.typeField];
            },
            isChildSelected: function (item) {
                if (!this.HasChildNodes) return false;
                return this.selectedValues?.indexOf(this.listItemValue(item)) >= 0;
            },
            notAllChildNodesSelected(ChildNodes) {
                let result = false;
                if (ChildNodes == null || ChildNodes.length == 0) return result;
                for (let i of ChildNodes) {
                    if (!this.isChildSelected(i)) {
                        result = true;
                        break;
                    }
                    else
                        if (this.notAllChildNodesSelected(this._childNodes(i))) return true;
                }
                return result;
            },
            _childNodes(item) {
                if (item == null || item[this.childNodesField] == null) return null;
                return item[this.childNodesField]
            },
            onSelectClick(evt) {
                this.$emit('select', evt, this.item, this.options)
            },
            onExpandClick(evt) {
                if (!this.collapsible) return;
                this.item.__expanded = !this.item.__expanded;
                this.$emit('update:is-expanded', this.item.__expanded);
                this.$emit('expanded', evt, this.item, this.options);
            },
        },
        computed: {
            IsExpanded: {
                get() {
                    if (!this.collapsible) return true
                    if (this.item == null) return false;
                    return this.item.__expanded;
                },
                set(val) {
                    if (!this.collapsible) return;
                    if (this.item == null) return;
                    this.item.__expanded = val;
                }
            },
            HasChildNodes() {
                if (!this.item) return false;
                if (!this.item.__nodeId) this.item.__nodeId = '_' + nodeId++; //fail safe for dynamicly added nodes
                if (!this.childNodesField || this.childNodesField.toString().trim() == '') return false;
                if (this.item[this.childNodesField] == null || this.item[this.childNodesField]?.length == 0) return false;
                return true;
            },
            ChildNodes() {
                if (!this.HasChildNodes) return null;
                return this._childNodes(this.item);
            },
            NotAllChildrenSelected() {
                return this.notAllChildNodesSelected(this.ChildNodes);
            },
            options() {
                return {
                    textField: this.textField,
                    valueField: this.valueField,
                    childNodesField: this.childNodesField,
                    isExpanded: this.item.__expanded,
                    collapsible: this.collapsible,
                    selected: this.selected,
                }
            }
        },
        watch: {
            isExpanded(newVal) {
                if (this.item) this.item.__expanded = newVal;
            },
        },
        created() {
            if (this.item) {
                this.item.__expanded = this.isExpanded;
                if (this.item.__nodeId == null) this.item.__nodeId = '_' + nodeId++;
            }
        }
    }
    let nodeCount = 0;
    let nodeId = 0;
</script>