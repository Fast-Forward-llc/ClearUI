// Copyright (c) Fast Forward, LLC. All rights reserved.
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

const valFunctions = {
    isRequired(value, falseyCompare) {
        return falseyCompare ? !(!value) : (value !== null && value !== undefined && value.toString().trim() !== '');
    },
    isEmail(value) {
        if (value==null) return true;
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailPattern.test(value);
    },
    isPhoneNumber(value) {
        if (value == null) return true;
        const phonePattern = /^\+?[1-9]\d{1,14}$/;
        return phonePattern.test(value);
    },
    minLength(value, length) {
        if (length === null || length === undefined) return true;
        return value.toString().length >= length;
    },
    maxLength(value, length) {
        if (length === null || length === undefined) return true;
        return value.toString().length <= length;
    },
    isNumber(value) {
        return !isNaN(value);
    },
    isDate(value) {
        if (value == null) return true;
        return !isNaN(Date.parse(value));
    },
    //0-9, A-z, ~@_-|
    isSimpleAscii(value) { 
        if (value == null) return true;
        return /^[\x30-\x39\x40-\x5A\x61-\x7A~_|-]+$/.test(value);
    },  
    //Printable ASCII characters (32-126)
    isAscii(value) {
        if (value == null) return true;
        return /^[\x20-\x7E]+$/.test(value);
    }
}

export default valFunctions;