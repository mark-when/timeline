<script setup lang="ts">
import { viewportLeftMarginPixels } from "../utilities/dateTimeUtilities";
import { DateTime } from "luxon";
import { computed } from "vue";
import { granularities } from "../utilities/DateTimeDisplay";
import { dateScale } from "../utilities/dateTimeUtilities";
import {
  timeMarkerWeightMinimum,
  useMarkersStore,
  Weight,
  type TimeMarker,
} from "./markersStore";
import { clamp, useTimelineStore } from "../timelineStore";
import Settings from "../Settings/Settings.vue";
const timelineStore = useTimelineStore();
const markerStore = useMarkersStore();

const leftMargin = viewportLeftMarginPixels;

const currentDateResolution = computed(() => {
  for (let i = 0; i < timelineStore.weights.length; i++) {
    if (timelineStore.weights[i] > timeMarkerWeightMinimum) {
      return i;
    }
  }
  return Weight.DECADE;
});
const scaleForThisDate = computed(
  () => (timeMarker: TimeMarker) => dateScale(timeMarker.dateTime)
);
const alpha = computed(
  () => (timeMarker: TimeMarker) =>
    0.8 * timelineStore.weights[scaleForThisDate.value(timeMarker)]
);
const text = computed(
  () => (timeMarker: TimeMarker) =>
    granularities[currentDateResolution.value][
      scaleForThisDate.value(timeMarker)
    ](timeMarker.dateTime)
);
const opacity = computed(
  () => (timeMarker: TimeMarker) => clamp((alpha.value(timeMarker) - 0.3) * 5)
);
const isHovering = computed(
  () => (timeMarker: TimeMarker) =>
    markerStore.hoveringMarker &&
    +markerStore.hoveringMarker?.dateTime === +timeMarker.dateTime
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
  <div class="fixed inset-0 pointer-events-none">
    <div
      class="flex relative bg-white/95 dark:bg-zinc-800 dark:border-zinc-600 border-b"
    >
      <!-- <SquashBars /> -->
      <div
        v-for="timeMarker in markerStore.markers"
        :key="timeMarker.ts"
        class="flex-shrink-0 h-full flex flex-col"
        :class="{
          'border-l border-zinc-200 dark:border-zinc-500':
            opacity(timeMarker) >= 1,
        }"
        :style="{
          left: `${
            timelineStore.pageScaleBy24 *
              (timeMarker.accumulated - timeMarker.size) +
            timelineStore.leftInsetWidth -
            viewportLeftMarginPixels
          }px`,
          width: `${timelineStore.pageScaleBy24 * timeMarker.size}px`,
        }"
      >
        <h6
          :class="{ 'font-bold': isHovering(timeMarker) }"
          class="timeMarkerTitle text-sm whitespace-nowrap dark:text-white text-black pl-1"
          :style="{
            opacity: isHovering(timeMarker) ? 1 : opacity(timeMarker),
          }"
        >
          {{ text(timeMarker) }}
        </h6>
        <div
          v-if="currentDateResolution <= 6"
          class="flex flex-row pl-1"
        >
          <h6
            class="whitespace-nowrap text-xs font-bold"
            v-if="isHovering(timeMarker)"
          >
            {{ hoveringText(timeMarker) }}
          </h6>
          <h6 class="whitespace-nowrap text-xs font-bold">&nbsp;</h6>
        </div>
      </div>
    </div>
    <Settings />
  </div>
</template>

<style scoped>
.timeMarkerShader {
  z-index: -1;
  background: linear-gradient(to bottom, #ffffff, 85%, #ffffff00);
}

.dark .timeMarkerShader {
  background: linear-gradient(to bottom, rgb(51, 65, 85), 85%, #38404700);
}
</style>
