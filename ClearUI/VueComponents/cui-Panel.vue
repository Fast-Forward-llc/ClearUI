<!--
Copyright (c) Fast Forward, LLC. All rights reserved.
Licensed under the MIT License. See LICENSE file in the project root for full license information.
-->
<template>
        <div class="h-resizable"
             :style="{ width: leftWidth + 'px' }"
             ref="panel">
            <slot></slot>
            <div class="resize-handle"
                 ref="handle"
                 @pointerdown="startDrag"></div>
        </div>
</template>

<script>
    export default {
        props: {
            initialWidth: { type: Number, default: 300 },
            minWidth: { type: Number, default: 150 },
            maxWidth: { type: Number, default: 800 }
        },
        data() {
            return {
                leftWidth: this.initialWidth,
                dragging: false
            };
        },
        mounted() {
            // Pointer events unify mouse + touch + pen
            document.addEventListener("pointermove", this.onDrag);
            document.addEventListener("pointerup", this.stopDrag);
        },
        beforeDestroy() {
            document.removeEventListener("pointermove", this.onDrag);
            document.removeEventListener("pointerup", this.stopDrag);
        },
        methods: {
            startDrag(e) {
                this.dragging = true;
                document.body.style.userSelect = "none";

                // Capture pointer so events stay bound even if cursor leaves handle
                e.target.setPointerCapture(e.pointerId);
            },

            onDrag(e) {
                if (!this.dragging) return;

                const leftRect = this.$refs.panel.getBoundingClientRect();
                let newWidth = e.clientX - leftRect.left;

                newWidth = Math.max(this.minWidth, Math.min(this.maxWidth, newWidth));

                this.leftWidth = newWidth;
                this.$emit("resize", newWidth);
            },

            stopDrag(e) {
                if (!this.dragging) return;

                this.dragging = false;
                document.body.style.userSelect = "";

                // Release pointer capture
                if (e.target.releasePointerCapture) {
                    try { e.target.releasePointerCapture(e.pointerId); } catch { }
                }
            }
        }
    };
</script>

<style>
    .h-resizable {
        flex: 0 0 auto;
        position: relative;
        overflow: hidden;
    }
    .resize-handle {
        width: 6px;
        cursor: ew-resize;
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        background: transparent;
        /* Critical for touch devices */
        touch-action: none;
    }
</style>
