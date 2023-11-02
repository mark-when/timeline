<script setup lang="ts">
import SettingsButton from "./SettingsButton.vue";
import { useTimelineStore } from "../timelineStore";
import { onMounted } from "vue";

const timelineStore = useTimelineStore();

onMounted(() => {
  if (timelineStore.userRanges.length) {
    timelineStore.setRange(timelineStore.userRanges[0]);
  }
});
</script>

<template>
  <SettingsButton
    v-for="range in timelineStore.userRanges"
    @click="timelineStore.setRange(range)"
  >
    <span class="text-xs mt-px shrink-0">{{ range.title }}</span>
  </SettingsButton>
</template>

<style scoped></style>
