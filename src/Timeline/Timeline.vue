<script setup lang="ts">
import { onMounted, ref, watch, nextTick, onActivated, computed } from "vue";
import {
  useTimelineStore,
  type Viewport,
  recurrenceLimit,
} from "./timelineStore";
import { scaleToGetDistance } from "./initialPageSettings";
import TimeMarkersBack from "@/Timeline/Markers/TimeMarkersBack.vue";
import Events from "@/Timeline/Events/Events.vue";
import { useGestures } from "@/Timeline/composables/useGestures";
import { useHoveringMarker } from "@/Timeline/composables/useHoveringMarker";
import { DateTime } from "luxon";
import {
  useResizeObserver,
} from "@vueuse/core";
import { toDateRange, type DateRange } from "@markwhen/parser";
import { dateMidpoint, diffScale } from "./utilities/dateTimeUtilities";
// import { useEventFinder } from "@/Views/ViewOrchestrator/useEventFinder";
import { eventValue, isEventNode } from "@markwhen/parser";
import DebugView from "./DebugView.vue";
import { ranges } from "@/utilities/ranges";
import { useNodePosition } from "./Events/composables/useNodePosition";
import { useEventFinder } from "@/utilities/useEventFinder";
import { useMarkwhenStore } from "@/Markwhen/markwhenStore";
import SvgView from "./Svg/SvgView.vue";
import Settings from "./Settings/Settings.vue";
import ReferenceDateVue from "./Events/ReferenceDate.vue";
import NowLine from "./Events/NowLine.vue";

const timelineStore = useTimelineStore();
const markwhenStore = useMarkwhenStore();

markwhenStore.onJumpToRange = (range) => {
  scrollToDateRangeImmediate(toDateRange(range));
};
watch(
  () => timelineStore.rangeToJumpTo,
  (dr) => scrollToDateRangeImmediate(dr, false)
);
markwhenStore.onJumpToPath = (path) => {
  const node = useEventFinder(path).value;
  if (!node) {
    return;
  }

  const range = isEventNode(node)
    ? eventValue(node).dateRangeIso
    : ranges(node, recurrenceLimit);

  if (!range) {
    return;
  }

  scrollToDateRangeImmediate(
    "fromDateTimeIso" in range ? toDateRange(range) : range
  );
  if (timelineElement.value && path) {
    const nodeTop = (timelineElement.value.scrollTop =
      useNodePosition(path).top.value);
    timelineElement.value.scrollTop = nodeTop - viewport.value.height / 2;
  }
};

watch(
  () => timelineStore.autoCenterSemaphore,
  () => {
    setInitialScrollAndScale();
  }
);

const timelineElement = ref<HTMLDivElement>();

const getViewport = (): Viewport => {
  if (!timelineElement.value) {
    return { left: 0, width: 0, top: 0, height: 0, offsetLeft: 0 };
  }
  const vp = {
    left: timelineElement.value.scrollLeft,
    width: timelineElement.value.clientWidth,
    top: timelineElement.value.scrollTop,
    height: timelineElement.value.clientHeight,
    offsetLeft: timelineElement.value.offsetLeft,
  };
  return vp;
};

const setViewport = (v: Viewport) => {
  if (!timelineElement.value) {
    return;
  }
  timelineElement.value.scrollLeft = v.left;
  timelineElement.value.scrollTop = v.top;
};

// This needs to be separate from the watch below, for some reason
watch(
  () => timelineStore.pageSettings,
  (settings) => {
    const vp = { ...settings.viewport };
    nextTick(() => setViewport(vp));
  }
);

const widthChangeStartScrollLeft = ref<number | null>(null);
const widthChangeStartYearWidth = ref<number | null>(null);
watch(
  () => timelineStore.startedWidthChange,
  (started) => {
    const scrollLeft = timelineElement.value?.scrollLeft || 0;
    widthChangeStartScrollLeft.value = started ? scrollLeft ?? null : null;
    widthChangeStartYearWidth.value = timelineStore.pageSettings.scale;
  }
);

watch(
  () => timelineStore.pageSettings,
  (settings) => {
    if (!timelineStore.startedWidthChange || !timelineElement.value) {
      return;
    }
    const startCenter =
      widthChangeStartScrollLeft.value! + timelineElement.value.clientWidth / 2;
    const scale = settings.scale / (widthChangeStartYearWidth.value || 1);
    // timelineElement.value.scrollLeft =
    //   scale * startCenter - timelineElement.value.clientWidth / 2;
  },
  { deep: true }
);
watch(
  [
    () => timelineStore.pageTimelineMetadata.earliestTime,
    () => timelineStore.pageTimelineMetadata.latestTime,
  ],
  () => {
    nextTick(setViewportDateInterval);
  }
);

useResizeObserver(timelineElement, (entries) => {
  timelineStore.referenceDate = timelineStore.dateFromClientLeft(
    entries[0].target.clientLeft + entries[0].target.clientWidth / 2
  );
  timelineElement.value!.scrollLeft = timelineElement.value!.clientWidth * 2;
  nextTick(setViewportDateInterval);
});

const setViewportDateInterval = () => timelineStore.setViewport(getViewport());

