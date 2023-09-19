import type { SomeNode } from "@markwhen/parser";
import { isEventNode, eventValue } from "@markwhen/parser";
import { Event } from "@markwhen/parser";
import type { MaybeRef } from "@vueuse/core";
import { ref, unref, watchEffect } from "vue";
import { useTimelineStore } from "../../timelineStore";

export const useEventColor = (eventRef: MaybeRef<SomeNode>) => {
  const color = ref<string>();
  const timelineStore = useTimelineStore();

  watchEffect(() => {
    const node = unref(eventRef);
    let ourTags = isEventNode(node)
      ? eventValue(node).eventDescription.tags
      : node.tags;
    // @ts-ignore
    const source = node.source as string;
    color.value = ourTags
      ? timelineStore.colors[source || "default"][ourTags[0]]
      : undefined;
  });

  return { color };
};
