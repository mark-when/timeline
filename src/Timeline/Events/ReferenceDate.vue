<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useTimelineStore } from "../timelineStore";

const timelineStore = useTimelineStore();
const reference = computed(() => {
  return timelineStore.distanceFromBaselineLeftmostDate(
    timelineStore.referenceDate
  );
});
</script>

<template>
  <div
    class="absolute dark:bg-red-400 bg-red-300 top-0"
    :style="`width: 1px; left: ${reference}px; height: max(100vh, 100%);`"
  ></div>
</template>

<style scoped></style>
