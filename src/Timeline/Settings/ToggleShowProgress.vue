<script setup lang="ts">
import { useTimelineStore } from "../timelineStore";
import SettingsButton from "./SettingsButton.vue";

const timelineStore = useTimelineStore();

const click = () => {
  timelineStore.progressDisplay =
    timelineStore.progressDisplay === "off" ? "on" : "off";
};
</script>

<template>
  <SettingsButton @click="click" hover-hint-title="Toggle progress indicator">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="w-4 h-4"
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
      <path d="M9 11l3 3l8 -8"></path>
      <path
        d="M20 12v6a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h9"
      ></path>
    </svg>
  </SettingsButton>
</template>

<style scoped></style>
