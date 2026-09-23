<!--
Copyright (c) Fast Forward, LLC. All rights reserved.
Licensed under the MIT License. See LICENSE file in the project root for full license information.
-->
<template>
    <slot
        :dataset="dataset"
        :block-size="blockSize"
        :edge-value="edgeValue"
        :head-value="headValue"
        :tail-value="tailValue"
        :load-head-trigger="loadHeadTrigger"
        :load-tail-trigger="loadTailTrigger"
        :edge="edge"
    ></slot>
</template>

<script>
    import { nextTock } from '../js/common.js';
    export default {
        props: {
            scrollElementSelector: { type: String, required: true },
            keyField: { type: String, required: true },
            blockSize: { type: Number, default: 100 },
            scrollThreshold: { type: [Number, String], default: 200 },
            dataset: { type: Array, required: true },
            virtualMaxPx: { type: Number, default: null },
            avgItemSizePx: { type: Number, default: null },
            maxItemCount: { type: Number, default: null },
            reset: { type: [Boolean, Number, String], default: false },
            disabled: { type: Boolean, default: false },
            disableTrim: { type: Boolean, default: false },
        },
        emits: ['update:reset'],
        data() {
            return {
                loadHeadTrigger: 0,
                loadTailTrigger: 0,
                edgeValue: null,
                headValue: null,
                tailValue: null,
                edge: null,
                pendingHead: false,
                pendingTail: false,
                noMoreHead: false,
                noMoreTail: false,
                headAnchorKey: null,
                tailAnchorKey: null,
                trimAlternateToggle: false,
                suppressHeadThreshold: false,
                suppressTailThreshold: false,
                scrollElement: null,
                boundOnScroll: null,
                scrollElementRetryTimer: null,
                scrollElementRetryAttempts: 0,
                scrollRafHandle: null,
                boundOnNoItemsHead: null,
                boundOnNoItemsTail: null,
                lastHeadGrowCount: 0,
                lastTailGrowCount: 0,
                hasLeftHeadZone: false,
            };
        },
        computed: {
            datasetLength() {
                return this.dataset ? this.dataset.length : 0;
            }
        },
        watch: {
            reset(newVal) {
                if (!newVal) return;
                this.performReset();
                this.$emit('update:reset', false);
            },
            disabled(newVal) {
                if (newVal) return;
                // Re-enabled: re-evaluate thresholds/trimming against current scroll position.
                this.$nextTick(async () => {
                    await this.trimIfNeeded();
                    this.checkThresholds();
                });
            },
            disableTrim(newVal) {
                if (newVal) return;
                // Trimming was just re-enabled: force a trim evaluation based on the direction
                // of the last known growth, regardless of the current scroll position, since the
                // dataset may have grown well past virtualMaxPx while trimming was disabled and
                // the current scroll position could otherwise sit inside a trigger zone and
                // suppress the check indefinitely.
                this.$nextTick(async () => {
                    await this.trimIfNeeded(this.lastHeadGrowCount, this.lastTailGrowCount, true);
                    this.checkThresholds();
                });
            },
            scrollElementSelector() {
                this.reattachScrollElement();
            },
            datasetLength(newLen, oldLen) {
                // New data has arrived (or dataset was replaced). Determine, independently for
                // each direction, whether that end actually grew by checking whether the OTHER
                // edge's key is unchanged (dataset[0] still matches headAnchorKey when a
                // tail-load appended to the tail; dataset[length-1] still matches tailAnchorKey
                // when a head-load prepended to the head). Since prepend/append never disturbs
                // the opposite edge, an unchanged opposite-edge key confirms growth occurred at
                // the other end, and the exact count then falls straight out of the length delta -
                // no search needed at all. This avoids relying on a single "last load direction"
                // flag, which breaks down when a head-load and a tail-load are both in flight
                // at once, and it's cheaper than locating an anchor via a full array scan.
                if (!oldLen) return;
                let headGrowCount = 0;
                let tailGrowCount = 0;
                let delta = newLen - (oldLen || 0);

                if (this.pendingTail && this.headAnchorKey !== null && delta > 0 &&
                    this.dataset[0] && this.dataset[0][this.keyField] === this.headAnchorKey) {
                    // Head edge is unchanged, so the growth must be an append to the tail.
                    tailGrowCount = delta;
                    this.pendingTail = false;
                    this.tailAnchorKey = null;
                }

                if (this.pendingHead && this.tailAnchorKey !== null && delta > 0 &&
                    this.dataset[this.dataset.length - 1] && this.dataset[this.dataset.length - 1][this.keyField] === this.tailAnchorKey) {
                    // Tail edge is unchanged, so the growth must be a prepend to the head.
                    headGrowCount = delta;
                    this.pendingHead = false;
                    this.headAnchorKey = null;
                }

                // Fall back to locating the anchor directly by scanning, for any case the fast
                // checks above didn't resolve (e.g. both ends grew in the same tick, trimming
                // ran concurrently, or the dataset was replaced wholesale).
                if (this.pendingHead && this.headAnchorKey !== null) {
                    let idx = this.dataset.findIndex(item => item && item[this.keyField] === this.headAnchorKey);
                    if (idx !== -1) {
                        headGrowCount = idx;
                        this.pendingHead = false;
                        this.headAnchorKey = null;
                    }
                }

                if (this.pendingTail && this.tailAnchorKey !== null) {
                    let idx = this.dataset.findIndex(item => item && item[this.keyField] === this.tailAnchorKey);
                    if (idx !== -1) {
                        tailGrowCount = this.dataset.length - 1 - idx;
                        this.pendingTail = false;
                        this.tailAnchorKey = null;
                    }
                }


                // now (before Vue re-renders the DOM) so the visual scroll position can be
                // preserved once the new rows are inserted above the current viewport.
                let el = this.scrollElement;
                let preserveScroll = headGrowCount > 0 && el ? { oldScrollHeight: el.scrollHeight, oldScrollTop: el.scrollTop } : null;

                if (headGrowCount > 0 || tailGrowCount > 0) {
                    this.lastHeadGrowCount = headGrowCount;
                    this.lastTailGrowCount = tailGrowCount;
                }

                this.$nextTick(async () => {
                    if (preserveScroll) {
                        this.adjustScrollTopForHeightChange(el, preserveScroll.oldScrollHeight, preserveScroll.oldScrollTop);
                    }
                    if (!this.disabled) {
                        await this.trimIfNeeded(headGrowCount, tailGrowCount);
                        this.checkThresholds();
                    }
                });

                // If the scroll element wasn't available yet
                // in a later tick than this component), a dataset update is a reasonable signal
                // to retry resolving it.
                if (!this.scrollElement) {
                    this.ensureScrollElement();
                }
            }
        },
        methods: {
            getScrollElement() {
                if (typeof document === 'undefined') return null;
                return document.querySelector(this.scrollElementSelector);
            },
            reattachScrollElement() {
                this.detachScrollListener();
                this.cancelScrollElementRetry();
                this.scrollElement = this.getScrollElement();
                if (this.scrollElement) {
                    this.attachScrollListener();
                    this.scrollElementRetryAttempts = 0;
                    this.$nextTick(() => this.checkThresholds());
                } else {
                    this.ensureScrollElement();
                }
            },
            // Attempts to resolve the scroll element if it isn't currently known. Retries with a
            // capped, incrementally-backed-off delay to accommodate parents that render the
            // scrollable element asynchronously (e.g. in a later tick, after an HTTP response, etc.).
            ensureScrollElement() {
                if (this.scrollElement) return;
                if (this.scrollElementRetryTimer) return;

                const maxAttempts = 20;
                if (this.scrollElementRetryAttempts >= maxAttempts) return;

                let delay = Math.min(100 * (this.scrollElementRetryAttempts + 1), 1000);
                this.scrollElementRetryTimer = setTimeout(() => {
                    this.scrollElementRetryTimer = null;
                    this.scrollElementRetryAttempts++;

                    let found = this.getScrollElement();
                    if (found) {
                        this.scrollElement = found;
                        this.attachScrollListener();
                        this.scrollElementRetryAttempts = 0;
                        this.$nextTick(() => this.checkThresholds());
                    } else {
                        this.ensureScrollElement();
                    }
                }, delay);
            },
            cancelScrollElementRetry() {
                if (this.scrollElementRetryTimer) {
                    clearTimeout(this.scrollElementRetryTimer);
                    this.scrollElementRetryTimer = null;
                }
            },
            // Clears all in-progress load/trim tracking state and scrolls the target
            // element back to the top, effectively restarting virtual scrolling from scratch.
            performReset() {
                this.pendingHead = false;
                this.pendingTail = false;
                this.noMoreHead = false;
                this.noMoreTail = false;
                this.headAnchorKey = null;
                this.tailAnchorKey = null;
                this.trimAlternateToggle = false;
                this.suppressHeadThreshold = false;
                this.suppressTailThreshold = false;
                this.hasLeftHeadZone = false;
                this.edgeValue = null;
                this.headValue = null;
                this.tailValue = null;
                this.edge = null;
                this.loadHeadTrigger = 0;
                this.loadTailTrigger = 0;

                if (this.scrollRafHandle !== null) {
                    cancelAnimationFrame(this.scrollRafHandle);
                    this.scrollRafHandle = null;
                }

                if (this.scrollElement) {
                    this.scrollElement.scrollTop = 0;
                }

                this.$nextTick(() => this.checkThresholds());
            },
            attachScrollListener() {
                if (!this.scrollElement) return;
                this.boundOnScroll = () => this.onScroll();
                this.scrollElement.addEventListener('scroll', this.boundOnScroll, { passive: true });

                // These events allow a child loader (e.g. cui-HttpRequest) to inform this
                // component that a given end of the dataset has no more records, so further
                // load triggers for that end are suppressed until scroll leaves the trigger zone.
                // The pending flag and anchor key for that end are also cleared here, since the
                // in-flight load has resolved (with zero rows) - otherwise pendingHead/pendingTail
                // would remain stuck true forever (no dataset change occurs to clear it naturally),
                // which would also permanently block trimming from touching the anchored edge.
                this.boundOnNoItemsHead = () => {
                    this.noMoreHead = true;
                    this.pendingHead = false;
                    this.headAnchorKey = null;
                };
                this.boundOnNoItemsTail = () => {
                    this.noMoreTail = true;
                    this.pendingTail = false;
                    this.tailAnchorKey = null;
                };
                this.scrollElement.addEventListener('NoItemsHead', this.boundOnNoItemsHead);
                this.scrollElement.addEventListener('NoItemsTail', this.boundOnNoItemsTail);
            },
            detachScrollListener() {
                if (this.scrollElement && this.boundOnScroll) {
                    this.scrollElement.removeEventListener('scroll', this.boundOnScroll);
                }
                if (this.scrollElement && this.boundOnNoItemsHead) {
                    this.scrollElement.removeEventListener('NoItemsHead', this.boundOnNoItemsHead);
                }
                if (this.scrollElement && this.boundOnNoItemsTail) {
                    this.scrollElement.removeEventListener('NoItemsTail', this.boundOnNoItemsTail);
                }
                this.boundOnScroll = null;
                this.boundOnNoItemsHead = null;
                this.boundOnNoItemsTail = null;
                if (this.scrollRafHandle !== null) {
                    cancelAnimationFrame(this.scrollRafHandle);
                    this.scrollRafHandle = null;
                }
            },
            resolveThresholdPx(el) {
                let threshold = this.scrollThreshold;
                if (typeof threshold === 'string' && threshold.trim().endsWith('%')) {
                    let pct = parseFloat(threshold) / 100;
                    return el.scrollHeight * (isNaN(pct) ? 0 : pct);
                }
                let numeric = Number(threshold);
                return isNaN(numeric) ? 0 : numeric;
            },
            // Keeps the visually-anchored row in place when content is inserted/removed above the
            // current scroll position by compensating scrollTop for the resulting scrollHeight delta.
            // minScrollTop optionally hard-clamps the result so estimate error (e.g. avgItemSizePx
            // under-representing real row height) can never push scrollTop negative/past a safe
            // boundary, which browsers clamp to 0 - snapping the view to the very start of the
            // dataset instead of preserving the anchor.
            adjustScrollTopForHeightChange(el, oldScrollHeight, oldScrollTop, minScrollTop = 0) {
                if (!el) return;
                let delta = el.scrollHeight - oldScrollHeight;
                if (delta !== 0) {
                    el.scrollTop = Math.max(minScrollTop, oldScrollTop + delta);
                }
            },
            onScroll() {
                if (this.disabled) return;
                // Throttle to at most one checkThresholds() call per animation frame so that
                // fast/continuous scroll events don't trigger redundant work.
                if (this.scrollRafHandle !== null) return;

                this.scrollRafHandle = requestAnimationFrame(() => {
                    this.scrollRafHandle = null;
                    this.checkThresholds();
                });
            },
            checkThresholds() {
                if (this.disabled) return;
                let el = this.scrollElement;
                if (!el || !this.dataset) return;
                //if (!el || !this.dataset || this.dataset.length === 0) return;

                let thresholdPx = this.resolveThresholdPx(el);
                let distanceFromTop = el.scrollTop;
                let distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
                // Immediately after trimming removes rows from an end, that end's scroll-position
                // measurement can transiently read as "in the trigger zone" (e.g. scrollTop
                // clamped near 0 when more was trimmed from the head than had actually been
                // scrolled past). Skip evaluating that one edge for this single check so
                // trimming can't spuriously fire a load in the opposite direction, causing a
                // tail-load -> head-trim -> head-load -> tail-trim oscillation.
                if (distanceFromTop > thresholdPx) {
                    this.hasLeftHeadZone = true;
                }

                if (this.suppressHeadThreshold) {
                    this.suppressHeadThreshold = false;
                } else if (distanceFromTop <= thresholdPx) {
                    // Suppress the very first head trigger until the scroll position has left
                    // the head zone at least once. Without this, mounting with the scroll
                    // position starting inside the head zone (e.g. scrollTop at 0) would
                    // immediately fire a spurious head load before the user has scrolled at all.
                    if (this.hasLeftHeadZone) {
                        this.triggerHead();
                    }
                } else {
                    this.pendingHead = false;
                    this.noMoreHead = false;
                }

                if (this.suppressTailThreshold) {
                    this.suppressTailThreshold = false;
                } else if (distanceFromBottom <= thresholdPx) {
                    this.triggerTail();
                } else {
                    this.pendingTail = false;
                    this.noMoreTail = false;
                }
            },
            triggerHead() {
                if (this.pendingHead || this.noMoreHead) return;
                if (!this.dataset || this.dataset.length === 0) return;
                this.pendingHead = true;
                this.headAnchorKey = this.dataset[0][this.keyField];
                this.headValue = this.headAnchorKey;
                this.edgeValue = this.headAnchorKey;
                this.edge = 'H';
                this.loadHeadTrigger++;
            },
            triggerTail() {
                if (this.pendingTail || this.noMoreTail) return;
                //if (!this.dataset || this.dataset.length === 0) return;
                if (!this.dataset) return;
                this.pendingTail = true;
                this.tailAnchorKey = this.dataset.length ? this.dataset[this.dataset.length - 1][this.keyField] : null;
                this.tailValue = this.tailAnchorKey;
                this.edgeValue = this.tailAnchorKey;
                this.edge = 'T';
                this.loadTailTrigger++;
            },
            // Removes a single element from the end(s) that did NOT just grow. When both ends grew
            // in the same tick (growHead > 0 && growTail > 0), removal alternates between ends so
            // neither freshly-loaded block is immediately discarded in its entirety.
            // Returns 'head', 'tail', or null if no element could be removed (dataset too small).
            removeOneElement(growHead, growTail) {
                if (this.dataset.length <= 1) return null;

                let removeFromHead;
                if (growHead > 0 && growTail > 0) {
                    // Both ends grew: alternate which end we trim from.
                    removeFromHead = this.trimAlternateToggle;
                    this.trimAlternateToggle = !this.trimAlternateToggle;
                } else if (growTail > 0) {
                    // Only the tail grew, so trim from the head (opposite end).
                    removeFromHead = true;
                } else if (growHead > 0) {
                    // Only the head grew, so trim from the tail (opposite end).
                    removeFromHead = false;
                } else {
                    // Neither end is known to have grown (e.g. dataset replaced wholesale);
                    // fall back to trimming from the tail.
                    removeFromHead = false;
                }

                if (removeFromHead) {
                    this.dataset.shift();
                    // The head anchor/cursor must always track whatever row is now at the head,
                    // regardless of whether a head load is currently pending. If it were only
                    // refreshed while pending, a subsequent trigger (after trimming had already
                    // moved the head past the stale anchor) would either reuse a stale cursor value
                    // or find pendingHead/headAnchorKey in an inconsistent state. Keeping this
                    // unconditional ensures triggerHead() always has accurate bookkeeping to build
                    // on, and lets any pending load's anchor track trimming as it happens.
                    if (this.dataset.length > 0) {
                        let headKey = this.dataset[0][this.keyField];
                        if (this.pendingHead) {
                            this.headAnchorKey = headKey;
                        }
                        this.headValue = headKey;
                        this.edgeValue = headKey;
                    }
                    return 'head';
                } else {
                    this.dataset.pop();
                    // Same reasoning as above, but for the tail anchor/cursor and tail loads.
                    if (this.dataset.length > 0) {
                        let tailKey = this.dataset[this.dataset.length - 1][this.keyField];
                        if (this.pendingTail) {
                            this.tailAnchorKey = tailKey;
                        }
                        this.tailValue = tailKey;
                        this.edgeValue = tailKey;
                    }
                    return 'tail';
                }
            },
            async trimIfNeeded(headGrowCount = 0, tailGrowCount = 0, force = false) {
                if (this.disabled) return;
                if (this.disableTrim && !force) return;
                let useItemCount = this.maxItemCount && this.maxItemCount > 0;
                if (!useItemCount && (!this.virtualMaxPx || this.virtualMaxPx <= 0)) return;
                let el = this.scrollElement;
                if (!el) return;

                // If the current scroll position already sits within the top or bottom trigger
                // zone (e.g. a small initial dataset where appending tail rows grows
                // scrollHeight enough that the unchanged scrollTop now reads as "near the top"),
                // skip trimming for this cycle entirely. Removing elements while positioned in
                // a trigger zone can shift the scroll position further into (or newly into) the
                // opposite zone, causing a load/trim oscillation. checkThresholds() will
                // still fire a legitimate load for that zone; trimming is deferred until the
                // position naturally moves out of both zones. This safety check is skipped when
                // force is true (e.g. disableTrim was just re-enabled and a large backlog may need
                // trimming regardless of the current scroll position).
                let thresholdPx = this.resolveThresholdPx(el);
                let distanceFromTop = el.scrollTop;
                let distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
                if (!force && (distanceFromTop <= thresholdPx || distanceFromBottom <= thresholdPx)) return;

                // When maxItemCount is provided, it takes precedence over virtualMaxPx/avgItemSizePx.
                // Since the exact number of rows to remove is known up-front (no scrollHeight
                // measurement/estimation required), the batch is removed in one pass rather than
                // needing the height-based estimate-then-fine-tune approach below.
                if (useItemCount) {
                    let excessCount = this.dataset.length - this.maxItemCount;
                    if (excessCount <= 0) return;

                    // Cap the batch so it can never remove more rows than are safely outside the
                    // opposite trigger zone, for the same oscillation-avoidance reasons as the
                    // height-based path below: removing the whole excess in one uninterrupted loop
                    // (with only a single compensating scrollTop adjustment at the end) could
                    // otherwise shift the scroll position into the opposite trigger zone and fire
                    // a spurious load there. Row height isn't known up-front for count-based
                    // trimming, so this cap is approximated using the average row height computed
                    // from the current scrollHeight/dataset length.
                    let avgRowPx = this.dataset.length > 0 ? el.scrollHeight / this.dataset.length : 0;
                    let toRemove = Math.min(excessCount, this.dataset.length - 1);
                    if (avgRowPx > 0) {
                        if (tailGrowCount > 0 && headGrowCount === 0) {
                            let safeCount = Math.floor((distanceFromTop - thresholdPx) / avgRowPx);
                            toRemove = Math.min(toRemove, Math.max(0, safeCount));
                        } else if (headGrowCount > 0 && tailGrowCount === 0) {
                            let safeCount = Math.floor((distanceFromBottom - thresholdPx) / avgRowPx);
                            toRemove = Math.min(toRemove, Math.max(0, safeCount));
                        }
                    }

                    let removedFromHead = false;
                    let removedFromTail = false;
                    let oldScrollHeight = el.scrollHeight;
                    let oldScrollTop = el.scrollTop;
                    for (let i = 0; i < toRemove; i++) {
                        let curDistanceFromTop = el.scrollTop;
                        let curDistanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
                        if (!force && (curDistanceFromTop <= thresholdPx || curDistanceFromBottom <= thresholdPx)) break;

                        let removedEnd = this.removeOneElement(headGrowCount, tailGrowCount);
                        if (removedEnd === null) break;
                        if (removedEnd === 'head') removedFromHead = true;
                        if (removedEnd === 'tail') removedFromTail = true;
                    }
                    await this.$nextTick();
                    if (removedFromHead) {
                        this.adjustScrollTopForHeightChange(el, oldScrollHeight, oldScrollTop, thresholdPx);
                        this.suppressHeadThreshold = true;
                    }
                    if (removedFromTail) {
                        this.suppressTailThreshold = true;
                    }
                    return;
                }

                // When an average item size is known, estimate how many elements need to be
                // removed up-front to minimize the number of remove/remeasure iterations.
                if (this.avgItemSizePx && this.avgItemSizePx > 0 && el.scrollHeight > this.virtualMaxPx) {
                    let excessPx = el.scrollHeight - this.virtualMaxPx;
                    let estimatedCount = Math.floor(excessPx / this.avgItemSizePx);
                    if (estimatedCount > 0) {
                        let toRemove = Math.min(estimatedCount, this.dataset.length - 1);

                        // Cap the batch so it can never remove more rows than are safely outside
                        // the opposite trigger zone. Without this, removing the whole estimated
                        // batch in one uninterrupted loop (with only a single compensating
                        // scrollTop adjustment at the end) can overshoot and clamp scrollTop to 0
                        // (or clamp against the bottom), visually snapping the viewport into the
                        // opposite trigger zone and firing a spurious load there.
                        if (tailGrowCount > 0 && headGrowCount === 0) {
                            let safeCount = Math.floor((distanceFromTop - thresholdPx) / this.avgItemSizePx);
                            toRemove = Math.min(toRemove, Math.max(0, safeCount));
                        } else if (headGrowCount > 0 && tailGrowCount === 0) {
                            let safeCount = Math.floor((distanceFromBottom - thresholdPx) / this.avgItemSizePx);
                            toRemove = Math.min(toRemove, Math.max(0, safeCount));
                        }

                        let removedFromHead = false;
                        let oldScrollHeight = el.scrollHeight;
                        let oldScrollTop = el.scrollTop;
                        let removedFromTail = false;
                        for (let i = 0; i < toRemove; i++) {
                            let curDistanceFromTop = el.scrollTop;
                            let curDistanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
                            if (!force && (curDistanceFromTop <= thresholdPx || curDistanceFromBottom <= thresholdPx)) break;

                            let removedEnd = this.removeOneElement(headGrowCount, tailGrowCount);
                            if (removedEnd === null) break;
                            if (removedEnd === 'head') removedFromHead = true;
                            if (removedEnd === 'tail') removedFromTail = true;
                        }
                        await this.$nextTick();
                        if (removedFromHead) {
                            // Clamp so a larger-than-estimated real row height can't overshoot
                            // scrollTop past the safe boundary (which would otherwise clamp to 0
                            // and snap the view to the very start of the dataset).
                            this.adjustScrollTopForHeightChange(el, oldScrollHeight, oldScrollTop, thresholdPx);
                            this.suppressHeadThreshold = true;
                        }
                        if (removedFromTail) {
                            this.suppressTailThreshold = true;
                        }
                    }
                }

                let guard = 0;
                let maxGuard = this.dataset.length;
                while (el.scrollHeight > this.virtualMaxPx && this.dataset.length > 1 && guard < maxGuard) {
                    // Re-check zone position each iteration: removing an element can shift the
                    // scroll position into a trigger zone partway through the loop (especially
                    // with a small dataset), so bail out rather than risk oscillation.
                    let curDistanceFromTop = el.scrollTop;
                    let curDistanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
                    if (!force && (curDistanceFromTop <= thresholdPx || curDistanceFromBottom <= thresholdPx)) break;

                    let oldScrollHeight = el.scrollHeight;
                    let oldScrollTop = el.scrollTop;
                    let removedEnd = this.removeOneElement(headGrowCount, tailGrowCount);
                    if (removedEnd === null) break;
                    guard++;
                    await this.$nextTick();
                    if (removedEnd === 'head') {
                        this.adjustScrollTopForHeightChange(el, oldScrollHeight, oldScrollTop, thresholdPx);
                        this.suppressHeadThreshold = true;
                    } else {
                        this.suppressTailThreshold = true;
                    }
                }
            }
        },
        mounted() {
            this.reattachScrollElement();
            //initialize dataset. if dataset length is falsey on mount, trigger a tail load
            //nextTock(() => {
            //    if (!this.datasetLength) this.triggerTail();
            //});
        },
        beforeUnmount() {
            this.detachScrollListener();
            this.cancelScrollElementRetry();
        }
    };
</script>
