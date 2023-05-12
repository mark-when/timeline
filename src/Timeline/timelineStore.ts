import { defineStore } from "pinia";
import { DateTime } from "luxon";
import {
  diffScale,
  floorDateTime,
  scales,
  viewportLeftMarginPixels,
} from "@/Timeline/utilities/dateTimeUtilities";
import { ref, computed, watchEffect, watch } from "vue";
import type { EventPath, EventPaths } from "@/Timeline/paths";
import { ranges } from "@/utilities/ranges";
import {
  initialPageSettings,
  calculateBaselineLeftmostDate,
  scaleToGetDistance,
} from "./initialPageSettings";
import { useMarkwhenStore } from "@/Markwhen/markwhenStore";
import type { Node, NodeArray } from "@markwhen/parser/lib/Node";

export const recurrenceLimit = 100;

export enum Weight {
  SECOND = 0,
  QUARTER_MINUTE = 1,
  MINUTE = 2,
  QUARTER_HOUR = 3,
  HOUR = 4,
  DAY = 5,
  MONTH = 6,
  YEAR = 7,
  DECADE = 8,
  CENT = 9,
}

const SECOND = 1;
const QUARTER_MINUTE = 15 * SECOND;
const MINUTE = 60 * SECOND;
const QUARTER_HOUR = 15 * MINUTE;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const MONTH = 30 * DAY;
const YEAR = 12 * MONTH;
const DECADE = 10 * YEAR;
const CENT = 10 * DECADE;

export type TimelineMode = "timeline" | "gantt";
export const timeMarkerWeightMinimum = 0.25;

function roundToTwoDecimalPlaces(n: number): number {
  return Math.floor(n * 100) / 100;
}

export function clamp(value: number, min: number = 0, max: number = 1) {
  return Math.min(max, Math.max(value, min));
}

export interface Viewport {
  left: number;
  width: number;
  top: number;
  height: number;
  offsetLeft: number;
}

export const MIN_SCALE = 0.002;
export const MAX_SCALE = 30000000;

export const eqPath = (ep: EventPath, eps: EventPaths): boolean => {
  const path = eps[ep.type]?.path;
  if (path?.length !== ep.path.length) {
    return false;
  }
  for (let i = 0; i < path.length; i++) {
    if (path[i] !== ep.path[i]) {
      return false;
    }
  }
  return true;
};

