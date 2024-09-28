import { recurrenceLimit } from "@/Timeline/timelineStore";
import { ranges } from "@/utilities/ranges";
import { isEvent, iter, toArray } from "@markwhen/parser";
import type { Path, Event, Block } from "@markwhen/parser";
import { defineStore } from "pinia";
import { computed, reactive, ref, watch, watchEffect } from "vue";
import { useTimelineStore } from "./timelineStore";
import { useCollapseStore } from "./collapseStore";
import { equivalentPaths } from "./paths";
import type { Eventy } from "@markwhen/parser";
import type { EventGroup } from "@markwhen/parser";

const prevSiblingPath = (path: Path) => {
  if (path[path.length - 1] === 0) {
    return path.slice(0, -1);
  }
  return [...path.slice(0, -1), path[path.length - 1] - 1];
};

export const nodeKey = (n: Eventy) => {
  if (isEvent(n)) {
    const event = n;
    return (
      event.firstLine.restTrimmed +
      event.supplemental
        .filter((b) => b.type !== "image")
        .map((b) => (b as Block).raw)
        .join(" ")
    );
  } else {
    return n.title;
  }
};

export type Style = {
  height?: string;
  top?: string;
};
export type PathAndEventy<T extends Eventy = Event> = { path: Path; eventy: T };

