<script setup lang="ts">
import { useTimelineStore } from "../timelineStore";
import { computed } from "vue";
import TimelineScale from "../Settings/TimelineScale.vue";
import Minimap from "./Minimap.vue";
import AutoCenter from "./AutoCenter.vue";
import ToggleMiniMap from "./ToggleMiniMap.vue";
import CollapseAll from "./CollapseAll.vue";
import ExpandAll from "./ExpandAll.vue";
import ToggleMode from "./ToggleMode.vue";
import ToggleNowLine from "./ToggleNowLine.vue";

const timelineStore = useTimelineStore();
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
</script>

<template>
  <div
    class="absolute settingsGrid gap-2 dark:text-gray-300 text-gray-500"
    :style="`left: calc(${styleLeftInset}px + 1rem); bottom: 1rem;`"
  >
    <div
      class="flex flex row overflow-visible p-[2px] pointer-events-auto dark:bg-slate-800 bg-slate-100 shadow rounded"
      style="grid-area: gantt"
    >
      <ToggleMode></ToggleMode>
    </div>
    <div
      class="flex"
      style="grid-area: minimap"
      v-if="timelineStore.miniMapShowing"
    >
      <div
        class="p-2 pointer-events-auto dark:bg-slate-800 bg-slate-100 shadow rounded"
      >
        <Minimap />
      </div>
    </div>
    <div
      class="flex flex row overflow-visible p-[2px] pointer-events-auto dark:bg-slate-800 bg-slate-100 shadow rounded"
      style="grid-area: view"
    >
      <ToggleMiniMap></ToggleMiniMap>
      <TimelineScale></TimelineScale>
      <AutoCenter></AutoCenter>
    </div>
    <!-- </div> -->
    <div
      class="dark:bg-slate-800 bg-slate-100 shadow rounded overflow-visible p-[2px] pointer-events-auto flex flex-row"
      style="grid-area: collapse"
    >
      <ExpandAll></ExpandAll>
      <CollapseAll></CollapseAll>
      <ToggleNowLine></ToggleNowLine>
    </div>
  </div>
</template>

<style scoped>
.settingsGrid {
  display: grid;
  grid-template-areas:
    ". minimap ."
    "gantt view collapse";
}
</style>
