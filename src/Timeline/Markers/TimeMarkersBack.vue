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
import { walk } from "../useNodeStore";
import { DateTime } from "luxon";
import { granularities } from "../utilities/DateTimeDisplay";
import { useGestures } from "../composables/useGestures";

const markersStore = useMarkersStore();
const timelineStore = useTimelineStore();
const { getWeekday } = useWeekdayCache();
const dark = computed(() => timelineStore.darkMode);

const leftMargin = viewportLeftMarginPixels;

const backgroundColor = computed(() => (tm: TimeMarker) => {
  if (timelineStore.weights[Weight.HOUR]) {
    const weekday = getWeekday(tm.dateTime);
    const a = timelineStore.weights[Weight.DAY] * 0.2;
    if (weekday === 6 || weekday === 7) {
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
</script>

<template>
  <div class="fixed inset-0">
    <div
      class="flex flex-row h-full relative"
      :style="`margin-left: -${leftMargin}px`"
    >
      <div
        v-for="timeMarker in markersStore.markers"
        :key="timeMarker.ts"
        class="h-full flex-shrink-0 absolute top-0 bottom-0"
        :style="{
          backgroundColor: backgroundColor(timeMarker),
          width: `${timelineStore.pageScaleBy24 * timeMarker.size}px`,
          left: `${
            timelineStore.pageScaleBy24 *
              (timeMarker.accumulated - timeMarker.size) +
            timelineStore.leftInsetWidth +
            viewportLeftMarginPixels
          }px`,
          borderLeft: `1px ${
            hovering(timeMarker) ? 'solid' : 'dashed'
          } ${borderColor(timeMarker)}`,
        }"
      ></div>
    </div>
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
  </div>
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
