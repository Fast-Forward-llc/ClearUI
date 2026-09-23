<!--
Copyright (c) Fast Forward, LLC. All rights reserved.
Licensed under the MIT License. See LICENSE file in the project root for full license information.
-->
<template>
    <div ref="ul" v-show="errorsList?.items?.length>0" role="status" class="cui cui-error-summary">
        <p v-if="heading" :class="headingLevel">{{heading}}</p>
        <slot :errors="errorsList">
            <ul>
                <li v-for="i in errorsList?.items"><a :href="'#'+i?.ctrlId" v-on:click="(e)=>errorClick(e,i)">{{i?.msg}}</a></li>
            </ul>
        </slot>
    </div>
</template>
<script>
    import ErrorList from '../js/ErrorList.js';
    export default {
        emits: ['click'],
        props: {
            heading: { type: String },
            headingLevel: {type:String, default:'h2'},
            errors: { type: ErrorList, default: null }
        },
        data() {
            return {
                errorsList: new ErrorList(),
            };
        },
        methods: {
            errorClick(e, i) {
                e.errorInfo = i
                this.$emit('click', e);
            },
            addError(evt) {
                if (!evt) return;
                evt.stopPropagation();
                if (!evt.valError) return;
                let err = evt.valError;
                if (!err.msgId && !err.msg) return;
                this.ErrorsList.addError(err);
            },
            clearError(evt) {
                if (!evt) return;
                evt.stopPropagation();
                if (!evt.valError) return;
                let err = evt.valError;
                this.ErrorsList.removeError(err);
            }
        },
        computed: {
            ErrorsList: {
                get() {
                    return this.errorsList;
                },
                set(val) {
                    if (!val || !(val instanceof ErrorList)) this.errorsList = new ErrorList();
                    else this.errorsList = val;
                    this.$emit('update:errors', this.errorsList);
                }
            },
        },
        watch: {
            errors(newVal) {
                if (newVal == this.errorsList) return;
                if (newVal && (newVal instanceof ErrorList)) this.errorsList=newVal;
            }
        },
        created() {
            this.Id = this.id ? this.id : 'errsummary' + (cnt++).toString();
            this.MsgId = this.msgId ? this.msgId : this.Id;
            this.ErrorsList = this.errors;
        },
        mounted() {
            this.$refs.ul.addEventListener('set-error-msg', this.addError);
            this.$refs.ul.addEventListener('clear-error-msg', this.clearError);
        },
        beforeUnmount() {
            if (this.$refs.ul) {
                this.$refs.ul.removeEventListener('set-error-msg', this.addError);
                this.$refs.ul.removeEventListener('clear-error-msg', this.clearError);
            }
        }
    };
    let cnt = 0;
</script>