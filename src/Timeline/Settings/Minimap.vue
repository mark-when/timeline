<script setup lang="ts">
import { useTimelineStore } from "../timelineStore";
import { computed } from "vue";
import SvgView from "@/Timeline/Svg/SvgView.vue";
import { DateTime } from "luxon";

const timelineStore = useTimelineStore();
const dark = computed(() => !!timelineStore.darkMode);

const vp = computed(() => timelineStore.pageSettings.viewport);
const additionalOffsetLeft = computed(() => {
  let { earliestTime } = timelineStore.pageTimelineMetadata;
  earliestTime ||= DateTime.now().plus({ years: 1 }).toISO();
  return timelineStore.distanceFromReferenceDate(
    DateTime.fromISO(earliestTime)
  );
});

const vpLeft = computed(
  () =>
    (vp.value.left - additionalOffsetLeft.value) / timelineStore.pageScaleBy24
);
const width = computed(() => vp.value.width / timelineStore.pageScaleBy24);
</script>

<template>
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
</template>

<style scoped></style>
