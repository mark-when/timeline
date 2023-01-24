import {
  equivalentPaths,
  type EventPath,
  type EventPaths,
} from "../paths";
import { computed, ref, watchEffect } from "vue";
import { useTimelineStore } from "../timelineStore";

export const useIsHoveredInEditor = (p: EventPath | EventPaths) => {
  const timelineStore = useTimelineStore();
  const currentlyHovering = computed(
    () => timelineStore.hoveringEventPaths || undefined
  );
  const isHoveredInEditor = ref(false);

  watchEffect(() => {
    isHoveredInEditor.value =
      equivalentPaths(
        currentlyHovering.value?.pageFiltered,
        "type" in p ? p : p["pageFiltered"]
      );
  });

  return { isHoveredInEditor };
};
