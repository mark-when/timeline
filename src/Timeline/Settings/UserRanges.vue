<script setup lang="ts">
import { computed } from "vue";
import { useMarkwhenStore } from "@/Markwhen/markwhenStore";
import SettingsButton from "./SettingsButton.vue";
import { RECURRENCE_AMOUNT_REGEX } from "@markwhen/parser";
import { DateTime, type DurationUnit } from "luxon";
import type { DateRange } from "@markwhen/parser";
import { useTimelineStore } from "../timelineStore";

const markwhenStore = useMarkwhenStore();
const timelineStore = useTimelineStore()

const userRanges = computed(() => {
  const ranges = markwhenStore.markwhen?.parsed[0].header.ranges;
  const parsedRanges: (DateRange & { title: string })[] = [];
  if (ranges && Array.isArray(ranges)) {
    const now = DateTime.now();
    for (let i = 0; i < ranges.length; i++) {
      let r = ranges[i];
      let regex = new RegExp(`^${RECURRENCE_AMOUNT_REGEX.source}$`);
      const match = regex.exec(r);
      if (match) {
        const amount = parseInt(match[1]);
        if (isNaN(amount)) {
          continue;
        }
        const unit: DurationUnit = !!match[3]
          ? "milliseconds"
          : !!match[4]
          ? "seconds"
          : !!match[5]
          ? "minutes"
          : !!match[6]
          ? "hours"
          : !!match[8]
          ? "days"
          : !!match[9]
          ? "weeks"
          : match[10]
          ? "months"
          : "years";
        const duration = { [unit]: amount / 2 };
        parsedRanges.push({
          title: r,
          fromDateTime: now.minus(duration),
          toDateTime: now.plus(duration),
        });
      }
    }
  }
  return parsedRanges;
});
</script>

<template>
  <SettingsButton v-for="range in userRanges" @click="timelineStore.setRange(range)">
    <span class="text-xs mt-px shrink-0">{{ range.title }}</span>
  </SettingsButton>
</template>

<style scoped></style>
