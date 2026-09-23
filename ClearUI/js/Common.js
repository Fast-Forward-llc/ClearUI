// Copyright (c) Fast Forward, LLC. All rights reserved.
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

const constants = {
    GridContext: '_GridContext_',
}

function deepCopy(obj) {
    // Handle null, undefined, or primitive types
    if (obj === null || typeof obj !== 'object') return obj;

    // Handle Date
    if (obj instanceof Date) return new Date(obj);

    // Handle Array
    if (Array.isArray(obj)) {
        return obj.map(item => deepCopy(item));
    }

    // Handle Map
    if (obj instanceof Map) {
        const result = new Map();
        for (const [key, value] of obj.entries()) {
            result.set(key, deepCopy(value));
        }
        return result;
    }

    // Handle Set
    if (obj instanceof Set) {
        const result = new Set();
        for (const value of obj.values()) {
            result.add(deepCopy(value));
        }
        return result;
    }

    // Handle class instances (not plain objects)
    const proto = Object.getPrototypeOf(obj);
    if (proto && proto !== Object.prototype) {
        const instance = Object.create(proto);
        for (const key of Reflect.ownKeys(obj)) {
            instance[key] = deepCopy(obj[key]);
        }
        return instance;
    }

    // Handle plain objects
    const output = {};
    for (const key of Object.keys(obj)) {
        output[key] = deepCopy(obj[key]);
    }
    return output;
}

/**
 * Performs a deep copy of all members of obj, and then recursively iterates over all of obj's functions,
 * shallow copying each function to the new output object.
 * @param {Object} obj
 * @returns {Object} Deep cloned object with functions shallow copied.
 */
function deepClone(obj) {
    // Handle null, undefined, or primitive types
    if (obj === null || typeof obj !== 'object') return obj;

    // Handle Date
    if (obj instanceof Date) return new Date(obj);

    // Handle Array
    if (Array.isArray(obj)) {
        return obj.map(item => deepClone(item));
    }

    // Handle Map
    if (obj instanceof Map) {
        const result = new Map();
        for (const [key, value] of obj.entries()) {
            result.set(key, deepClone(value));
        }
        return result;
    }

    // Handle Set
    if (obj instanceof Set) {
        const result = new Set();
        for (const value of obj.values()) {
            result.add(deepClone(value));
        }
        return result;
    }

    // Handle class instances (not plain objects)
    const proto = Object.getPrototypeOf(obj);
    if (proto && proto !== Object.prototype) {
        const instance = Object.create(proto);
        for (const key of Reflect.ownKeys(obj)) {
            const val = obj[key];
            if (typeof val === 'function') {
                instance[key] = val; // shallow copy function
            } else {
                instance[key] = deepClone(val);
            }
        }
        return instance;
    }

    // Handle plain objects
    const output = {};
    for (const key of Object.keys(obj)) {
        const val = obj[key];
        if (typeof val === 'function') {
            output[key] = val; // shallow copy function
        } else {
            output[key] = deepClone(val);
        }
    }
    // Also copy over non-enumerable properties and symbols if needed
    const symbols = Object.getOwnPropertySymbols(obj);
    for (const sym of symbols) {
        const val = obj[sym];
        if (typeof val === 'function') {
            output[sym] = val;
        } else {
            output[sym] = deepClone(val);
        }
    }
    return output;
}

