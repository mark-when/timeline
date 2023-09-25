<script setup lang="ts">
import { onMounted, ref } from "vue";
import { DateTime } from "luxon";
import { useTimelineStore } from "../timelineStore";
import { useNodeStore } from "../useNodeStore";

const timelineStore = useTimelineStore();
const nodeStore = useNodeStore();
const now = ref(DateTime.now());

const setNow = () => {
  now.value = DateTime.now();
  setTimeout(() => setNow(), 1000 * 60);
};

onMounted(() => {
  setNow();
});
</script>

<template>
  <div
    v-if="!timelineStore.hideNowLine"
    class="absolute dark:bg-slate-400 bg-blue-300 top-0 bottom-0"
    :style="`width: 1px; left: ${timelineStore.distanceFromBaselineLeftmostDate(
      now
    )}px; height: max(${nodeStore.viewHeight}, 100%);`"
  ></div>
</template>

<style scoped></style>
