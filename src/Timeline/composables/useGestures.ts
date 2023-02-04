import { zoomer, type WheelGesture } from "../utilities/zoomer";
import { MAX_SCALE, useTimelineStore } from "../../Timeline/timelineStore";
import { computed, onMounted, onUnmounted, ref, watch, type Ref } from "vue";
// @ts-ignore
import Hammer from "@squadette/hammerjs";
import { useThrottleFn } from "@vueuse/core";

export const useGestures = (
  el: Ref<HTMLElement | undefined>,
  onSetScale: () => void = () => {}
) => {
  const timelineStore = useTimelineStore();

  let endGesture = () => {};
  const isZooming = ref(false);
  let startingZoom: number | null = null;

  let pinchStartScrollTop: number | null,
    pinchStartScrollLeft: number | null,
    pinchStartCenterX: number | null,
    pinchStartCenterY: number | null;

  let panStartX = ref<number | undefined>();
  let panStartY: number | undefined = undefined;
  let panStartScrollLeft: number | undefined = undefined;
  let panStartScrollTop: number | undefined = undefined;
  const isPanning = computed(() => panStartX.value !== undefined);

  let mc: Hammer.Manager;

  const pinch = (e: any) => {
    e.preventDefault();
    const offsetLeft = el.value!.offsetLeft;

    if (!startingZoom) {
      isZooming.value = true;
      startingZoom = timelineStore.pageScale;
      pinchStartScrollTop = el.value!.scrollTop;
      pinchStartScrollLeft = el.value!.scrollLeft - offsetLeft;
      pinchStartCenterX = e.center.x;
      pinchStartCenterY = e.center.y;
    }

    const newScrollTop = pinchStartScrollTop! + pinchStartCenterY! - e.center.y;
    let scale = e.scale;
    if (startingZoom! * scale > MAX_SCALE) {
      scale = 1;
    }

    if (scale !== 1 && timelineStore.setPageScale(startingZoom! * e.scale)) {
      const newScrollLeft =
        scale * (pinchStartScrollLeft! + pinchStartCenterX!) -
        (e.center.x! - offsetLeft);

      el.value!.scrollLeft = newScrollLeft;
      el.value!.scrollTop = newScrollTop;
      onSetScale();
    }
  };

  const pinchEnd = (e: Event) => {
    e.preventDefault();
    isZooming.value = false;
    startingZoom = null;
    pinchStartScrollLeft = null;
    pinchStartScrollTop = null;
    pinchStartCenterX = null;
    pinchStartCenterY = null;
  };

  const startGesture = (wg: WheelGesture) => {
    isZooming.value = true;
    if (!startingZoom) {
      startingZoom = timelineStore.pageScale;

      pinchStartScrollTop = el.value!.scrollTop;
      pinchStartScrollLeft = el.value!.scrollLeft;
      pinchStartCenterX =
        wg.origin.x - (el.value!.offsetLeft + timelineStore.leftInsetWidth);
      pinchStartCenterY = wg.origin.y;
    }
  };

  const doGesture = (wg: WheelGesture) => {
    const scale = startingZoom! * wg.scale;
    if (scale > MAX_SCALE) {
      return;
    }
    isZooming.value = true;

    if (timelineStore.setPageScale(scale)) {
      const offsetLeft =
        (el.value! as HTMLElement).offsetLeft + timelineStore.leftInsetWidth;
      const newScrollLeft =
        wg.scale * (pinchStartScrollLeft! + pinchStartCenterX!) -
        (wg.origin.x! - offsetLeft);
      const newScrollTop =
        pinchStartScrollTop! + pinchStartCenterY! - wg.origin.y;

      el.value!.scrollLeft = newScrollLeft;
      el.value!.scrollTop = newScrollTop;
      onSetScale();
    }

    startingZoom = null;
    pinchStartScrollLeft = null;
    pinchStartScrollTop = null;
    pinchStartCenterX = null;
    pinchStartCenterY = null;

    isZooming.value = false;
    endGesture();
  };

  const gestures = {
    startGesture,
    doGesture,
  };

  const touchStart = (e: TouchEvent) => {
    if (e.touches.length >= 2) {
      mc.get("pinch").set({ enable: true });
      e.preventDefault();
    }
  };

  const touchEnd = (e: TouchEvent) => {
    if (e.touches.length <= 2) {
      mc.get("pinch").set({ enable: false });
    }
  };

  const panStart = (e: any) => {
    if (
      !(e.srcEvent.target instanceof HTMLButtonElement) &&
      typeof panStartX.value === "undefined"
    ) {
      e.preventDefault();
      panStartScrollLeft = el.value!.scrollLeft;
      panStartScrollTop = el.value!.scrollTop;
      panStartX.value = e.srcEvent.clientX;
      panStartY = e.srcEvent.clientY;
    }
  };

  const pan = (e: any) => {
    if (!panStartX.value || e.isFinal) {
      return;
    }
    el.value!.scrollLeft =
      panStartScrollLeft! + panStartX.value! - e.srcEvent.clientX;
    el.value!.scrollTop = panStartScrollTop! + panStartY! - e.srcEvent.clientY;
  };

  const panEnd = (e: any) => {
    panStartX.value = undefined;
    panStartY = undefined;
    panStartScrollLeft = undefined;
    panStartScrollTop = undefined;
  };

  const setupHammer = () => {
    mc = new Hammer.Manager(el.value, {
      recognizers: [
        [Hammer.Pinch, { enable: true, touchAction: "pan-x pan-y" }],
        [Hammer.Pan, { enable: true }],
      ],
    });
    mc.on(
      "pinch",
      useThrottleFn((e) => pinch(e), 40, false, true)
    );
    mc.on("pinchend", pinchEnd);
    mc.on("panstart", panStart);
    mc.on("pan", pan);
    mc.on("panend", panEnd);
  };

  onMounted(() => {
    endGesture = zoomer(el.value!, gestures);
    setupHammer();
  });

  onUnmounted(() => {
    el.value?.removeEventListener("touchstart", touchStart);
    el.value?.removeEventListener("touchend", touchEnd);
  });

  return { isZooming, isPanning };
};
