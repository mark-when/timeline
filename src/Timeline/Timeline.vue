<script setup lang="ts">
import { onMounted, ref, watch, nextTick, onActivated, computed } from "vue";
import {
  useTimelineStore,
  type Viewport,
  recurrenceLimit,
} from "./timelineStore";
import { scaleToGetDistance } from "./initialPageSettings";
import TimeMarkersBack from "@/Timeline/Markers/TimeMarkersBack.vue";
import TimeMarkersFront from "@/Timeline/Markers/TimeMarkersFront.vue";
import Events from "@/Timeline/Events/Events.vue";
import { useGestures } from "@/Timeline/composables/useGestures";
import { useHoveringMarker } from "@/Timeline/composables/useHoveringMarker";
import { DateTime } from "luxon";
import { useResizeObserver } from "@vueuse/core";
import { toDateRange, type DateRange } from "@markwhen/parser/lib/Types";
import { dateMidpoint } from "./utilities/dateTimeUtilities";
// import { useEventFinder } from "@/Views/ViewOrchestrator/useEventFinder";
import { eventValue, isEventNode } from "@markwhen/parser/lib/Noder";
import DebugView from "./DebugView.vue";
import { ranges } from "@/utilities/ranges";
import { useNodePosition } from "./Events/composables/useNodePosition";
import { useEventFinder } from "@/utilities/useEventFinder";
import { useMarkwhenStore } from "@/Markwhen/markwhenStore";
import SvgView from "./Svg/SvgView.vue";

const timelineStore = useTimelineStore();
const markwhenStore = useMarkwhenStore();

markwhenStore.onJumpToRange = (range) => {
  scrollToDateRangeImmediate(toDateRange(range));
};

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
  return {
    left: timelineElement.value.scrollLeft,
    width: timelineElement.value.clientWidth,
    top: timelineElement.value.scrollTop,
    height: timelineElement.value.clientHeight,
    offsetLeft: timelineElement.value.offsetLeft,
  };
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
    // console.log(
    //   timelineElement.value?.offsetLeft,
    //   timelineElement.value?.scrollLeft
    // );
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
    timelineElement.value.scrollLeft =
      scale * startCenter - timelineElement.value.clientWidth / 2;
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
  nextTick(setViewportDateInterval);
});

const setViewportDateInterval = () => {
  // if (!ticking) {
  //   requestAnimationFrame(() => {
  timelineStore.setViewport(getViewport());
  //     ticking = false;
  //   });
  //   ticking = true;
  // }
};

const { trigger } = useHoveringMarker(timelineElement);

const scroll = () => {
  setViewportDateInterval();
  trigger();
};
const { isPanning } = useGestures(timelineElement, () => {
  setViewportDateInterval();
});

const scrollToDate = (
  dateTime: DateTime,
  force: boolean = false,
  immediate: boolean = false
) => {
  const el = timelineElement.value;
  if (el) {
    const fromLeft = timelineStore.distanceFromBaselineLeftmostDate(dateTime);
    const { left, width } = getViewport();

    const immediateScroll = () => {
      el.scrollLeft = fromLeft - width / 2;
    };

    // If it isn't already within view
    if (force || fromLeft < left || fromLeft > left + width) {
      immediate
        ? immediateScroll()
        : el.scrollTo({
            top: el.scrollTop,
            left: fromLeft - width / 2,
            behavior: "smooth",
          });
    }
  }
};

const scrollToDateRangeImmediate = (dateRange?: DateRange) => {
  if (!dateRange) {
    return;
  }
  const { width } = getViewport();
  // We still want to be zoomed out a bit
  const scale = scaleToGetDistance(width, dateRange) / 3;
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
  () => timelineStore.hideNowLine,
  (hide) => scrollToNow()
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
  setInitialScrollAndScale();
  timelineStore.setViewportGetter(getViewport);
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
</script>

<template>
  <div
    class="flex flex-row w-full h-full"
    :class="timelineStore.darkMode ? 'dark' : ''"
  >
    <div
      id="timeline"
      class="relative h-full overflow-auto w-full noScrollBar dark:text-white text-gray-900 bg-white dark:bg-slate-700"
      ref="timelineElement"
      @scroll="scroll"
      :style="{ cursor: isPanning ? 'grabbing' : 'grab' }"
    >
      <TimeMarkersBack />
      <Events />
      <TimeMarkersFront />
      <DebugView v-if="false" />
      <div ref="svgHolder" style="width: 0; height: 0">
        <SvgView v-if="svgParams" v-bind="svgParams" ref="svgView"></SvgView>
      </div>
    </div>
  </div>
</template>

<style></style>
