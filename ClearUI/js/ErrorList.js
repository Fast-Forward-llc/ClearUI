// Copyright (c) Fast Forward, LLC. All rights reserved.
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { ValError, ValErrorEvent } from '../js/ValError.js';
const SetErrorEventName = "set-error-msg";
const ClearErrorEventName = "clear-error-msg";

class ErrorList {
    constructor() {
        this.items = [];
    }

    /**
     * Adds an error object defined as {priority:Number, msg:String, msgId:String, ctrlId:String} and keeps the array sorted descending by priority.
     * If called with error.msg == null and error.msgId != null then all msg's with matching msgId are removed.
     * @param {ValError} error
     */
    addError(valError) {
        if (!valError) return;
        if (valError && valError instanceof ValErrorEvent) valError = valError.valError;
        if (!this.sloppyAdd(valError)) 
            this.sort();
    }

    /**
     * Adds an validation error object to the end of the list and does not trigger sorting.
     * If called with msg == null and msgId != null then all msg's with matching msgId are removed.
     * @param {ValError} valError
     */
    sloppyAdd(valError) {
        if (valError && valError instanceof ValErrorEvent) valError = valError.valError;
        if (valError && valError.msgId && !valError?.msg) return this.removeId(valError.msgId);
        if (!valError?.msg) return;
        let existing = this.items.find(x => x.msgId == valError.msgId);
        if (existing) {
            Object.assign(existing, valError);
            return false;
        }
        else this.items.push(valError);
        return true;
    }

    /**
     * triggers sorting on the 'priority' property.
     * Sorting supports any sortable data type i.e. numbers, strings, dates
     */
    sort() {
        if (this.items == null || this.items.length < 2) return;
        this.items.sort(this.sortExpression);
    }

    /**
     * Function to control sorting. default sort function is based on the priority property
     * Replace this function with your own implementation for custom sorting.
     * must return 0, 1 or -1. see Javascript Sort() function for details.
     * @param {string|number} a
     * @param {string|number} b
     */
    sortExpression(a, b) {
        return ((b.priority == a.priority) ? 0 : b.priority > a.priority ? 1 : -1);
    }

    /**
     * Returns msg with highest (numerical) priority. 
     */
    getTopMsg() {
        if (this.items.length === 0) {
            return null;
        }
        return this.items[0].msg;
    }

    /**
     * Returns error with highest (numerical) priority. 
     */
    getTopError() {
        if (this.items.length === 0) {
            return null;
        }
        return this.items[0];
    }

    /**
     * Removes all objects with a case-insensitive matching msg.
     * @param {string} msg
     */
    remove(msg) {
        const target = msg.toLowerCase();
        this.items = this.items.filter(item => item.msg.toLowerCase() !== target && item.msg != null);
    }

    /**
     * Removes all objects with matching priority.
     * @param {string} msg
     */
    removeAt(priority) {
        this.items = this.items.filter(item => item.priority !== priority);
    }

    /**
     * Removes all objects with matching msgId.
     * @param {string} msgId
     */
    removeId(msgId) {
        this.items = this.items.filter(item => item.msgId !== msgId);
    }

    /**
     * Removes all objects with matching msgId or a matching msg (lowercase and trimmed).
     * @param {errorObject} error
     */
    removeError(error) {
        if (error && error instanceof ValErrorEvent) error = error.valError;
        this.items = this.items.filter(item => !(item?.msgId == error.msgId || item?.msg?.toString().trim().toLowerCase() == error.msg?.toString().trim().toLowerCase()));
    }

    /**
     * Returns a copy of the sorted array.
     */
    getAll() {
        return [...this.items];
    }

    reset() {
        this.items = [];
    }

    /**
     * dispatches a SetErrorMsg event on the provided node with the error details.
     * @param {node} node
     * @param {valError} error
     */
    dispatchSetErrorEvent(node, valError, parent) {
        let parentHasOnErrorMsg = parent?.onErrorMsg != null;
        if (parentHasOnErrorMsg)
            parent.onErrorMsg.call(parent, valError);
        else {
            this.dispatchErrorEvent(node, SetErrorEventName, valError);
            this.dispatchErrorEvent(node, 'error', valError);
        }
    }

    /**
     * dispatches a ClearErrorMsg event on the provided node with the error details.
     * @param {node} node
     * @param {ValError} error
     */
    dispatchClearErrorEvent(node, valError, parent) {
        let parentHasOnClearErrorMsg = parent?.onErrorMsg != null;
        if (parentHasOnClearErrorMsg)
            parent.onClearErrorMsg.call(parent, valError);
        else {
            this.dispatchErrorEvent(node, ClearErrorEventName, valError);
            this.dispatchErrorEvent(node, 'error', valError);
        }
    }

    dispatchErrorEvent(node, eventName, valError) {
        if (!node || !(node instanceof Node)) return;
        node.dispatchEvent(new ValErrorEvent(eventName, valError,
            {
                bubbles: true,
                cancelable: true
            }));
    }
}

export default ErrorList;