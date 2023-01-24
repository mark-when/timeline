<script setup lang="ts">
import { useTimelineStore } from "../timelineStore";
import { computed } from "vue";
import SvgView from "@/Timeline/Svg/SvgView.vue";
import { DateTime } from "luxon";

const timelineStore = useTimelineStore();
const dark = computed(() => !!timelineStore.darkMode);
const styleLeftInset = computed(() => {
  let inset = timelineStore.pageSettings.viewport.offsetLeft;
  if (timelineStore.mode === "gantt") {
    return (
      inset +
      (timelineStore.ganttSidebarTempWidth
        ? timelineStore.ganttSidebarTempWidth
        : timelineStore.ganttSidebarWidth)
    );
  }
  return inset;
});

const vp = computed(() => timelineStore.pageSettings.viewport);
const additionalOffsetLeft = computed(() =>
  timelineStore.distanceFromBaselineLeftmostDate(
    DateTime.fromISO(timelineStore.pageTimelineMetadata.earliestTime)
  )
);

const vpLeft = computed(
  () =>
    (vp.value.left - additionalOffsetLeft.value) / timelineStore.pageScaleBy24
);
const width = computed(() => vp.value.width / timelineStore.pageScaleBy24);
</script>

<template>
  <div
    class="absolute dark:bg-slate-800 bg-slate-100 shadow-lg rounded-lg overflow-scroll p-2"
    :style="`left: calc(${styleLeftInset}px + 1rem); bottom: calc(env(safe-area-inset-bottom) + 3rem)`"
  >
    <SvgView
      diff-scale="hours"
      style="width: 8rem; height: 8rem"
      :dark="dark"
      :show-viewport="true"
      :scale="1"
      :show-date-text="false"
      :show-event-titles="false"
      :row-height="3"
      :roundedRight="true"
      :rounded-left="true"
      :eras="[{ left: vpLeft, width }]"
    />
  </div>
</template>

<style scoped></style>
