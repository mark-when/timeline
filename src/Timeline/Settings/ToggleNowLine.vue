<script setup lang="ts">
import { useTimelineStore } from "../timelineStore";
import SettingsButton from "./SettingsButton.vue";

const timelineStore = useTimelineStore();

const toggleHideNowLine = () => {
  timelineStore.setHideNowLine(!timelineStore.hideNowLine);
};
</script>

<template>
  <SettingsButton
    title="Toggle now line"
    hoverHintTitle="Toggle now line"
    @click="toggleHideNowLine"
  >
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 2 17 12" class="h-4 w-4">
      <path
        d="m 2 3 a 1 1 0 0 0 0 2 h 11 a 1 1 0 1 0 0 -2 h -11 z m 1 4 a 1 1 0 0 0 0 2 h 11 a 1 1 0 0 0 0 -2 h -11 z m 1 4 a 1 1 0 1 0 0 2 h 11 a 1 1 0 1 0 0 -2 h -11 z"
        fill="currentColor"
      />
      <path d="M 9 1 L 9 15 L 11 15 L 11 1 L 11 1 Z" fill="currentColor"></path>
    </svg>
  </SettingsButton>
</template>

<style scoped></style>