const { trigger } = useHoveringMarker(timelineElement);

let scroll = () => {};

const { isPanning } = useGestures(timelineElement, () => {
  setViewportDateInterval();
});

const scrollToDate = (
  dateTime: DateTime,
  force: boolean = false,
  immediate: boolean = false
) => {
  timelineStore.referenceDate = dateTime;
  timelineElement.value!.scrollLeft = timelineElement.value!.clientWidth * 2;
};

const scrollToDateRangeImmediate = (
  dateRange?: DateRange,
  buffered: boolean = true
) => {
  if (!dateRange) {
    return;
  }
  const { width } = getViewport();
  // We still want to be zoomed out a bit
  const scale = scaleToGetDistance(width, dateRange) / (buffered ? 3 : 1);
  timelineStore.setPageScale(scale);
  nextTick(() => {
    scrollToDate(dateMidpoint(dateRange), true, true);
    setViewportDateInterval();
  });
};

const scrollToDateRange = (dateRange?: DateRange) => {
  if (!dateRange) {
    return;
  }
  if (timelineStore.shouldZoomWhenScrolling) {
    const { width } = getViewport();
    // We still want to be zoomed out a bit
    const scale = scaleToGetDistance(width, dateRange) / 3;
    timelineStore.setPageScale(scale);
    nextTick(() => {
      scrollToDate(dateMidpoint(dateRange));
      setViewportDateInterval();
    });
  } else {
    scrollToDate(dateMidpoint(dateRange), true);
  }
};

const scrollToNow = () => scrollToDate(DateTime.now(), true);
watch(
  [() => timelineStore.hideNowLine, () => timelineStore.goToNowSemaphore],
  () => scrollToNow()
);

const viewport = computed(() => timelineStore.pageSettings.viewport);
onActivated(() => {
  const viewportWithOffset = {
    left: viewport.value.left,
    top: viewport.value.top,
    width: viewport.value.width,
    height: viewport.value.height,
    offsetLeft: timelineElement.value?.offsetLeft || 0,
  };
  nextTick(() => setViewport(viewportWithOffset));
});

const setInitialScrollAndScale = () =>
  scrollToDateRangeImmediate(timelineStore.pageRange);

onMounted(() => {
  // scrollToNow();
  timelineStore.setViewportGetter(getViewport);
  const te = timelineElement.value!;
  te.scrollLeft = te.clientWidth * 2;
  scroll = () => {
    const scrollLeft = te.scrollLeft;
    const amount = {
      [diffScale]: ((te.clientWidth * 1.5) / timelineStore.pageScale) * 24,
    };
    if (scrollLeft < te.clientWidth / 2) {
      timelineStore.referenceDate = timelineStore.referenceDate.minus(amount);
      te.scrollLeft = te.clientWidth * 2;
    } else if (scrollLeft > te.clientWidth * 3.5) {
      timelineStore.referenceDate = timelineStore.referenceDate.plus(amount);
      te.scrollLeft = te.clientWidth * 2;
    }
    setViewportDateInterval();
    trigger();
  };
});

const svgParams = ref();
const svgHolder = ref<HTMLDivElement>();
const svgView = ref<typeof SvgView>();

const totalWidth = computed(() => {
  const range = ranges(timelineStore.transformedEvents, recurrenceLimit) || {
    fromDateTime: DateTime.now(),
    toDateTime: DateTime.now(),
  };
  return timelineStore.scalelessDistanceBetweenDates(
    range.fromDateTime,
    range.toDateTime
  );
});

markwhenStore.onGetSvg = (params) => {
  svgParams.value = { diffScale: "hours", showViewport: false, ...params };
  return new Promise((resolve, reject) => {
    // Set timeout seems to work better than nextTick (or nested nextTicks)
    setTimeout(() => {
      if (svgHolder.value?.firstChild) {
        const svgWidth = svgView.value!.getRightmostX();
        const svgHeight = totalWidth.value;
        const ratio = svgWidth / svgHeight;

        const data = new XMLSerializer().serializeToString(
          svgHolder.value.firstChild
        );

        resolve({
          svg: data,
          ratio,
        });
      }
      resolve(null);
    }, 500);
  });
};

const webkitOverflowScrolling = ref("auto");
</script>

<template>
  <div
    class="flex flex-row w-full h-full"
    :class="timelineStore.darkMode ? 'dark' : ''"
  >
    <div
      id="timeline"
      class="relative overflow-auto w-full dark:text-white text-gray-900 bg-white dark:bg-slate-800"
      ref="timelineElement"
      @scroll="scroll"
      @gestureChange="scroll"
    >
      <TimeMarkersBack />
      <now-line />
      <ReferenceDateVue v-if="false"></ReferenceDateVue>
      <Events />
      <!-- <TimeMarkersFront /> -->
      <Settings></Settings>
      <!-- <DebugView v-if="true" /> -->
      <div ref="svgHolder" style="width: 0; height: 0">
        <SvgView v-if="svgParams" v-bind="svgParams" ref="svgView"></SvgView>
      </div>
    </div>
  </div>
</template>

<style>
</style>
