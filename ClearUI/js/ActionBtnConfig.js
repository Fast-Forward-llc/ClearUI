// Copyright (c) Fast Forward, LLC. All rights reserved.
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { TypedConfigBase } from './TypedConfigBase.js'
class ActionBtnConfig extends TypedConfigBase {
    constructor() {
        super();
        this.onClick = null;
        this.icon = null;
        this.title = null;
        this.label = null;
    }
}

export { ActionBtnConfig };