<script setup lang="ts">
import { computed, watch } from "vue";
import { useTimelineStore } from "../timelineStore";

const timelineStore = useTimelineStore();
const reference = computed(() => timelineStore.hoveringDate);
</script>

<template>
  <div
    class="absolute dark:bg-slate-400 bg-slate-700"
    :style="`width: 1px; left: ${timelineStore.distanceFromBaselineLeftmostDate(
      reference
    )}px; height: max(100vh, 100%);`"
  ></div>
</template>

<style scoped></style>
