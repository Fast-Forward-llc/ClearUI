<!--
Copyright (c) Fast Forward, LLC. All rights reserved.
Licensed under the MIT License. See LICENSE file in the project root for full license information.
-->
<template>
    <dialog ref="dialog"
            :is-open="Show"
            class="popup-dialog"
            :style="customPositionStyle">
        <div class="popup-dialog-centered">
            <div class="popup-dialog-header" v-if="Heading||$slots.heading">
                <slot name="heading">
                    <h2>{{ Heading }}</h2>
                </slot>
            </div>
            <div class="popup-dialog-message">
                <slot name="body">
                    <p v-if="Array.isArray(Message)" v-for="msg in Message">{{msg}}</p>
                    <p v-else>{{ Message }}</p>
                </slot>
            </div>
            <div class="popup-dialog-buttons">
                <slot name="buttons">
                    <button v-for="(btn, idx) in Buttons"
                            :key="idx"
                            :class="Concat(['btn','btn-'+btnText(btn).toLowerCase(),{'btn-primary':Buttons.length==1}],btn['classes'])"
                            v-on:click="(e)=>btnClick(e,btn)" :autofocus="idx==0">
                        {{ btnText(btn) }}
                    </button>
                </slot>
            </div>
        </div>
    </dialog>
</template>

<script>
    export default {
        props: {
            heading: { type: String, default: null },
            message: { type: String, default: null },
            buttons: {
                type: Array,
                default: null // If null, use default OK button
            },
            show: {
                type: Boolean,
                default: false
            },
            enableCustomPosition: {
                type: Boolean,
                default: false
            },
            positionTarget: {
                type: String,
                default: null
            },
        },
        emits: ['update:modelValue', 'update:show', 'ok','cancel','yes','no','abort','accept','reject','exit','open','close'],
        data() {
            return {
                __show: false,
                __config: null,
                customPositionStyle: {}
            };
        },
        computed: {
            Show: {
                get() {
                    return this.__show;
                },
                set(val) {
                    this.__show = val;
                    this.$emit('update:show', val);
                }
            },
            Buttons: {
                get() {
                    let btns = this.__config?.buttons ?? this.buttons; 
                    if (Array.isArray(btns) && btns.length > 0) {
                        return btns;
                    }
                    return [
                        {
                            text: 'OK',
                            onClick: null,
                            close: true
                        }
                    ];
                }
            },
            Message() {
                return this.__config?.message ?? this.message;
            },
            Heading() {
                return this.__config?.heading ?? this.heading;
            },
        },
        methods: {
            onkeydown(e) {
                if (e.key === 'Escape') {
                    this.closeDialog();
                }
            },
            btnText(btn) {
                if (!btn) return null;
                if (typeof (btn) === 'string') return btn;
                return btn.text || '';
            },
            btnClick(e, btn) {
                if (!btn) return;
                if (typeof (btn) === 'string') {
                    this.$emit(this.calcEventName(btn), e);
                }
                if (btn.onClick == null && btn.text != null) {
                    this.$emit(this.calcEventName(btn.text), e);
                }
                if (btn.onClick != null && typeof (btn.onClick) === 'function') {
                    btn.onClick(e);
                }
                if (btn.close) {
                    this.closeDialog();
                }
            },
            Concat(a, b) {
                if (a == null || !Array.isArray(a)) return b;
                if (b == null || !Array.isArray(b)) return a;
                return a.concat(b);
            },
            calcEventName(btnText) {
                if (!btnText) return 'Null';
                return btnText.toString().toLowerCase().trim().replace(/\s+/g, '-');
            },
            openDialog(e) {
                if (e?.dialogConfig) this.__config = e.dialogConfig;
                const dlg = this.$refs.dialog;
                if (dlg && !dlg.open) {
                    dlg.showModal();
                }
                this.Show = true;

                if (this.enableCustomPosition) {
                    this.updateCustomPosition();
                }

                this.$emit('open', {});
            },
            closeDialog() {
                const dlg = this.$refs.dialog;
                if (dlg && dlg.open) {
                    dlg.close();
                }
                this.Show = false;
                this.__config = null;
                this.$emit('close', {});
            },
            updateCustomPosition() {
                if (!this.enableCustomPosition || !this.positionTarget) return;

                const targetElement = document.querySelector(this.positionTarget);
                if (!targetElement) {
                    console.warn(`Popup dialog: Target element "${this.positionTarget}" not found`);
                    return;
                }

                const rect = targetElement.getBoundingClientRect();
                const offset = this.positionOffset || { top: 8, left: 0 };

                // Calculate position relative to viewport, then add scroll offset
                const topPosition = rect.bottom + window.scrollY + offset.top;
                const leftPosition = rect.left + window.scrollX + offset.left;

                this.customPositionStyle = {
                    position: 'fixed',
                    top: topPosition + 'px',
                    left: leftPosition + 'px',
                    margin: '0',
                    transform: 'none'
                };
            },
        },
        watch: {
            show(val) {
                if (val) {
                    this.openDialog();
                } else {
                    this.closeDialog();
                }
            }
        },
        mounted() {
            this.$refs.dialog.addEventListener('open', this.openDialog);
            this.$refs.dialog.addEventListener('close', this.closeDialog);
            if (this.show) {
                this.openDialog();
            }
        },
    };
</script>

<style scoped>

    .popup-dialog {
        border-radius: 13px;
        max-width: 60rem;
        min-width: 12rem;
        border: none;
        box-shadow: 0 2px 16px rgba(0,0,0,0.2);
        padding: 0;
        background: transparent;
    }

    .popup-dialog-centered {
        background: #fff;
        border-radius: 6px;
        padding: 1.5rem;
        min-width: 300px;
    }

    .popup-dialog-header h1,
    .popup-dialog-header h2,
    .popup-dialog-header h3 {
        margin: 0 0 1rem 0;
        font-size: 1.5rem;
    }

    .popup-dialog-message {
        margin-bottom: 1.5rem;
    }

    .popup-dialog-buttons {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
    }

    .popup-dialog::backdrop {
        background: rgba(0,0,0,0.4);
    }
</style>
