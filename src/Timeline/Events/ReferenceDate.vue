<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { DateTime } from "luxon";
import { useTimelineStore } from "../timelineStore";

const timelineStore = useTimelineStore();
const reference = computed(() => timelineStore.referenceDate);
</script>

<template>
  <div
    class="absolute dark:bg-red-400 bg-red-300 top-0"
    :style="`width: 1px; left: ${timelineStore.distanceFromBaselineLeftmostDate(
      reference
    )}px; height: max(100vh, 100%);`"
  ></div>
</template>

<style scoped></style>
