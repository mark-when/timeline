<script setup lang="ts">
import type { Node, SomeNode } from "@markwhen/parser/lib/Node";
import { computed, watch } from "vue";
import EventRow from "./Event/EventRow.vue";
import { equivalentPaths } from "@/Timeline/paths";
import { useEventRefs } from "./useEventRefs";
import {
  toDateRangeIso,
  type DateFormat,
  type DateRange,
  type Event,
} from "@markwhen/parser/lib/Types";
import { eventValue, isEventNode } from "@markwhen/parser/lib/Noder";
import { useTimelineStore } from "../timelineStore";

const props = defineProps<{
  node: SomeNode;
  path: string;
  numAbove: number;
  numChildren?: number | undefined;
}>();

const timelineStore = useTimelineStore();
const { editEventDateRange } = timelineStore;

// We have to do this otherwise props will be 'changed', causing an unnecessary patch
const pathArray = computed(() => props.path.split(",").map((i) => parseInt(i)));
const isEventRow = computed(() => isEventNode(props.node));

const hoveringPath = computed(() => timelineStore.hoveringEventPaths);

const {
  eventRange,
  eventLocations,
  supplemental,
  percent,
  matchedListItems,
  tags,
  color,
  dateText,
  titleHtml,
  completed,
  recurrence,
  source,
} = useEventRefs(
  computed(() => props.node as Node<Event>),
  () => isEventRow.value
);

const eventPath = computed(() => pathArray.value);
const scale = computed(() => timelineStore.scaleOfViewportDateInterval);

const preferredInterpolationFormat = computed(
  () =>
    timelineStore.pageTimelineMetadata.preferredInterpolationFormat as
      | DateFormat
      | undefined
);
const editDateRange = (range: DateRange) =>
  editEventDateRange(
    pathArray.value,
    toDateRangeIso(range),
    scale.value,
    preferredInterpolationFormat.value
  );

const hover = (hovering: boolean) => {
  if (hovering) {
    timelineStore.setHoveringEvent(
      props.path.split(",").map((i) => parseInt(i))
    );
  } else {
    timelineStore.clearHoveringEvent();
  }
};

const isDetailEvent = computed(() =>
  timelineStore.isDetailEventPath(eventPath.value)
);
</script>

<template>
  <EventRow
    :source="source || 'default'"
    :event-locations="eventLocations || []"
    :supplemental="supplemental || []"
    :matched-list-items="matchedListItems || []"
    :rangeFrom="eventRange!.fromDateTimeIso"
    :rangeTo="eventRange!.toDateTimeIso"
    :tags="tags || []"
    :color="color"
    :path="eventPath"
    :percent="percent"
    :dateText="dateText || ''"
    :titleHtml="titleHtml || ''"
    :completed="completed"
    :recurrence="recurrence"
    @edit-date-range="editDateRange"
    @hover="hover"
    :is-detail-event="isDetailEvent"
    :hovering="equivalentPaths(hoveringPath, eventPath)"
    :numAbove="numAbove"
  ></EventRow>
</template>

<style scoped></style>
