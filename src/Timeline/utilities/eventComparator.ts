import type { Recurrence } from "@markwhen/parser";
import {
  Block,
  BlockType,
  Image,
  type DateRangeIso,
  type DateTimeIso,
  type EventDescription,
  type MarkdownBlock,
  type Range,
} from "@markwhen/parser";

export const bothDefined = <T>(a: T | undefined, b: T | undefined) => {
  if (typeof a === "undefined" && typeof b === "undefined") {
    return true;
  }
  if (typeof a === "undefined") {
    return false;
  }
  if (typeof b === "undefined") {
    return false;
  }
  return true;
};

export const rangeComparator = (a: Range, b: Range) =>
  a.type === b.type &&
  a.content === b.content &&
  a.from === b.from &&
  a.to === b.to;

export const dateRangeIsoComparator = (a: DateRangeIso, b: DateRangeIso) =>
  dateTimeIsoComparator(a.fromDateTimeIso, b.fromDateTimeIso) &&
  dateTimeIsoComparator(a.toDateTimeIso, b.toDateTimeIso);

export const stringComparator = (a: string, b: string) => a === b;

export const dateTimeIsoComparator = stringComparator;

export const stringArrayComparator = (a: string[], b: string[]) =>
  a.length === b.length && a.every((s, i) => s === b[i]);

export const eventDescriptionComparator = (
  a: EventDescription,
  b: EventDescription
) =>
  a.id === b.id &&
  a.eventDescription === b.eventDescription &&
  stringArrayComparator(a.locations, b.locations) &&
  matchedListItemsComparator(a.matchedListItems, b.matchedListItems) &&
  a.percent === b.percent &&
  supplementalComparator(a.supplemental, b.supplemental) &&
  stringArrayComparator(a.tags, b.tags);

export const matchedListItemsComparator = (a: Range[], b: Range[]) =>
  a.length == b.length && a.every((r, i) => rangeComparator(r, b[i]));

export const supplementalComparator = (
  a: MarkdownBlock[],
  b: MarkdownBlock[]
) =>
  a.length === b.length && a.every((s, i) => markdownBlockComparator(s, b[i]));

export const markdownBlockComparator = (a: MarkdownBlock, b: MarkdownBlock) => {
  if (a.type !== b.type) {
    return false;
  }
  if (a.type === BlockType.IMAGE) {
    return (
      (a as Image).altText === (b as Image).altText &&
      (a as Image).link === (b as Image).link
    );
  }
  return (
    (a as Block).raw === (b as Block).raw &&
    (a as Block).value === (b as Block).value
  );
};

export const recurrenceComparator = (a?: Recurrence, b?: Recurrence) => {
 return deepCompare(a, b)
};


function deepCompare(obj1: any, obj2: any) {
  if (
    typeof obj1 !== "object" ||
    typeof obj2 !== "object" ||
    obj1 === null ||
    obj2 === null
  ) {
    return obj1 === obj2;
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (let key of keys1) {
    if (!obj2.hasOwnProperty(key) || !deepCompare(obj1[key], obj2[key])) {
      return false;
    }
  }

  return true;
}
