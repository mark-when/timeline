import type { DateRange, Timeline } from "@markwhen/parser/lib/Types";
import { DateTime } from "luxon";
import type { Viewport } from "./timelineStore";
import {
  dateMidpoint,
  diffScale,
  floorDateTime,
} from "./utilities/dateTimeUtilities";

const initialScale = 0.3;

export interface Settings {
  scale: number;
  viewportDateInterval: DateRange;
  viewport: Viewport;
}
export const scaleToGetDistance = (distance: number, range: DateRange) =>
  (distance * 24) / range.toDateTime.diff(range.fromDateTime).as(diffScale);

export const calculateBaselineLeftmostDate = (
  earliestDateTime: DateTime,
  maxDurationDays: number
) => {
  return floorDateTime(earliestDateTime.minus({ years: 3 }), "year");
};

export function initialPageSettings(
  timeline?: Timeline,
  viewport?: Viewport
): Settings {
  if (viewport && timeline) {
    const range = {
      fromDateTime: DateTime.fromISO(timeline.metadata.earliestTime),
      toDateTime: DateTime.fromISO(timeline.metadata.latestTime),
    };
    const scale = scaleToGetDistance(viewport.width, range) / 3;
    const midpoint = dateMidpoint(range);
    const bslmd = calculateBaselineLeftmostDate(
      DateTime.fromISO(timeline.metadata.earliestTime),
      timeline.metadata.maxDurationDays
    );
    const fromLeft = (midpoint.diff(bslmd).as(diffScale) * scale) / 24;
    return {
      scale,
      viewportDateInterval: {
        fromDateTime: DateTime.now().minus({ years: 10 }),
        toDateTime: DateTime.now().plus({ years: 10 }),
      },
      viewport: {
        height: viewport.height,
        top: 0,
        width: viewport.width,
        left: fromLeft - viewport.width / 2,
        offsetLeft: viewport.offsetLeft,
      },
    };
  } else {
    const interval = {
      fromDateTime: DateTime.now().minus({ years: 10 }),
      toDateTime: DateTime.now().plus({ years: 10 }),
    };
    return {
      scale: initialScale,
      viewportDateInterval: interval,
      viewport: { left: 0, width: 0, top: 0, height: 0, offsetLeft: 0 },
    };
  }
}