export const useNodeStore = defineStore("nodes", () => {
  const timelineStore = useTimelineStore();
  const collapseStore = useCollapseStore();

  const nodes = computed(() => timelineStore.transformedEvents);
  const nodeArray = computed(() => toArray(timelineStore.transformedEvents));

  const _numChildren = (
    node: Eventy,
    path: number[],
    childrenMap: Map<string, number>
  ): number => {
    const pathJoined = path.join(",");
    const saved = childrenMap.get(pathJoined);
    if (saved) {
      return saved;
    }

    const cache = (childCount: number) => {
      childrenMap.set(pathJoined, childCount);
      return childCount;
    };

    if (collapseStore.isCollapsed(pathJoined) || isEvent(node)) {
      return cache(0);
    }

    const arr = node.children;
    const children = arr.reduce((prev, curr, i) => {
      return prev + 1 + _numChildren(curr, [...path, i], childrenMap);
    }, 0);
    return cache(children);
  };

  let eventNodeKey = 0;
  const eventNodeKeyMap = reactive(new Map<string, number>());
  const assignEventKeys = (
    nodes: PathAndEventy[]
  ): (PathAndEventy & { key: string })[] => {
    const visible = nodes.map((p) => p.path.join(","));
    const newlyAvailableKeys = [] as number[];

    // Go through paths that have keys already
    // If there are any that are not visible, remove them
    // and mark those keys as available.
    for (const hasKey of eventNodeKeyMap.keys()) {
      if (!visible.includes(hasKey)) {
        newlyAvailableKeys.push(eventNodeKeyMap.get(hasKey)!);
        eventNodeKeyMap.delete(hasKey);
      }
    }

    // Meanwhile, mark the nodes that don't have any keys
    // If there is a (newly recycled) key to assign to it,
    // do that, otherwise, get a new one
    for (const visibleNode of visible) {
      if (!eventNodeKeyMap.has(visibleNode)) {
        const recycledKey = newlyAvailableKeys.pop();
        if (typeof recycledKey !== "undefined") {
          eventNodeKeyMap.set(visibleNode, recycledKey);
        } else {
          eventNodeKeyMap.set(visibleNode, eventNodeKey++);
        }
      }
    }

    return nodes.map((n) => ({
      ...n,
      key: "" + eventNodeKeyMap.get(n.path.join(",")),
    }));
  };

  const visibleNodes = computed<
    [(PathAndEventy & { key: string })[], PathAndEventy<EventGroup>[]]
  >(() => {
    const visibleEvents: PathAndEventy[] = [];
    const visibleSections: PathAndEventy<EventGroup>[] = [];
    for (const { path, eventy } of nodeArray.value) {
      if (!eventy) {
        break;
      }
      const joinedPath = path.join(",");
      if (!isEvent(eventy)) {
        if (collapseStore.isCollapsedChild(path)) {
          continue;
        }
        if (path.length > 0) {
          const numAbove = predecessorMap.value.get(joinedPath) || 0;
          const children = childrenMap.value.get(joinedPath) || 0;
          const top = 100 + numAbove * 30;
          const height = 30 + children * 30;
          const vp = timelineStore.pageSettings.viewport;

          const bottomOfSection = top + height;
          const topOfSection = top;
          const topOfVp = vp.top - 100;
          const bottomOfVp = vp.top + vp.height + 100;

          if (topOfSection > bottomOfVp) {
            continue;
          } else if (bottomOfSection < topOfVp) {
            continue;
          } else {
            visibleSections.push({
              path: path,
              eventy,
            });
          }
        }
      } else {
        const pAndN = {
          eventy,
          path,
        };
        if (
          timelineStore.scrollToPath &&
          equivalentPaths(path, timelineStore.scrollToPath)
        ) {
          visibleEvents.push(pAndN);
        } else {
          const numAbove = predecessorMap.value.get(joinedPath) || 0;
          const top = 100 + numAbove * 30;
          const vp = timelineStore.pageSettings.viewport;
          if (top > vp.top - 100 && top < vp.top + vp.height + 100) {
            if (timelineStore.mode === "gantt") {
              visibleEvents.push(pAndN);
            } else {
              const range = ranges(pAndN.eventy, recurrenceLimit)!;
              const left =
                timelineStore.pageScaleBy24 *
                timelineStore.scalelessDistanceFromReferenceDate(
                  range.fromDateTime
                );
              const width =
                timelineStore.pageScaleBy24 *
                timelineStore.scalelessDistanceBetweenDates(
                  range.fromDateTime,
                  range.toDateTime
                );
              if (
                left < vp.left + vp.width + 50 ||
                vp.left < left + width + 50
              ) {
                visibleEvents.push(pAndN);
              }
            }
          }
        }
      }
    }
    return [assignEventKeys(visibleEvents), visibleSections];
  });

  const sectionNodeKeyMap = reactive(new Map<string, number>());
  const sectionKeys = computed(() => {
    const visible = visibleNodes.value[1].map((p) => p.path.join(","));
    const newlyAvailableKeys = [] as number[];

    // Go through paths that have keys already
    // If there are any that are not visible, remove them
    // and mark those keys as available.
    for (const hasKey of sectionNodeKeyMap.keys()) {
      if (!visible.includes(hasKey)) {
        newlyAvailableKeys.push(sectionNodeKeyMap.get(hasKey)!);
        sectionNodeKeyMap.delete(hasKey);
      }
    }

    // Meanwhile, mark the nodes that don't have any keys
    // If there is a (newly recycled) key to assign to it,
    // do that, otherwise, get a new one
    for (const visibleNode of visible) {
      if (!sectionNodeKeyMap.has(visibleNode)) {
        const recycledKey = newlyAvailableKeys.pop();
        if (typeof recycledKey !== "undefined") {
          sectionNodeKeyMap.set(visibleNode, recycledKey);
        } else {
          sectionNodeKeyMap.set(visibleNode, eventNodeKey++);
        }
      }
    }
    return sectionNodeKeyMap;
  });

  const childrenMap = computed(() => {
    const map = new Map<string, number>();
    for (const { path, eventy } of nodeArray.value) {
      _numChildren(eventy, path, map);
    }
    return map;
  });

  const numPredecessors = (
    eventy: Eventy,
    path: Path,
    map: Map<string, number>,
    childrenMap: Map<string, number>
  ) => {
    const ourPathJoined = path.join(",");

    const cache = (numPreds: number) => {
      map.set(ourPathJoined, numPreds);
      return numPreds;
    };

    if (!path.length) {
      return cache(0);
    }

    const prev = map.get(ourPathJoined);
    if (typeof prev !== "undefined") {
      return prev;
    }

    const prevPath = prevSiblingPath(path).join(",");
    let pred = 1 + map.get(prevPath)!;
    if (
      prevPath.length &&
      ourPathJoined.length &&
      prevPath.split(",").length === ourPathJoined.split(",").length
    ) {
      pred += childrenMap.get(prevPath) || 0;
    }
    return cache(pred);
  };

  const predecessorMap = computed(() => {
    const map = new Map<string, number>();
    for (const { path, eventy } of nodeArray.value) {
      numPredecessors(eventy, path, map, childrenMap.value);
    }
    return map;
  });

  const height = computed(() => {
    let max = 0;
    for (const p of predecessorMap.value.values()) {
      if (p > max) {
        max = p;
      }
    }
    return max;
  });

  const viewHeight = computed(() => {
    if (nodeArray.value.length) {
      return `${nodeArray.value.length * 30 + 500}px`;
    } else {
      return "100%";
    }
  });

  return {
    nodes,
    nodeArray,
    visibleNodes,
    childrenMap,
    predecessorMap,
    sectionKeys,
    height,
    viewHeight,
  };
});
