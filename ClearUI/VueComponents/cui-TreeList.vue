<!--
Copyright (c) Fast Forward, LLC. All rights reserved.
Licensed under the MIT License. See LICENSE file in the project root for full license information.
-->
<template>
    <div ref="treelist" class="cui cui-treelist" v-bind:class="{'disabled' : disabled, 'readonly': readonly, 'selectable':selectable}">
        <div :id="Id+'-ctrl'" class="treelist-ctrl">
            <div :id="Id+'-label'" class="label" :class="{'required':required}">{{label}}</div>
            <div ref="listbox" class="treelist" :aria-labelledby="Id+'-label'" :tabindex="disabled ? -1 : 0" v-bind="$attrs"
                 v-on:focus="onFocus" v-on:focusout="onFocusOut" v-on:keyup="keyUp" v-on:keydown="keyDown"
                 role="tree" aria-multiselectable="true" :aria-invalid="isInvalid">
                <cui-tree-node v-for="i in listItems"
                               :item="i"
                               :text-field="textField"
                               :value-field="valueField"
                               :type-field="typeField"
                               :selectable-field="selectableField"
                               :child-nodes-field="childNodesField"
                               :selected-values="SelectedValues"
                               :selected="isSelected(i)"
                               :selectable="selectable"
                               :collapsible="collapsible"
                               v-on:select="_selectItemFn"
                               v-on:expanded="onExpand"
                               v-on:click="onClick">
                    <template #default="node">
                        <slot name="default" v-bind="node || {}" />
                    </template>
                </cui-tree-node>
            </div>
            <input type="hidden" :id="Id" :name="inputName" :value="SelectedValues" />
        </div>
        <div class="errors" role="status" :id="this.Id+'_valmsg'">
            <slot name="errors" :id="Id"
                  :selectedValues="this.SelectedValues"
                  :selectedItems="this.SelectedItems"
                  :required="required"
                  :disabled="disabled"
                  :errorMsg="error_msg"
                  :validateTrigger="valTrigger">
                {{error_msg}}
            </slot>
        </div>
        <slot v-if="$slots.default"
              :id="Id"
              :selectedValues="this.SelectedValues"
              :selectedItems="this.SelectedItems"
              :required="required"
              :disabled="disabled"
              :errorMsg="error_msg"
              :validateTrigger="valTrigger">
        </slot>
    </div>
