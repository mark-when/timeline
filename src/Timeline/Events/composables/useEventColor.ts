import type { Eventy } from "@markwhen/parser";
import type { MaybeRef } from "@vueuse/core";
import { ref, unref, watchEffect } from "vue";
import { useTimelineStore } from "../../timelineStore";
import type { Sourced } from "@/Markwhen/useLpc";

export const useEventColor = (eventRef: MaybeRef<Sourced<Eventy>>) => {
  const color = ref<string>();
  const timelineStore = useTimelineStore();

  watchEffect(() => {
    const node = unref(eventRef);
    let ourTags = node.tags;
    const source = node.source;
    color.value = ourTags
      ? timelineStore.colors[source || "default"][ourTags[0]]
      : undefined;
  });

  return { color };
};
