// Copyright (c) Fast Forward, LLC. All rights reserved.
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

class ValError {
    constructor(msg, priority, msgId, ctrlId) {
        this.msg = msg;
        this.priority = priority;
        this.msgId = msgId;
        this.ctrlId = ctrlId;
    }
}

class ValErrorEvent extends Event {
    constructor(type, valError, options) {
        super(type, options);
        this.valError = new ValError(valError.msg, valError.priority, valError.msgId, valError.ctrlId);
    }
}

export { ValError, ValErrorEvent };