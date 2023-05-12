import type { SomeNode } from "@markwhen/parser/lib/Node";
import { isEventNode, eventValue } from "@markwhen/parser/lib/Noder";
import { Event } from "@markwhen/parser/lib/Types";
import type { MaybeRef } from "@vueuse/core";
import { ref, unref, watchEffect } from "vue";
import { useTimelineStore } from "../../timelineStore";

export const useEventColor = (eventRef: MaybeRef<SomeNode | Event>) => {
  const color = ref<string>();
  const timelineStore = useTimelineStore();

  watchEffect(() => {
    const node = unref(eventRef);
    let ourTags: string[] | undefined;
    if (node instanceof Event) {
      ourTags = node.eventDescription.tags;
    } else {
      ourTags = isEventNode(node)
        ? eventValue(node).eventDescription.tags
        : node.tags;
    }
    color.value = ourTags ? timelineStore.colors[ourTags[0]] : undefined;
  });

  return { color };
};
