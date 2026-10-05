// Copyright (c) Fast Forward, LLC. All rights reserved.
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import ErrorList from './ErrorList.js';
import { ComponentValErrorFns, ValidityInfo } from './common.js';

export default {
    props: {
        errorMsg: { type: String, default: null },
        errorEventSelector: { type: String, default: null },
        bubbleErrors: { type: Boolean, default: true },
    },
    data() {
        return {
            errList: null,
            error_msg: null,
            error_msg_priority: 0,
            inputIsValid: true,
            validityInfo: new ValidityInfo(),
            nativeValidationMsg: null,
        };
    },
    computed: {
        IsInvalid() {
            return this.error_msg != null && this.error_msg.trim() != '';
        }
    },
    watch: {
        errorMsg: {
            handler(newVal) {
                this.error_msg = newVal;
            },
            immediate: true
        },
    },
    methods: {
        onErrorMsg: ComponentValErrorFns.onErrorMsg,
        onClearErrorMsg: ComponentValErrorFns.onClearErrorMsg,
        onResetErrorMsg: ComponentValErrorFns.onResetErrorMsg,
        dispatchValErrorEvents: ComponentValErrorFns.dispatchValErrorEvents,
        evalValidity: ComponentValErrorFns.evalValidity,
        clearValErrors() {
            if (!this.errList.getTopError()) return;
            this.errList.reset();
            this.inputIsValid = true;
            this.error_msg = null;
            this.dispatchValErrorEvents(this.errList.dispatchClearErrorEvent, null);
        }
    },
    created() {
        this.errList = new ErrorList();
    },
    mounted() {
        this.$el.addEventListener('set-error-msg', this.onErrorMsg);
        this.$el.addEventListener('clear-error-msg', this.onClearErrorMsg);
        this.$el.addEventListener('reset-error-msg', this.onResetErrorMsg);
    },
    beforeUnmount() {
        if (this.$el) {
            this.$el.removeEventListener('set-error-msg', this.onErrorMsg);
            this.$el.removeEventListener('clear-error-msg', this.onClearErrorMsg);
            this.$el.removeEventListener('reset-error-msg', this.onResetErrorMsg);
        }
    }
};