</template>
<script>
    import { deepCopy } from "../js/Common.js";
    import InputComponentBase from '../js/InputComponentBase.js';
    export default {
        extends: InputComponentBase,
        emits: ["update:model-value", "update:selected-items", "update:filtered-list", "blur", "change", "click", "focus", "select", "expanded"],
        props: {
            "id": null,
            "name": null,
            "listItems": null,
            "label": null,
            "valueField": null,
            "textField": null,
            "typeField": null,
            "selectableField": null,
            "childNodesField": null,
            "modelValue": null,
            "invalid": { default: false, type: Boolean },
            "required": { default: false, type: Boolean },
            "disabled": { default: false, type: Boolean },
            "readonly": { default: false, type: Boolean },
            "selectable": { default: false, type: Boolean },
            "cascadeSelect": { default: true, type: Boolean },
            "modelModifiers": null,
            collapsible: { default: true, type: Boolean },
            selectItemFn: { default: null, type: Function },
        },
        data() {
            return {
                Id: null,
                origValue: null,
                currValue: null,
                Expanded: false,
                inputName: null,
                valTrigger: 0,
                lastKey: null,
                lastKeyIdx: -1,
            };
        },
        methods: {
            _selectItemFn(...args) {
                return this.selectItemFn == null ? this.selectItem(...args) : this.selectItemFn(this, ...args);
            },
            emitValue(value) {
                if (this.readonly || this.disabled || !this.selectable) return;
                if (this.modelModifiers?.trim) value = value.trim();
                if (this.modelModifiers?.number) value = parseFloat(value);
                this.$emit('update:model-value', value);
            },
            listItemValue(item) {
                if (item == null) return null;
                return this.valueField == null ? item : item[this.valueField];
            },
            listItemText(item) {
                if (item == null) return '';
                return this.textField == null ? item : item[this.textField];
            },
            listItemSelectable(item) {
                if (item == null) return this.selectable;
                let s = this.selectableField == null ? this.selectable : item[this.selectableField];
                return s == null ? this.selectable : s;
            },
            selectItem(e, item, options) {
                if (this.readonly || this.disabled || !this.selectable || !this.listItemSelectable(item)) return;
                let selected = this.isSelected(item);
                if (!selected) {
                    let values = this.SelectedValues == null ? [] : [...this.SelectedValues];
                    this.cascadeSelectFn(true, item, values);
                    this.SelectedValues = [... new Set([this.listItemValue(item), ...values])];
                }
                else {
                    let values = this.SelectedValues == null ? [] : [...this.SelectedValues];
                    values.splice(values.indexOf(this.listItemValue(item)), 1);
                    this.cascadeSelectFn(false, item, values);
                    this.SelectedValues = [...new Set(values)];
                }
                e = this.updateEventVar(e, item, !selected);

                this.$emit('select', e, options);
                return !selected;
            },
            cascadeSelectFn(select, item, values) {
                let changed = this.cascadeSelectChildren(select, item, values);
                changed = this.cascadeSelectParents(select, item, values) || changed;
                return changed;
            },
            cascadeSelectParents(select, item, values) {
                if (item == null) return false;
                if (!this.cascadeSelect) return false;
                if (this.childNodesField == null || this.childNodesField.trim() == '') return false;
                let parent = this.findParentOf(item, this.listItems);
                if (parent == null) return false;
                if (select) {
                    if (values.indexOf(this.listItemValue(parent)) < 0) {
                        values.push(this.listItemValue(parent));
                        return this.cascadeSelectParents(select, parent, values) || true;
                    }
                } else
                    if (values.indexOf(this.listItemValue(parent)) >= 0) {
                        if (this.hasSelectedChildren(parent, values)) return false;
                        values.splice(values.indexOf(this.listItemValue(parent)), 1);
                        return this.cascadeSelectParents(select, parent, values) || true;
                    }
                return false;
            },
            cascadeSelectChildren(select, item, values) {
                if (!this.cascadeSelect) return false;
                let childNodes = this._childNodes(item);
                if (childNodes == null) return false;
                if (values == null) values = [];
                let changed = false;
                for (let child of childNodes) {
                    if (child == null) continue;
                    if (select) {
                        if (values.indexOf(this.listItemValue(child)) < 0) {
                            values.push(this.listItemValue(child));
                            changed = true;
                        }
                    } else
                        if (values.indexOf(this.listItemValue(child)) >= 0) {
                            values.splice(values.indexOf(this.listItemValue(child)), 1);
                            changed = true;
                        }
                    changed = this.cascadeSelectFn(select, child, values) || changed;
                }
                return changed
            },
            findParentOf(item, tree) {
                if (item == null || tree == null) return null;
                if (this.childNodesField == null || this.childNodesField.trim() == '') return false;
                let parent = tree.find(i => i[this.childNodesField]?.indexOf(item) >= 0);
                if (parent != null) return parent;
                for (let node of tree) {
                    parent = this.findParentOf(item, node[this.childNodesField]);
                    if (parent != null) return parent;
                }
                return null;
            },
            hasSelectedChildren(item, values) {
                if (item == null) return false;
                let childNodes = this._childNodes(item);
                if (childNodes == null || childNodes.length == 0) return false;
                for (let child of childNodes) {
                    if (values.indexOf(this.listItemValue(child)) >= 0) return true;
                }
                return false;
            },
            isSelected(item) {
                if (this.SelectedValues == null) return false;
                return this.SelectedValues.indexOf(this.listItemValue(item)) >= 0;
            },
            updateEventVar(e, item, selected) {
                if (e == null)
                    e = { target: {} };

                e.target.value = this.listItemValue(item);
                e.target.item = item;
                e.target.selected = selected;
                return e;
            },
            onExpand(e, item, options) {
                this.$emit('expanded', this.updateEventVar(e, item, this.isSelected(item)), item, options);
            },
            onClick(e, item, options) {
                this.$emit('click', this.updateEventVar(e, item, this.isSelected(item)), item, options);
            },
            onFocus(evData) {
                this.origValue = deepCopy(this.SelectedValues);
                this.$emit('focus', evData);
            },
            onChange(e) {
                let currValues = JSON.stringify(this.SelectedValues);
                let origValues = JSON.stringify(this.origValue);
                if (currValues != origValues) {
                    this.$emit('change', e, this.SelectedValues);
                }
            },
            onBlur(e) {
                let internal = this.$refs.treelist == e.relatedTarget || this.$refs.treelist.contains(e.relatedTarget);
                if (!internal) {
                    e.target.value = this.currValue;
                    this.$emit('blur', e);
                }
            },
            onFocusOut(e) {
                let rtName = e.relatedTarget == null ? 'Null' : '#' + e.relatedTarget.id;
                let internal = this.$refs.treelist == e.relatedTarget || this.$refs.treelist.contains(e.relatedTarget);
                if (!internal) {
                    let ec = {
                        type: 'change',
                        bubbles: true,
                        target: this.$refs.treelist,
                        relatedTarget: e.relatedTarget,
                        currentTarget: this.$refs.treelist,
                    };
                    this.onChange(ec);
                    let eb = {
                        type: 'blur',
                        bubbles: true,
                        target: this.$refs.treelist,
                        relatedTarget: e.relatedTarget,
                        currentTarget: this.$refs.treelist,
                    };
                    this.onBlur(eb);
                }
            },
            isNodeExpanded(domNode) {
                if (domNode == null) return false;
                if (domNode.classList == null) return false;
                return domNode.classList.contains('expanded');
            },
            hasChildNodes(domNode) {
                if (domNode == null) return false;
                if (domNode.classList == null) return false;
                return domNode.classList.contains('hasChildNodes');
            },

            keyUp(e) {
                switch (e.key) {
                    case ('Enter'):
                    case (' '): {
                        this.clickHandled = true;
                        e.target.querySelector('.selector')?.click();
                        break;
                    }
                }
            },
            keyDown(e) {
                switch (e.key) {
                    case ('Enter'):
                    case (' '):
                        this.selectKey(e);
                        break;
                    case ('Escape'):
                        this.escKey(e);
                        break;
                    case ('Home'):
                        this.homeKey(e);
                        break;
                    case ('End'):
                        this.endKey(e);
                        break;
                    case ('ArrowRight'):
                        this.arrowRightKey(e);
                        break;
                    case ('ArrowDown'):
                        this.arrowDnKey(e);
                        break;
                    case ('ArrowLeft'):
                        this.arrowLeftKey(e);
                        break;
                    case ('ArrowUp'):
                        this.arrowUpKey(e);
                        break;
                    default:
                        this.searchNodesByKey(e)
                }
            },
            searchNodesByKey(e) {
                this.Expanded = true;
                if (this.lastKey == e.key) this.lastKeyIdx++;
                else this.lastKeyIdx = 0;
                for (let i = this.lastKeyIdx; i < this.listItems.length; i++) {
                    let item = this.listItems[i];
                    if (this.listItemText(item).toLowerCase().startsWith(e.key.toLowerCase())) {
                        let li = this.$refs.listbox.querySelector("div[aria-label='" + this.listItemText(item) + "']");
                        if (li == null) break;
                        li.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
                        li.focus();
                        this.selectItem(e, item);
                        this.lastKey = evData.key;
                        this.lastKeyIdx = i;
                        break;
                    }
                }
            },
            selectKey(e) {
                this.clickHandled = true;
                e.preventDefault();
            },
            escKey(e) {
                e.preventDefault();
                this.Expanded = false;
                this.$refs.listbox.focus();
            },
            homeKey(e) {
                e.preventDefault();
                this.$refs.listbox.querySelector('div[role=treeitem]').focus();
            },
            endKey(e) {
                e.preventDefault();
                let endItems = this.$refs.treelist.querySelectorAll('.treelist>div[role=treeitem], div[role=group].expanded>div[role=treeitem]:last-of-type');
                if (endItems != null && endItems.length > 0) endItems[endItems.length - 1].focus();
            },
            arrowRightKey(e) {
                e.preventDefault();
                if (this.collapsible) {
                    if (!this.isNodeExpanded(e.target) && this.hasChildNodes(e.target)) {
                        let i = this.findNodeItem(e.target.dataset.nodeId, this.listItems);
                        i.__expanded = true;
                        return;
                    }
                }
                this.arrowDnKey(e);
            },
            arrowLeftKey(e) {
                e.preventDefault();
                if (this.collapsible) {
                    if (this.isNodeExpanded(e.target) && this.hasChildNodes(e.target)) {
                        let i = this.findNodeItem(e.target.dataset.nodeId, this.listItems);
                        i.__expanded = false;
                        return;
                    }
                }
                this.arrowUpKey(e);
            },
            arrowDnKey(e) {
                e.preventDefault();
                let self = this;
                let nxtSib = getNextItemNode(e.target);
                if (nxtSib != null) nxtSib.focus();

                function getNextItemNode(currElement) {
                    if (currElement == null) return null;
                    let role = currElement.getAttribute('role')?.toString().toLowerCase().trim();
                    if (role == "tree") return self.$refs.listbox.querySelector('.treelist>div[role=treeitem], div[role=group].expanded>div[role=treeitem]');
                    let nxtSib = currElement.nextElementSibling;
                    if (nxtSib == null) return getNextItemNode(currElement.parentElement);
                    role = nxtSib.getAttribute('role')?.toString().toLowerCase().trim();
                    if (role == "treeitem") return nxtSib;
                    if (role == "group" && nxtSib.classList.contains('expanded')) {
                        let nxtChild = nxtSib.querySelector('div[role=treeitem]');
                        if (nxtChild == null) return getNextItemNode(nxtSib.nextElementSibling);
                        return nxtChild;
                    }
                    return getNextItemNode(nxtSib);
                }
            },
            arrowUpKey(e) {
                e.preventDefault();
                let self = this;
                let preSib = GetPrevItemNode(e.target);
                if (preSib != null) preSib.focus();

                function GetPrevItemNode(currElement) {
                    if (currElement == null) return null;
                    let role = currElement.getAttribute('role')?.toString().toLowerCase().trim();
                    if (role == "tree") {
                        let items = self.$refs.treelist.querySelectorAll('.treelist>div[role=treeitem], div[role=group].expanded>div[role=treeitem]:last-of-type');
                        if (items == null || items.length == 0) return null;
                        return items[items.length - 1];
                    }
                    let preSib = currElement.previousElementSibling;
                    while (preSib == null) {
                        currElement = currElement.parentElement
                        role = currElement.getAttribute('role')?.toString().toLowerCase().trim();
                        if (role == "tree") return GetPrevItemNode(currElement);
                        preSib = currElement.previousElementSibling;
                    }
                    role = preSib.getAttribute('role')?.toString().toLowerCase().trim();
                    if (role == "treeitem") return preSib;
                    if (!preSib.classList.contains('expanded')) return GetPrevItemNode(preSib);
                    let preSibs = preSib.querySelectorAll(':scope>div[role=treeitem], div[role=group].expanded>div[role=treeitem]:last-of-type')
                    if (preSibs == null || preSibs.length == 0) return GetPrevItemNode(preSib);
                    return preSibs[preSibs.length - 1];
                }
            },
            findNodeItem(id, tree) {
                if (id == null) { console.warn("'null' node Id will degrade TreeList funtionality ") }
                if (tree == null) return null;
                for (let i of tree) {
                    if (i.__nodeId == id) return i;
                    let node = this.findNodeItem(id, this._childNodes(i));
                    if (node != null) return node;
                }
                return null;
            },
            reconcileValues(listItems) {
                if (listItems == null) this.SelectedValues = null;
                if (this.SelectedValues == null || this.SelectedValues.length == 0) return;
                let newSelected = [];
                this.SelectedValues.forEach((i) => {
                    if (listItems.includes(this.listItemValue(i))) newSelected.push(this.listItemValue(i))
                });
                if (newSelected.length == this.SelectedValues.length) return;
                this.SelectedValues = newSelected;
            },
            _childNodes(item) {
                if (this.childNodesField == null || this.childNodesField.trim() == '') return null;
                if (item == null || item[this.childNodesField] == null) return null;
                return item[this.childNodesField]
            },
        },

        computed: {
            isInvalid: {
                get() {
                    return this.invalid
                        || (this.error_msg != null
                            && this.error_msg !== false
                            && this.error_msg.toString().trim() != '')
                }
            },
            SelectedItems: {
                get() {
                    if (this.SelectedValues == null) return [];
                    let result = [];
                    for (let sv of this.SelectedValues) {
                        let item = this.listItems.find(x => this.listItemValue(x) == sv);
                        if (item != null) result.push(item);
                    }
                    return result;
                }
            },
            SelectedValues: {
                get() {
                    return this.currValue;
                },
                set(val) {
                    this.currValue = val;
                    if (this.modelModifiers == null
                        || this.modelModifiers['lazy'] == null
                        || !this.modelModifiers.lazy) {
                        this.emitValue(val);
                        this.$emit('update:selected-items', this.SelectedItems);
                    }
                }
            },
        },
        watch: {
            modelValue(newVal, oldVal) {
                if (this.currValue == newVal) return;
                this.currValue = newVal;
            },
            listItems(newVal, oldVal) {
                this.reconcileValues(newVal);
            },
        },
        created() {
            this.Id = (this.id == null) ? 'treelist' + treeCount++ : this.id;
            this.inputName = (this.name == null) ? this.Id : this.name;
            this.currValue = this.modelValue;
        },
        mounted() {
            this.currValue = this.modelValue;
        }
    }
    let treeCount = 0;
