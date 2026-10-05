// Copyright (c) Fast Forward, LLC. All rights reserved.
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

class DialogConfigEvent extends Event {
    constructor(type, dialogConfig, options) {
        super(type, options);
        this.dialogConfig = dialogConfig;
    }
}

export { DialogConfigEvent };