import type { EventPath } from "@/Timeline/paths";
import { useTimelineStore } from "@/Timeline/timelineStore";
import type { SomeNode } from "@markwhen/parser";
import { get } from "@markwhen/parser";
import type { MaybeRef } from "@vueuse/core";
import { computed, ref, watchEffect, unref } from "vue";

export type EventFinder = (
  eventPath?: EventPath | null
) => SomeNode | undefined;

export const useEventFinder = (path?: MaybeRef<EventPath | undefined>) => {
  const timelineStore = useTimelineStore();
  const transformedEvents = computed(() => timelineStore.transformedEvents);

  const event = ref<SomeNode>();

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
    let node: SomeNode | undefined;
    node = transformedEvents.value;
    event.value = node ? get(node, eventPath) : undefined;
  });

  return event;
};
