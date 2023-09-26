<script setup lang="ts">
import { viewportLeftMarginPixels } from "../utilities/dateTimeUtilities";
import { computed, ref } from "vue";
import { dateScale } from "@/Timeline/utilities/dateTimeUtilities";
import {
  useMarkersStore,
  Weight,
  type TimeMarker,
} from "@/Timeline/Markers/markersStore";
import { useWeekdayCache } from "../utilities/weekdayCache";
import {
  clamp,
  timeMarkerWeightMinimum,
  useTimelineStore,
} from "../timelineStore";
import { isEventNode } from "@markwhen/parser";
import { toDateRange } from "@markwhen/parser";
import { useEventColor } from "../Events/composables/useEventColor";
import { equivalentPaths } from "../paths";
import { useNodeStore, walk } from "../useNodeStore";
import { DateTime } from "luxon";
import { granularities } from "../utilities/DateTimeDisplay";

const markersStore = useMarkersStore();
const timelineStore = useTimelineStore();
const { getWeekday } = useWeekdayCache();
const dark = computed(() => timelineStore.darkMode);
const nodeStore = useNodeStore();

const leftMargin = viewportLeftMarginPixels;

const backgroundColor = computed(() => (tm: TimeMarker) => {
  if (timelineStore.weights[Weight.DAY] > 0.3) {
    const weekday = getWeekday(tm.dateTime);
    const a = Math.min(timelineStore.weights[Weight.DAY] * 0.3, 0.5);
    if (
      (typeof weekday === "number" && weekday === 6) ||
      weekday === 7 ||
      // @ts-ignore
      weekday.weekday === 6 ||
      // @ts-ignore
      weekday.weekday === 7
    ) {
      return dark.value
        ? `rgba(10, 10, 10, ${a})`
        : `rgba(170, 170, 170, ${a})`;
    }
  }
  return "unset";
});

const hovering = computed(() => (tm: TimeMarker) => {
  const h = markersStore.hoveringMarker;
  if (!h) {
    return false;
  }
  return +tm.dateTime === +h.dateTime;
});

const alpha = computed(
  () => (tm: TimeMarker) => timelineStore.weights[dateScale(tm.dateTime)]
);

const borderColor = computed(() => (tm: TimeMarker) => {
  const a = hovering.value(tm) ? 1 : (alpha.value(tm) - 0.3) * 2;
  return dark.value ? `rgba(71, 85, 105, ${a})` : `rgba(200, 200, 200, ${a})`;
});

const eras = computed(() => {
  const erasAndMilestoneEvents = [] as any[];
  if (!timelineStore.transformedEvents) {
    return [];
  }
  walk(timelineStore.transformedEvents, [], (node, path) => {
    if (
      isEventNode(node) &&
      ["era", "milestone"].some((t) =>
        node.value.eventDescription.tags.map((t) => t.toLowerCase()).includes(t)
      )
    ) {
      const { fromDateTime, toDateTime } = toDateRange(node.value.dateRangeIso);
      const color = useEventColor(node).color.value;
      const isHovering = equivalentPaths(
        timelineStore.hoveringEventPaths,
        path
      );
      const styleObj = {
        left:
          timelineStore.distanceFromViewportLeftDate(fromDateTime) +
          timelineStore.leftInsetWidth -
          viewportLeftMarginPixels,
        width: Math.max(
          2,
          timelineStore.distanceBetweenDates(fromDateTime, toDateTime)
        ),
      } as any;
      if (color) {
        styleObj.backgroundColor = `rgba(${color}, ${isHovering ? 0.15 : 0.1})`;
        styleObj.borderColor = `rgba(${color}, ${isHovering ? 0.75 : 0.3})`;
      }
      erasAndMilestoneEvents.push(styleObj);
    }
  });
  return erasAndMilestoneEvents;
});
const scaleForThisDate = computed(
  () => (timeMarker: TimeMarker) => dateScale(timeMarker.dateTime)
);