export const useTimelineStore = defineStore("timeline", () => {
  const markwhenStore = useMarkwhenStore();
  const appState = computed(() => markwhenStore.app!);
  const markwhenState = computed(() => markwhenStore.markwhen!);

  const pageTimeline = computed(() => markwhenState.value.parsed[0]);
  const pageTimelineMetadata = computed(() => pageTimeline.value.metadata);
  const tags = computed(() =>
    Object.keys(pageTimeline.value.header)
      .filter((entry) => entry.startsWith(")"))
      .reduce(
        (prev, curr) => ({
          ...prev,
          [curr.replace(")", "")]: pageTimeline.value.header[curr],
        }),
        {} as { [key: string]: any }
      )
  );
  const transformedEvents = computed<Node<NodeArray>>(
    () => markwhenState.value.transformed!
  );
  const darkMode = computed(() => !!appState.value?.isDark);

  const pageRange = computed(
    () =>
      ranges(pageTimeline.value.events, recurrenceLimit) || {
        fromDateTime: DateTime.now().minus({ years: 5 }),
        toDateTime: DateTime.now().plus({ years: 5 }),
      }
  );
  const hoveringEventPaths = computed(() => appState.value?.hoveringPath);
  const editEventDateRange = markwhenStore.editEventDateRange;
  const setHoveringEvent = markwhenStore.setHoveringPath;
  const clearHoveringEvent = () => markwhenStore.setHoveringPath();
  const setText = markwhenStore.setText;
  const showInEditor = markwhenStore.showInEditor;
  const createEventFromRange = markwhenStore.createEventFromRange;
  const isDetailEventPath = markwhenStore.isDetailEventPath;
  const setDetailEventPath = markwhenStore.setDetailEventPath;

  const viewportGetter = ref<() => Viewport>();
  const pageSettings = ref(
    (() => {
      const viewport = viewportGetter.value?.();
      return initialPageSettings(markwhenState.value?.parsed[0], viewport);
    })()
  );
  const startedWidthChange = ref(false);
  const hideNowLine = ref(false);
  const scrollToPath = ref<EventPaths>();
  const shouldZoomWhenScrolling = ref<boolean>(true);
  const mode = ref<TimelineMode>(
    (localStorage.getItem("preferredMode") as TimelineMode) || "timeline"
  );
  const ganttSidebarWidth = ref(200);
  const ganttSidebarTempWidth = ref(0);
  const autoCenterSemaphore = ref(0);
  const miniMapShowing = ref(false);

  watch(mode, (m) => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("preferredMode", m);
    }
  });

  const autoCenter = () => {
    autoCenterSemaphore.value++;
  };

  const toggleMiniMap = () => (miniMapShowing.value = !miniMapShowing.value);

  const leftInsetWidth = computed(() =>
    mode.value === "gantt"
      ? ganttSidebarTempWidth.value
        ? ganttSidebarTempWidth.value
        : ganttSidebarWidth.value
      : 0
  );

  const setGanttSidebarTempWidth = (width: number) => {
    ganttSidebarTempWidth.value = width;
  };
  const setGanttSidebarWidth = (width: number) => {
    ganttSidebarWidth.value = width;
  };

  const pageScale = computed(() => pageSettings.value.scale);

  const earliest = computed(() =>
    DateTime.fromISO(pageTimelineMetadata.value.earliestTime)
  );

  const maxDurationDays = computed(
    () => pageTimelineMetadata.value.maxDurationDays
  );

  const baselineLeftmostDate = ref<DateTime>(DateTime.now());

  watchEffect(() => {
    const newValue = calculateBaselineLeftmostDate(
      earliest.value,
      maxDurationDays.value
    );
    if (+newValue !== +baselineLeftmostDate.value) {
      baselineLeftmostDate.value = newValue;
    }
  });

  const baselineRightmostDate = computed(() => {
    return floorDateTime(
      pageRange.value.toDateTime.plus({
        years: 30,
      }),
      "year"
    );
  });
  const dateIntervalFromViewport = computed(() => {
    return (scrollLeft: number, width: number) => {
      // We're adding these so that when we are scrolling it looks like the left
      // time markers are going off the screen
      scrollLeft = scrollLeft - viewportLeftMarginPixels;
      width = width + viewportLeftMarginPixels;

      const earliest = baselineLeftmostDate.value;
      const leftDate = earliest.plus({
        [diffScale]: (scrollLeft / pageScale.value) * 24,
      });
      const rightDate = earliest.plus({
        [diffScale]: ((scrollLeft + width) / pageScale.value) * 24,
      });
      return { fromDateTime: leftDate, toDateTime: rightDate };
    };
  });
  const scalelessDistanceBetweenDates = (a: DateTime, b: DateTime) =>
    b.diff(a).as(diffScale);

  const distanceBetweenDates = computed(
    () => (a: DateTime, b: DateTime) =>
      (b.diff(a).as(diffScale) * pageScale.value) / 24
  );
  const scalelessDistanceFromBaselineLeftmostDate = computed(
    () => (a: DateTime) => a.diff(baselineLeftmostDate.value).as(diffScale)
  );
  const distanceFromBaselineLeftmostDate = computed(
    () => (a: DateTime) =>
      (a.diff(baselineLeftmostDate.value).as(diffScale) * pageScale.value) / 24
  );
  const distanceBetweenBaselineDates = computed(() =>
    distanceFromBaselineLeftmostDate.value(baselineRightmostDate.value)
  );
  const distanceFromViewportLeftDate = (a: DateTime) =>
    (a
      .diff(pageSettings.value.viewportDateInterval.fromDateTime)
      .as(diffScale) *
      pageScale.value) /
    24;

  const dateFromClientLeft = computed(
    () => (offset: number) =>
      baselineLeftmostDate.value.plus({
        [diffScale]:
          ((offset +
            pageSettings.value.viewport.left -
            leftInsetWidth.value -
            pageSettings.value.viewport.offsetLeft) /
            pageScale.value) *
          24,
      })
  );

  const setViewport = (viewport: Viewport) => {
    pageSettings.value.viewport = viewport;
    pageSettings.value.viewportDateInterval = dateIntervalFromViewport.value(
      viewport.left - viewport.offsetLeft,
      viewport.width + viewport.offsetLeft
    );
  };
  const setMode = (m: TimelineMode) => {
    mode.value = m;
  };
  const setViewportGetter = (getter: () => Viewport) => {
    viewportGetter.value = getter;
  };
  const setPageScale = (s: number) => {
    // TODO: also limit zooming in based on our position, if it would put us
    // past the browser's limit of a div's width
    const scale = Math.min(
      scaleToGetDistance(17_895_697, {
        fromDateTime: baselineLeftmostDate.value,
        toDateTime: baselineRightmostDate.value,
      }),
      Math.max(MIN_SCALE, Math.min(MAX_SCALE, s))
    );
    if (s === scale) {
      pageSettings.value.scale = scale;
    }
    return s === scale;
  };
  const setStartedWidthChange = (started: boolean) => {
    startedWidthChange.value = started;
  };
  const setHideNowLine = (hide: boolean) => {
    hideNowLine.value = hide;
  };
  const setScrollToPaths = (ep?: EventPaths) => {
    scrollToPath.value = ep;
  };
  const setShouldZoomWhenScrolling = (should: boolean) => {
    shouldZoomWhenScrolling.value = should;
  };

  const weights = computed(() => {
    const arbitraryNumber = 2000;
    const secondsInADay = 86400;

    const to = pageSettings.value.viewportDateInterval.toDateTime;
    const from = pageSettings.value.viewportDateInterval.fromDateTime;

    const rawDiff = to.diff(from).as(diffScale);

    const multiplier = arbitraryNumber * secondsInADay;
    const diff = rawDiff * (multiplier / 24);

    const width =
      pageSettings.value.viewport.width +
      pageSettings.value.viewport.offsetLeft;
    const denom = diff / width;
    return [
      clamp(roundToTwoDecimalPlaces((30 * SECOND) / denom)),
      clamp(roundToTwoDecimalPlaces((20 * QUARTER_MINUTE) / denom)),
      clamp(roundToTwoDecimalPlaces((30 * MINUTE) / denom)),
      clamp(roundToTwoDecimalPlaces((20 * QUARTER_HOUR) / denom)),
      clamp(roundToTwoDecimalPlaces((30 * HOUR) / denom)),
      clamp(roundToTwoDecimalPlaces((40 * DAY) / denom)),
      clamp(roundToTwoDecimalPlaces((30 * MONTH) / denom)),
      clamp(roundToTwoDecimalPlaces((25 * YEAR) / denom)),
      clamp(roundToTwoDecimalPlaces((25 * DECADE) / denom)),
      clamp(roundToTwoDecimalPlaces((20 * CENT) / denom)),
    ];
  });

  const scaleOfViewportDateInterval = computed(() => {
    for (let i = 0; i < weights.value.length; i++) {
      if (weights.value[i] > timeMarkerWeightMinimum) {
        return scales[i];
      }
    }
    return "cent";
  });

  return {
    // state
    pageSettings,
    startedWidthChange,
    hideNowLine,
    scrollToPath,
    shouldZoomWhenScrolling,
    mode,
    ganttSidebarWidth,
    ganttSidebarTempWidth,
    autoCenterSemaphore,
    miniMapShowing,
    colors: computed(() => appState.value.colorMap),
    // editable,

    // getters
    darkMode,
    pageTimeline,
    tags,
    pageTimelineMetadata,
    transformedEvents,
    pageScale,
    pageScaleBy24: computed(() => pageScale.value / 24),
    baselineLeftmostDate,
    baselineRightmostDate,
    scalelessDistanceBetweenDates,
    distanceBetweenDates: distanceBetweenDates as unknown as (
      a: DateTime,
      b: DateTime
    ) => number,
    distanceFromViewportLeftDate,
    distanceFromBaselineLeftmostDate,
    distanceBetweenBaselineDates,
    dateFromClientLeft,
    scalelessDistanceFromBaselineLeftmostDate,
    scaleOfViewportDateInterval,
    weights,
    leftInsetWidth,
    hoveringEventPaths,
    isDetailEventPath,

    // actions
    setDetailEventPath,
    createEventFromRange,
    showInEditor,
    setText,
    setHoveringEvent,
    clearHoveringEvent,
    editEventDateRange,
    setViewport,
    setViewportGetter,
    setPageScale,
    setStartedWidthChange,
    setHideNowLine,
    setScrollToPaths,
    setShouldZoomWhenScrolling,
    setMode,
    setGanttSidebarWidth,
    setGanttSidebarTempWidth,
    autoCenter,
    toggleMiniMap,
  };
});