const nativeErrorPri = 98.001;
const nativeErrorId = '_NativeError_';
import { ValError, ValErrorEvent } from './ValError.js';
const ComponentValErrorFns = {
    dispatchValErrorEvents(dispatchFn, msg) {
        if (this.prevErrMsg == msg) return;
        if (this.errorEventSelector) {
            let nodes = document.querySelectorAll(this.errorEventSelector);
            if (nodes && nodes.length > 0)
                nodes.forEach(node => {
                    dispatchFn.call(this.errList, node, new ValError(msg, 1, this.Id, this.Id));
                });
        }
        if (this.bubbleErrors) {
            let valErrorEvent = new ValErrorEvent('error', new ValError(msg, 1, this.Id, this.Id),
                {
                    bubbles: true,
                    cancelable: true
                });
            let node = document.getElementById(this.Id);
            if (node) node.dispatchEvent(valErrorEvent);
        }
        this.prevErrMsg = msg;
    },
    onErrorMsg(e) {
        if (e instanceof Event) {
            e.stopPropagation();
            e = e.valError;
        }
        this.errList.sloppyAdd(e);
        if (this.errSort) return;
        this.errSort = true;
        this.$nextTick(() => {
            this.errList.sort();
            this.error_msg = this.errList.getTopMsg();
            this.errSort = false;
            this.$emit('error', { ctrlId: this.Id, msgId: null, msg: this.error_msg });
            this.dispatchValErrorEvents(this.errList.dispatchSetErrorEvent, this.error_msg);
        });

    },
    onClearErrorMsg(e) {
        let valError = null;
        if (e instanceof Event) {
            e.stopPropagation();
            valError = e.valError;
        }else valError = e
        if (valError?.msg == null) return;
        this.errList.remove(valError.msg);
        this.errList.removeId(valError.msgId);
        this.error_msg = this.errList.getTopMsg();
        this.dispatchValErrorEvents(this.errList.dispatchClearErrorEvent, null);
    },
    onResetErrorMsg() {
        this.errList.reset();
        this.error_msg = null;
    },
    evalValidity(e, forceEmit) {
        if (!e?.target) return;
        e?.stopPropagation();
        this.validityInfo = new ValidityInfo(); // Object.assign(new ValidityInfo(), e.target.validity);
        for (const key in e.target.validity) {
            this.validityInfo[key] = e.target.validity[key];
        }
        this.inputIsValid = e.target.validity.valid;
        this.nativeValidationMsg = e.target.validationMessage;
        if (!this.modelModifiers || !this.modelModifiers?.lazy || forceEmit)
            if (!this.inputIsValid && this.nativeValidationMsg)
                this.errList.addError(new ValError(this.nativeValidationMsg, nativeErrorPri, nativeErrorId, this.Id));
            else
                this.errList.removeId(nativeErrorId);
        this.error_msg = this.errList.getTopMsg();
        if (this.error_msg) this.dispatchValErrorEvents(this.errList.dispatchSetErrorEvent, this.error_msg, 'native');
        else this.dispatchValErrorEvents(this.errList.dispatchClearErrorEvent, null, 'native');
    },
}

class ValidityInfo {
    constructor() {
        this.customError= false;
        this.valueMissing= false;
        this.typeMismatch= false;
        this.patternMismatch= false;
        this.tooLong= false;
        this.tooShort= false;
        this.rangeUnderflow= false;
        this.rangeOverflow= false;
        this.stepMismatch= false;
        this.badInput= false;
        this.valid= true;
    }
}
class TableColumnDef {
    constructor(title, column, order, hasSorting, filter) {
        this.title = title;
        this.column = column;
        this.order = order;
        this.hasSorting = hasSorting ?? false;
        this.filter = filter ?? false;
    }
}
class TableColumnDefEvent extends Event {
    constructor(type, tableColumnDef, options) {
        super(type, options);
        this.columnDef = tableColumnDef;
    }
}


import { h, nextTick } from 'vue';

/// Executes the callback on the next microtask tick, ensuring it runs after the current DOM updates and any pending microtasks.
const nextTock = async function (callback) {
    if (!callback || typeof callback !== 'function') throw new Error('Callback must be a function');
    await Promise.resolve()   // escape current Vue flush
    await nextTick()          // schedule into the next flush
    callback()                // runs with full reactive tracking
}

const OverrideComponent = function(component, overrideFn) {
    return {
        name: `${component.name}Wrapper`,
        props: component.props,
        setup(props, { slots }) {
            return () => {
                const overriddenProps = overrideFn(props);
                return h(component, overriddenProps, slots);
            };
        }
    };
}

const RenderChildrenWithProps = function (type, slot, props) {
    return slot.map(vnode => {
        if (vnode.type === type) {
            const plainProps = {};
            if (vnode.props) {
                for (const key of Object.keys(vnode.props)) {
                    plainProps[key] = vnode.props[key];
                }
            }
            // Merge with override props
            const mergedProps = Object.assign({}, plainProps, props);
            // Create override wrapper component
            const ChildAOverride = OverrideComponent(type, (childProps) => ({
                ...childProps, ...props
            }));
            return h(ChildAOverride, mergedProps, vnode.children);
        }
        // Leave other nodes untouched
        return vnode;
    });
}


export {
    deepCopy, deepClone, nextTock, ComponentValErrorFns, constants, ValidityInfo
    , TableColumnDefEvent, TableColumnDef, OverrideComponent, RenderChildrenWithProps
};