const currentDateResolution = computed(() => {
  for (let i = 0; i < timelineStore.weights.length; i++) {
    if (timelineStore.weights[i] > timeMarkerWeightMinimum) {
      return i;
    }
  }
  return Weight.DECADE;
});
const text = computed(
  () => (timeMarker: TimeMarker) =>
    granularities[currentDateResolution.value][
      scaleForThisDate.value(timeMarker)
    ](timeMarker.dateTime)
);
const opacity = computed(
  () => (timeMarker: TimeMarker) => clamp((alpha.value(timeMarker) - 0.45) * 5)
);
const isHovering = computed(
  () => (timeMarker: TimeMarker) =>
    markersStore.hoveringMarker &&
    +markersStore.hoveringMarker?.dateTime === +timeMarker.dateTime
);
const hoveringText = computed(() => (timeMarker: TimeMarker) => {
  const dt = timeMarker.dateTime;
  if (currentDateResolution.value > 5) {
    return dt.year;
  }
  if (currentDateResolution.value > 3) {
    return dt.toLocaleString(DateTime.DATE_HUGE);
  }
  return dt.toLocaleString(DateTime.DATETIME_HUGE_WITH_SECONDS);
});
</script>

<template>
  <!-- <div class="fixed inset-0 overflow-scroll"> -->
  <!-- <div
    class="flex flex-row relative"
    :style="`margin-left: -${leftMargin}px; height: max(${height}, 100%)`"
  > -->
  <div
    class="fixed top-0 left-0 right-0 h-6 bg-white/95 dark:bg-slate-800/95 z-30 border-b dark:border-slate-700"
  ></div>
  <div
    v-for="timeMarker in markersStore.markers"
    :id="'' + timeMarker.ts"
    :key="timeMarker.ts"
    class="h-full flex-shrink-0 absolute top-0 bottom-0"
    :style="{
      backgroundColor: backgroundColor(timeMarker),
      width: `${timelineStore.pageScaleBy24 * timeMarker.size}px`,
      left: `${
        timelineStore.pageScaleBy24 *
          (timeMarker.accumulated - timeMarker.size)
      }px`,
      borderLeft: `1px ${
        hovering(timeMarker) ? 'solid' : 'dashed'
      } ${borderColor(timeMarker)}`,
      height: `max(${nodeStore.viewHeight}, 100%)`,
    }"
  >
    <div
      class="sticky top-0 -m-px"
      :class="{
        'font-bold z-50 dark:border-slate-400 border-slate-500':
          isHovering(timeMarker),
        'z-40 dark:border-slate-600': !isHovering(timeMarker),
      }"
    >
      <h6
        class="timeMarkerTitle text-sm whitespace-nowrap dark:text-white text-black pl-1 border-l border-inherit"
        :style="{
          opacity: isHovering(timeMarker) ? 1 : opacity(timeMarker),
        }"
      >
        {{ text(timeMarker) }}
      </h6>
      <div v-if="currentDateResolution <= 6" class="flex flex-row">
        <h6
          class="whitespace-nowrap text-xs font-bold dark:bg-slate-800 bg-white border-l p-1 dark:border-slate-400 border-slate-500"
          v-if="isHovering(timeMarker)"
        >
          {{ hoveringText(timeMarker) }}
        </h6>
        <h6 class="whitespace-nowrap text-xs font-bold">&nbsp;</h6>
      </div>
    </div>
  </div>
  <!-- </div> -->
  <div
    v-for="era in eras"
    class="absolute top-0 bottom-0 h-full border-l border-r transition"
    :class="
      !era.backgroundColor
        ? `bg-gray-300/50 dark:bg-gray-300/10 border-gray-500/50`
        : ''
    "
    :style="{
      left: `${era.left}px`,
      width: `${era.width}px`,
      backgroundColor: era.backgroundColor,
      borderColor: era.borderColor,
    }"
  ></div>
  <!-- </div> -->
</template>

<style>
.timeMarkerShader {
  z-index: -1;
  background: linear-gradient(to bottom, #ffffff, 85%, #ffffff00);
}

.dark .timeMarkerShader {
  background: linear-gradient(to bottom, rgb(51, 65, 85), 85%, #38404700);
}
</style>
