import type { DateRange, Timeline } from "@markwhen/parser";
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

export const calculateBaselineLeftmostDate = (earliestDateTime: DateTime) => {
  return floorDateTime(earliestDateTime.minus({ years: 3 }), "year");
};

export function initialPageSettings(
  timeline?: Timeline,
  viewport?: Viewport
): Settings {
  if (viewport && timeline) {
    let earliestTime = DateTime.now().minus({ years: 1 }).toISO();
    let latestTime = DateTime.now().plus({ years: 1 }).toISO();
    const range = {
      fromDateTime: DateTime.fromISO(earliestTime),
      toDateTime: DateTime.fromISO(latestTime),
    };
    const scale = scaleToGetDistance(viewport.width, range) / 3;
    const midpoint = dateMidpoint(range);
    const bslmd = calculateBaselineLeftmostDate(DateTime.fromISO(earliestTime));
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
