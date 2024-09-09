<script setup lang="ts">
import { useTimelineStore } from "@/Timeline/timelineStore";
import { computed } from "vue";
import NewEvent from "./NewEvent/NewEvent.vue";
import { useNodeStore } from "../useNodeStore";
import EventNodeRow from "./EventNodeRow.vue";
import type { Path } from "@markwhen/parser";
import GanttSidebar from "../Gantt/GanttSidebar.vue";
import Section from "./Section/Section.vue";
import type { Eventy } from "@markwhen/parser";

const timelineStore = useTimelineStore();

const nodeStore = useNodeStore();

const height = computed(() => {
  const nodeArray = nodeStore.nodeArray;
  if (nodeArray.length) {
    return `${nodeArray.length * 30 + 500}px`;
  } else {
    return "100%";
  }
});

const props = <T extends Eventy>(path: Path, eventy: T) => ({
  eventy,
  path: path.join(","),
  numChildren: nodeStore.childrenMap.get(path.join(",")),
  numAbove: nodeStore.predecessorMap.get(path.join(",")) || 0,
});

const currentWidth = computed(() => {
  if (timelineStore.ganttSidebarTempWidth) {
    return timelineStore.ganttSidebarTempWidth;
  }
  return timelineStore.ganttSidebarWidth;
});
const width = computed(() => {
  return timelineStore.pageSettings.viewport.width * 7;
});
const mousemove = (e: MouseEvent) => {
  console.log(e.clientX + timelineStore.baseOffset);
  const hovering = timelineStore.dateFromClientLeft(e.clientX);
  timelineStore.hoveringDate = hovering;
};
</script>

<template>
  <!-- <div
    id="events"
    class="flex flex-col relative"
    :style="`height: max(${height}, 100vh); width: ${width}px;`"
    @mousemove="mousemove"
  > -->
  <!-- <now-line />
    <ReferenceDateVue></ReferenceDateVue>
    <HoverDateVue></HoverDateVue> -->
  <div
    v-if="timelineStore.mode === 'gantt'"
    class="sticky left-0 relative flex flex-col bg-white dark:bg-zinc-800 top-0 bottom-0 z-[2] h-full"
    :style="`width: calc(${currentWidth}px);`"
  ></div>
  <template
    v-for="{ path, eventy } in nodeStore.visibleNodes[1]"
    :key="nodeStore.sectionKeys.get(path.join(','))"
  >
    <Section v-bind="props(path, eventy)"></Section>
  </template>
  <template
    v-for="{ path, eventy, key } in nodeStore.visibleNodes[0]"
    :key="key"
  >
    <EventNodeRow v-bind="props(path, eventy)"></EventNodeRow>
  </template>
  <new-event />
  <GanttSidebar />
  <!-- </div> -->
</template>

<style scoped></style>
