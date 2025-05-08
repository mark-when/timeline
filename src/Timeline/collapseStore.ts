import { useMarkwhenStore } from "@/Markwhen/markwhenStore";
import { defineStore } from "pinia";
import { isEvent, iter } from "@markwhen/parser";
import type { Path } from "@markwhen/parser";
import { useTimelineStore } from "./timelineStore";
import { ref } from "vue";

export const useCollapseStore = defineStore("collapse", () => {
  const markwhenStore = useMarkwhenStore();
  const timelineStore = useTimelineStore();

  // Initial state
  const collapsed = ref(
    (() => {
      const mw = markwhenStore.markwhen?.parsed;
      const set = new Set<string>();
      return set;
    })()
  );

  const collapse = (path: Path) => {
    collapsed.value.add(path.join(","));
  };
  const expand = (path: Path) => {
    collapsed.value.delete(path.join(","));
  };
  const toggleCollapsed = (path: Path) => {
    const pathJoined = path.join(",");
    if (collapsed.value.has(pathJoined)) {
      collapsed.value.delete(pathJoined);
    } else {
      collapsed.value.add(pathJoined);
    }
  };
  const setCollapsed = (path: Path | string, shouldCollapse: boolean) => {
    const pathJoined = typeof path === "string" ? path : path.join(",");
    if (shouldCollapse) {
      collapsed.value.add(pathJoined);
    } else {
      collapsed.value.delete(pathJoined);
    }
  };
  const isCollapsed = (path: Path | string) => {
    const pathJoined = typeof path === "string" ? path : path.join(",");
    for (const entry of collapsed.value.keys()) {
      if (pathJoined === entry) {
        return true;
      }
    }
    return false;
  };
  const isCollapsedChild = (path: Path | string) => {
    const pathJoined = typeof path === "string" ? path : path.join(",");
    for (const entry of collapsed.value.keys()) {
      if (pathJoined !== entry && pathJoined.startsWith(`${entry},`)) {
        return true;
      }
    }
    return false;
  };
  const isCollapsedChildOf = (path: Path | string) => {
    const pathJoined = typeof path === "string" ? path : path.join(",");

    // We're looking for the shallowest ancestor of this node that has collapsed it
    let highest: string | undefined;

    for (const entry of collapsed.value.keys()) {
      if (pathJoined !== entry && pathJoined.startsWith(`${entry},`)) {
        if (!highest || entry.length < highest.length) {
          highest = entry;
        }
      }
    }

    return highest?.split(",").map((i) => parseInt(i));
  };

  const collapseAll = () => {
    for (const { path, eventy } of iter(timelineStore.transformedEvents)) {
      if (!isEvent(eventy)) {
        setCollapsed(path, true);
      }
    }
  };

  const expandAll = () => {
    for (const { path, eventy } of iter(timelineStore.transformedEvents)) {
      if (!isEvent(eventy)) {
        setCollapsed(path, false);
      }
    }
  };

  return {
    collapsed,
    isCollapsed,
    isCollapsedChild,
    isCollapsedChildOf,
    collapse,
    setCollapsed,
    toggleCollapsed,
    expand,
    collapseAll,
    expandAll,
  };
});
