import { useCollapseStore } from "@/Timeline/collapseStore";
import type { Path } from "@markwhen/parser/lib/Types";
import type { MaybeRef } from "@vueuse/core";
import { computed, unref } from "vue";
import { useTimelineStore } from "../../timelineStore";
import { useNodeStore } from "../../useNodeStore";

export const useNodePosition = (path: MaybeRef<Path>) => {
  const collapseStore = useCollapseStore();
  const nodeStore = useNodeStore();

  const collapsedParent = computed(() =>
    collapseStore.isCollapsedChildOf(unref(path))
  );

  const isCollapsed = computed(() => !!collapsedParent.value);

  const top = computed(() => {
    const numAbove = nodeStore.predecessorMap.get(
      collapsedParent.value
        ? collapsedParent.value.join(",")
        : unref(path).join(",")
    )!;

    return 100 + numAbove * 30;
  });

  return { top, isCollapsed };
};