</script>

<style>
    .cui-treelist {
        display: inline-block;
        font-family: var(--font-family-base, Arial, sans-serif);
        font-size: var(--font-size-base, 16px);
        color: var(--color-text, #333);
    }

        .cui-treelist .treelist-control {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .cui-treelist .label {
            font-weight: bold;
        }

            .cui-treelist .label.required::after {
                content: " *";
                color: var(--color-error-text, red);
            }

        .cui-treelist .treelist {
            border: 1px solid var(--color-borders, #ddd);
            border-radius: 4px;
            padding: 4px;
            max-height: 300px;
            overflow: auto;
            background-color: var(--color-ctrl-background, #ffffff);
        }

            .cui-treelist .treelist.disabled {
                background-color: var(--color-ctrl-background, #f5f5f5);
                color: var(--color-disabled-text, #a0a0a0);
                pointer-events: none;
            }

            .cui-treelist .treelist.readonly {
                background-color: var(--color-ctrl-readonly-background, #f9f9f9);
                color: var(--color-readonly-text, #606060);
            }

            .cui-treelist .treelist.selectable {
                cursor: pointer;
            }

        .errors {
            color: var(--color-error-text, red);
            font-size: 0.875rem;
            margin-top: 4px;
        }

    .treelist div[role=treeitem] {
        display: flex;
        line-height: 1.4rem;
        margin: 0.6rem 0;
    }

        .treelist div[role=treeitem] * {
            vertical-align: middle;
            overflow:clip;
        }

        .treelist .selector::before {
            content: "\e835";
            font-family: 'Material Symbols Outlined' !important;
        }

    .treelist .selected .selector::before {
        content: "\e834";
    }

    .treelist .selected.partial .selector::before {
        content: "\e909";
    }

    .cui-treelist .treelist:focus {
        outline: 2px solid var(--color-focus-outline, #0078d4);
        outline-offset: 2px;
    }

    .cui-treelist [role="group"] {
        margin-left: 1.5rem;
        display: none;
    }

        .cui-treelist [role="group"].expanded {
            display: block;
        }
    .cui-treelist .item {
        height: 1.4rem;
        display: flex;
        flex-direction: row;
        flex-wrap: nowrap;
        align-items: center;
        padding-top: 2px;
    }
</style>