import { equivalentPaths, type EventPath } from "../paths";
import { computed, ref, watchEffect } from "vue";
import { useTimelineStore } from "../timelineStore";

export const useIsHoveredInEditor = (p: EventPath) => {
  const timelineStore = useTimelineStore();
  const currentlyHovering = computed(
    () => timelineStore.hoveringEventPaths || undefined
  );
  const isHoveredInEditor = ref(false);

  watchEffect(() => {
    isHoveredInEditor.value = equivalentPaths(currentlyHovering.value, p);
  });

  return { isHoveredInEditor };
};
