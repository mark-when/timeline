<script setup lang="ts">
import { usePanelResize } from "@/Timeline/composables/usePanelResize";
import { computed, watchEffect } from "vue";
import { useTimelineStore } from "../timelineStore";

const timelineStore = useTimelineStore();
const width = computed(() => timelineStore.ganttSidebarWidth);

const { tempWidth, resizeMouseDown } = usePanelResize(true, width, (w) =>
  timelineStore.setGanttSidebarWidth(w)
);
watchEffect(() => {
  timelineStore.setGanttSidebarTempWidth(tempWidth.value);
});
const currentWidth = computed(() => {
  if (tempWidth.value) {
    return tempWidth.value;
  }
  return width.value;
});
</script>

<template>
  <div
    class="fixed left-0 right-0 top-0 h-full pointer-events-none z-20"
    v-show="timelineStore.mode === 'gantt'"
  >
    <div class="flex w-full h-full">
      <div
        class="sticky left-0 relative flex flex-col"
        :style="`width: calc(${currentWidth}px)`"
      >
        <div class="h-full w-full">
          <div
            class="pointer-events-auto sticky hover:w-1 right-0 inline-flex items-center justify-center hover:transition hover:bg-indigo-600 dark:hover:bg-indigo-600 top-0 bottom-0 z-[5]"
            :class="{
              'bg-indigo-600 w-1': tempWidth,
              'bg-zinc-200 dark:bg-zinc-900 w-px': !tempWidth
            }"
            style="cursor: ew-resize"
            :style="`height: ${timelineStore.pageSettings.viewport.height}px; left: ${currentWidth}px`"
            @mousedown.prevent.stop="resizeMouseDown"
            @touchstart.prevent.stop="resizeMouseDown"
          >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
