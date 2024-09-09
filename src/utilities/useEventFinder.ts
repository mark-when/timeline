import type { EventPath } from "@/Timeline/paths";
import { useTimelineStore } from "@/Timeline/timelineStore";
import { get, type Eventy } from "@markwhen/parser";
import type { MaybeRef } from "@vueuse/core";
import { computed, ref, watchEffect, unref } from "vue";

export type EventFinder = (eventPath?: EventPath | null) => Eventy | undefined;

export const useEventFinder = (path?: MaybeRef<EventPath | undefined>) => {
  const timelineStore = useTimelineStore();
  const transformedEvents = computed(() => timelineStore.transformedEvents);

  const event = ref<Eventy>();

  watchEffect(() => {
    if (!path) {
      event.value = undefined;
      return;
    }
    const eventPath = unref(path);
    if (!eventPath) {
      event.value = undefined;
      return;
    }
    let node: Eventy | undefined;
    node = transformedEvents.value;
    event.value = node ? get(node, eventPath) : undefined;
  });

  return event;
};
