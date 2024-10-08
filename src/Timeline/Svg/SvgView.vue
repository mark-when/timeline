<script setup lang="ts">
import { DateTime } from "luxon";
import { computed, nextTick, onMounted, ref, watch } from "vue";
import type { Path, Event, Eventy } from "@markwhen/parser";
import { isEvent } from "@markwhen/parser";
import { useNodeStore } from "@/Timeline/useNodeStore";
import { recurrenceLimit } from "@/Timeline/timelineStore";
import EventRowSvg from "./EventRowSvg.vue";
import MarkersSvg, { type ShowMarkers } from "./MarkersSvg.vue";
import { ranges } from "@/utilities/ranges";
import type { Era } from "./types";
import { useCollapseStore } from "../collapseStore";

const nodeStore = useNodeStore();
const collapseStore = useCollapseStore();

const dist = (a: DateTime, b: DateTime, diffScale: "hours" = "hours") =>
  b.diff(a).as(diffScale);

const ourProps = defineProps<{
  diffScale: "hours";
  dark: boolean;
  bg?: string;
  showViewport: boolean;
  scale?: number;
  showDateText: boolean;
  showEventTitles: boolean;
  rowHeight: number;
  roundedRight: boolean;
  roundedLeft: boolean;
  showMarkers?: ShowMarkers;
  eras?: (Era | { left: number; width: number })[];
}>();

const computedEras = computed(() =>
  (ourProps.eras || []).map((era) => ({
    left:
      "left" in era
        ? era.left
        : dist(earliestTime.value, era.dateRange.fromDateTime),
    width:
      "width" in era
        ? era.width
        : dist(era.dateRange.fromDateTime, era.dateRange.toDateTime),
  }))
);

const scale = computed(() => ourProps.scale || 1);

const totalRange = computed(
  () =>
    ranges(nodeStore.nodes!, recurrenceLimit) || {
      fromDateTime: DateTime.now(),
      toDateTime: DateTime.now(),
    }
);

const totalWidth = computed(() => {
  return dist(totalRange.value.fromDateTime, totalRange.value.toDateTime);
});

const viewBoxWidth = ref(totalWidth.value);

const heightUnit = computed(() => totalWidth.value / nodeStore.height);

const earliestTime = computed(() => totalRange.value.fromDateTime);
const latestTime = computed(() => totalRange.value.toDateTime);

const props = <T extends Eventy>(path: Path, eventy: T) => ({
  eventy,
  path: path.join(","),
  numChildren: nodeStore.childrenMap.get(path.join(",")) || 0,
  numAbove: nodeStore.predecessorMap.get(path.join(",")) || 0,
  totalHeight: nodeStore.height,
  totalWidth: totalWidth.value,
  height: nodeStore.predecessorMap.get(path.join(","))! + 1,
  heightUnit: heightUnit.value,
  earliestTime: earliestTime.value,
  latestTime: latestTime.value,
  dark: ourProps.dark,
  scale: scale.value,
  showDateText: ourProps.showDateText,
  showEventTitles: ourProps.showEventTitles,
  rowHeight: ourProps.rowHeight,
  roundedLeft: ourProps.roundedLeft,
  roundedRight: ourProps.roundedRight,
});

const rows = ref<[typeof EventRowSvg]>();
const getRightmostX = () => {
  if (!rows.value) {
    return 0;
  }
  let max = 0;
  for (let i = 0; i < rows.value.length; i++) {
    const rowMaxX = rows.value[i].getRightmostX();
    if (rowMaxX > max) {
      max = rowMaxX;
    }
  }
  return max;
};

defineExpose({ getRightmostX });

const setWidth = () => {
  viewBoxWidth.value = getRightmostX() + heightUnit.value * 2;
};

watch(ourProps, (p) => {
  nextTick(() => setWidth());
});

const textFontSize = computed(
  () => ((heightUnit.value / 1.5) * ourProps.rowHeight) / 3
);

const startX = computed(() => -heightUnit.value);
const startY = computed(() => heightUnit.value);

onMounted(() => setWidth());
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :viewBox="`${startX} ${startY} ${viewBoxWidth} ${
      (rowHeight + 2) * nodeStore.height
    }`"
    fill="currentColor"
    preserveAspectRatio="xMinYMin meet"
    class="w-full h-full"
  >
    <svg:style>
      .svgDateText {
        font: bold {{ textFontSize }}px system-ui;
        fill: #93979a;
      }
      .svgEventTitle {
        font: normal {{ textFontSize }}px system-ui;
        fill: {{ dark ? 'white' : 'black' }};
      }
      .svgMarkerText {
        font: normal {{ textFontSize }}px system-ui;
        fill: #93979a;
      }
    </svg:style>
    <MarkersSvg
      :showMarkers="showMarkers"
      :earliestTime="earliestTime"
      :latestTime="latestTime"
      :scale="scale"
      :totalWidth="totalWidth"
      :heightUnit="heightUnit"
      :startY="startY"
      :dark="dark"
    ></MarkersSvg>
    <template v-for="({ path, eventy }, index) in nodeStore.nodeArray">
      <EventRowSvg
        ref="rows"
        :key="path.join(',') + eventy.firstLine?.datePart"
        v-if="isEvent(eventy) && !collapseStore.isCollapsedChild(path)"
        v-bind="props(path, eventy)"
      ></EventRowSvg>
    </template>
    <rect
      v-for="era in computedEras"
      :x="era.left"
      :y="0"
      :width="era.width"
      :height="heightUnit * (nodeStore.height + 4)"
      :fill="`rgba(${dark ? '255, 255, 255' : '0, 0, 0'}, 0.1)`"
    ></rect>
  </svg>
</template>

<style scoped></style>
