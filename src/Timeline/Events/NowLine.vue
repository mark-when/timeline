<script setup lang="ts">
import { onMounted, ref } from "vue";
import { DateTime } from "luxon";
import { useTimelineStore } from "../timelineStore";

const timelineStore = useTimelineStore();
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
    class="absolute dark:bg-slate-400 bg-blue-300"
    :style="`width: 1px; left: ${
      timelineStore.distanceFromReferenceDate(now) +
      timelineStore.leftInsetWidth
    }px; height: max(100vh, 100%);`"
  ></div>
</template>

<style scoped></style>
