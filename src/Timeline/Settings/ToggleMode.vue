<script setup lang="ts">
import SettingsButton from "@/Timeline/Settings/SettingsButton.vue";
import { useTimelineStore } from "../timelineStore";
const timelineStore = useTimelineStore();

const toggle = () => {
  timelineStore.mode = timelineStore.mode === "gantt" ? "timeline" : "gantt";
};
</script>

<template>
  <SettingsButton
    hover-hint-title="Gantt"
    @click="toggle"
    :selected="timelineStore.mode === 'gantt'"
  >
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" class="h-4 w-4">
      <path
        fill="currentColor"
        d="m 14 13 h -3 c -0.55 0 -1 -0.45 -1 -1 s 0.45 -1 1 -1 h 3 c 0.55 0 1 0.45 1 1 s -0.45 1 -1 1 z m 0 -4 h -5 c -0.55 0 -1 -0.45 -1 -1 s 0.45 -1 1 -1 h 5 c 0.55 0 1 0.45 1 1 s -0.45 1 -1 1 z m -6 -4 h -1 c -0.55 0 -1 -0.45 -1 -1 s 0.45 -1 1 -1 h 2 c 0.55 0 1 0.45 1 1 s -0.45 1 -1 1 z M 2 4 L 2 12.5 A 1 1 0 0 0 3 13.5 L 3.5 13.5 A 1 1 0 0 0 4.5 12.5 L 4.5 3.5 A 1 1 0 0 0 3.5 2.5 L 3 2.5 A 1 1 0 0 0 2 3.5 Z"
      ></path>
    </svg>
  </SettingsButton>
</template>

<style scoped></style>
