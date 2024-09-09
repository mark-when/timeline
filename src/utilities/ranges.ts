import type { Eventy, GroupRange } from "@markwhen/parser";
import { Event, isEvent, toDateRange, type DateRange } from "@markwhen/parser";
import { expand } from "@markwhen/parser";
import { LRUCache } from "lru-cache";

const cache = new LRUCache<string, DateRange>({ max: 1000 });
const cacheAndReturn = (cacheKey: string, dateRange: DateRange) => {
  cache.set(cacheKey, dateRange);
  return dateRange;
};
export const eventRange = (e: Event, recurrenceLimit: number) => {
  const cacheKey =
    JSON.stringify(e.dateRangeIso) + JSON.stringify(e.recurrence);
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  if (e.recurrence) {
    const expanded = expand(
      toDateRange(e.dateRangeIso),
      e.recurrence,
      recurrenceLimit
    );
    return cacheAndReturn(cacheKey, {
      fromDateTime: expanded[0].fromDateTime,
      toDateTime: expanded[expanded.length - 1].toDateTime,
    });
  } else {
    return cacheAndReturn(cacheKey, toDateRange(e.dateRangeIso));
  }
};

export type RecurrenceRangeOptions = {
  recurrenceLimit: number;
};

export const ranges = (
  root: Eventy,
  recurrenceLimit: number
): GroupRange | undefined => {
  if (!root) {
    return undefined;
  }

  if (isEvent(root)) {
    const eRange = eventRange(root, recurrenceLimit);
    return {
      ...eRange,
      maxFrom: eRange.fromDateTime,
    };
  }

  const childRanges = root.children.reduce((prev, curr) => {
    const currRange: GroupRange | undefined = ranges(curr, recurrenceLimit);
    if (!prev) {
      return currRange;
    }
    if (!currRange) {
      return currRange;
    }

    const min =
      +currRange.fromDateTime < +prev.fromDateTime
        ? currRange.fromDateTime
        : prev.fromDateTime;
    const max =
      +currRange.toDateTime > +prev.toDateTime
        ? currRange.toDateTime
        : prev.toDateTime;
    const maxFrom =
      +currRange.maxFrom > +prev.maxFrom ? currRange.maxFrom : prev.maxFrom;

    const range = {
      fromDateTime: min,
      toDateTime: max,
      maxFrom,
    };
    return range;
  }, undefined as GroupRange | undefined);

  return childRanges;
};
