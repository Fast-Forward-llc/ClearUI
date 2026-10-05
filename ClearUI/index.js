// Copyright (c) Fast Forward, LLC. All rights reserved.
// Licensed under the MIT License. See LICENSE file in the project root for full license information.


import './VueComponents/_common.css'
import componentBundle from './VueComponents/_bundle.js'
import jsBundle from './js/_bundle.js'

const bundle = {};
const componentList = Object.keys(componentBundle);
componentList.forEach((name) => {
    bundle[name.toLowerCase()] = componentBundle[name];
});
bundle.registerAll = function(app) {
    componentList.forEach((name) => {
        if (name == 'registerAll') return;
        app.component(name, componentBundle[name]);
    });
}
export const components = bundle;
export const jsUtils = jsBundle

