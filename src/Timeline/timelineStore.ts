import { defineStore } from "pinia";
import { DateTime, type DurationUnit } from "luxon";
import { diffScale, scales } from "@/Timeline/utilities/dateTimeUtilities";
import { ref, computed, watch } from "vue";
import type { EventPath } from "@/Timeline/paths";
import { ranges } from "@/utilities/ranges";
import { initialPageSettings } from "./initialPageSettings";
import { useMarkwhenStore } from "@/Markwhen/markwhenStore";
import {
  RECURRENCE_AMOUNT_REGEX,
  type Node,
  type NodeArray,
} from "@markwhen/parser";
import type { DateRange } from "@markwhen/parser";

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

export const useTimelineStore = defineStore("timeline", () => {
  const markwhenStore = useMarkwhenStore();
  const markwhenState = computed(() => markwhenStore.markwhen!);
  const dateTimeDisplay = ref<"original" | "off">(
    (typeof localStorage !== "undefined" &&
      (localStorage.getItem("dateTimeDisplay") as "original" | "off")) ||
      "original"
  );
  const progressDisplay = ref<"on" | "off">(
    (typeof localStorage !== "undefined" &&
      (localStorage.getItem("progressDisplay") as "on" | "off")) ||
      "on"
  );

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
  const darkMode = computed(() => !!markwhenStore.app?.isDark);

  const pageRange = computed(
    () =>
      ranges(transformedEvents.value, recurrenceLimit) || {
        fromDateTime: DateTime.now().minus({ years: 5 }),
        toDateTime: DateTime.now().plus({ years: 5 }),
      }
  );
  const hoveringEventPaths = computed(() => markwhenStore.app?.hoveringPath);
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
  const goToNowSemaphore = ref(0);
  const scrollToPath = ref<EventPath>();
  const shouldZoomWhenScrolling = ref<boolean>(true);
  const mode = ref<TimelineMode>(
    (typeof localStorage !== "undefined" &&
      (localStorage.getItem("preferredMode") as TimelineMode)) ||
      "timeline"
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

  watch(dateTimeDisplay, (dtd) => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("dateTimeDisplay", dtd);
    }
  });

  watch(progressDisplay, (pd) => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("progressDisplay", pd);
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

  const pageScale = computed(() => pageSettings.value.scale || 1);

  const earliest = computed(() => pageRange.value.fromDateTime);

  const maxDurationDays = computed(
    () => pageTimelineMetadata.value.maxDurationDays
  );

  const hoveringDate = ref(DateTime.now());

  const referenceDate = ref(DateTime.now());
  const diffAmount = computed(() => ({
    [diffScale]:
      ((pageSettings.value.viewport.width * 2.5) / pageScale.value) * 24,
  }));
  const baselineLeftmostDate = computed(() =>
    referenceDate.value.minus(diffAmount.value)
  );
  const baselineRightmostDate = computed(() =>
    referenceDate.value.plus(diffAmount.value)
  );
  // watchEffect(() => {
  //   const newValue = calculateBaselineLeftmostDate(
  //     earliest.value,
  //     maxDurationDays.value
  //   );
  //   if (+newValue !== +baselineLeftmostDate.value) {
  //     baselineLeftmostDate.value = newValue;
  //     autoCenterSemaphore.value++;
  //   }
  // });

  // const baselineRightmostDate = computed(() => {
  //   return floorDateTime(
  //     pageRange.value.toDateTime.plus({
  //       years: 30,
  //     }),
  //     "year"
  //   );
  // });

  //  0 1 2 3
  // | | | |-| | | |
  // total width === viewport.width * 7
  const baseOffset = computed(() => {
    return 0; //pageSettings.value.viewport.width * 3;
  });

  const distanceFromBaselineLeftmostDate = computed(() => {
    return (dt: DateTime) => {
      return (
        (dt.diff(baselineLeftmostDate.value).as(diffScale) * pageScale.value) /
        24
      );
    };
  });

  const dateIntervalFromViewport = computed(() => {
    return (scrollLeft: number, width: number) => {
      const fromDateTime = baselineLeftmostDate.value.plus({
        [diffScale]:
          ((scrollLeft + leftInsetWidth.value) / pageScale.value) * 24,
      });
      const toDateTime = baselineLeftmostDate.value.plus({
        [diffScale]:
          ((width + scrollLeft + leftInsetWidth.value) / pageScale.value) * 24,
      });
      return { fromDateTime, toDateTime };
    };
  });
  const scalelessDistanceBetweenDates = (a: DateTime, b: DateTime) =>
    b.diff(a).as(diffScale);
  // Interval.fromDateTimes(a, b).toDuration(diffScale).as('hours');

  const distanceBetweenDates = computed(
    () => (a: DateTime, b: DateTime) =>
      (b.diff(a).as(diffScale) * pageScale.value) / 24
  );
  const scalelessDistanceFromReferenceDate = computed(
    () => (a: DateTime) => a.diff(referenceDate.value).as(diffScale)
  );
  const distanceFromReferenceDate = computed(
    () => (a: DateTime) =>
      (a.diff(referenceDate.value).as(diffScale) * pageScale.value) / 24 +
      pageSettings.value.viewport.width +
      baseOffset.value
  );
  const distanceFromViewportLeftDate = (a: DateTime) =>
    (a
      .diff(pageSettings.value.viewportDateInterval.fromDateTime)
      .as(diffScale) *
      pageScale.value) /
    24;

  const dateFromClientLeft = computed(() => (offset: number) => {
    try {
      const d = baselineLeftmostDate.value.plus({
        [diffScale]:
          ((offset + pageSettings.value.viewport.left) / pageScale.value) * 24,
      });
      return d;
    } catch {
      return DateTime.now();
    }
  });

  const userRanges = computed(() => {
    const ranges = markwhenStore.markwhen?.parsed[0].header.ranges;
    const parsedRanges: (DateRange & { title: string })[] = [];
    if (ranges && Array.isArray(ranges)) {
      const now = DateTime.now();
      for (let i = 0; i < ranges.length; i++) {
        let r = ranges[i];
        let regex = new RegExp(`^${RECURRENCE_AMOUNT_REGEX.source}$`);
        const match = regex.exec(r);
        if (match) {
          const amount = parseInt(match[1]);
          if (isNaN(amount)) {
            continue;
          }
          const unit: DurationUnit = !!match[3]
            ? "milliseconds"
            : !!match[4]
            ? "seconds"
            : !!match[5]
            ? "minutes"
            : !!match[6]
            ? "hours"
            : !!match[8]
            ? "days"
            : !!match[9]
            ? "weeks"
            : match[10]
            ? "months"
            : "years";
          const duration = { [unit]: amount / 2 };
          parsedRanges.push({
            title: r,
            fromDateTime: now.minus(duration),
            toDateTime: now.plus(duration),
          });
        }
      }
    }
    return parsedRanges;
  });

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
    pageSettings.value.scale = s;
    return true;
  };
  const setStartedWidthChange = (started: boolean) => {
    startedWidthChange.value = started;
  };
  const setHideNowLine = (hide: boolean) => {
    hideNowLine.value = hide;
  };
  const setScrollToPaths = (ep?: EventPath) => {
    scrollToPath.value = ep;
  };
  const goToNow = () => goToNowSemaphore.value++;
  const setShouldZoomWhenScrolling = (should: boolean) => {
    shouldZoomWhenScrolling.value = should;
  };
  const setRange = (dr: DateRange) => {
    rangeToJumpTo.value = dr;
  };
  const rangeToJumpTo = ref<DateRange>();

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
    referenceDate,
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
    dateTimeDisplay,
    progressDisplay,
    colors: computed(() => markwhenStore.app?.colorMap),
    baseOffset,
    hoveringDate,
    baselineLeftmostDate,
    baselineRightmostDate,
    diffAmount,
    userRanges,
    // editable,

    // getters
    darkMode,
    pageTimeline,
    tags,
    pageTimelineMetadata,
    pageRange,
    transformedEvents,
    pageScale,
    pageScaleBy24: computed(() => pageScale.value / 24),
    scalelessDistanceBetweenDates,
    distanceBetweenDates: distanceBetweenDates as unknown as (
      a: DateTime,
      b: DateTime
    ) => number,
    distanceFromViewportLeftDate,
    distanceFromReferenceDate,
    dateFromClientLeft,
    scalelessDistanceFromReferenceDate,
    scaleOfViewportDateInterval,
    weights,
    leftInsetWidth,
    hoveringEventPaths,
    isDetailEventPath,
    distanceFromBaselineLeftmostDate,

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
    goToNow,
    goToNowSemaphore,
    setRange,
    rangeToJumpTo,
  };
});
