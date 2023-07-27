<script setup lang="ts">
import { useTimelineStore } from "../timelineStore";
import SettingsButton from "./SettingsButton.vue";

const timelineStore = useTimelineStore();

const click = () => {
  timelineStore.dateTimeDisplay =
    timelineStore.dateTimeDisplay === "off" ? "original" : "off";
};
</script>

<template>
  <SettingsButton @click="click" hover-hint-title="Toggle date ranges">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="h-4 w-4"
      width="40"
      height="40"
      viewBox="0 0 24 24"
      stroke-width="2.5"
      stroke="currentColor"
      fill="none"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
      <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0"></path>
      <path d="M12 7v5l3 3"></path>
    </svg>
  </SettingsButton>
</template>

<style scoped></style>
