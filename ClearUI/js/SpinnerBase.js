// Copyright (c) Fast Forward, LLC. All rights reserved.
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

export class SpinnerBase {
    constructor() { 

        this.emits = ['update:show']
        this.props =  {
            id: null,
            show: { default: false, type: Boolean },
            showDelay: { default: 350, type: Number },
        }

        this.methods = {
            Show_Fn() {
                this.Show = true;
            },
            Hide_Fn() {
                if (this.showTimeout) clearTimeout(this.showTimeout);
                this.showTimeout = null;
                this.Show = false;
            },
        }

        this.computed = {
            Show: {
                get() {
                    return this.__show;
                },
                set(value) {
                    var changed = this.__show != value;
                    if (changed) this.$emit('update:show', value);
                    if (value && this.showTimeout == null)
                        if (this.showDelay > 0) this.showTimeout = setTimeout(() => { this.__show = true; this.showTimeout = null; }, this.showDelay);
                        else { this.__show = true; }
                    if (!value) { this.__show = false; }
                }
            }
        }

        this.watch = {
            show(newVal) {
                if (newVal) this.Show_Fn();
                else this.Hide_Fn();
            }
        }

        this.data = ()=> {
            return {
                __show: false,
                showTimeout: null
            };
        }
    }
    
    created() {
        this.__show = this.show;
    }
    mounted() {
        this.$refs.busyElement.addEventListener('show', this.Show_Fn);
        this.$refs.busyElement.addEventListener('hide', this.Hide_Fn);
    }

    unmounted() {
        this.$refs.busyElement.removeEventListener('show', this.Show_Fn);
        this.$refs.busyElement.removeEventListener('hide', this.Hide_Fn);
    }
};