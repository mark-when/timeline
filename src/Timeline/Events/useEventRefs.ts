import { COMPLETION_REGEX } from "@markwhen/parser";
import type { Event } from "@markwhen/parser";
import { ref, watchEffect, type Ref, watch, unref, computed } from "vue";
import { useTimelineStore } from "../timelineStore";
import {
  dateRangeIsoComparator,
  stringArrayComparator,
  supplementalComparator,
  matchedListItemsComparator,
  bothDefined,
  recurrenceComparator,
} from "../utilities/eventComparator";
import { toInnerHtml } from "../utilities/innerHtml";
import type { Eventy } from "@markwhen/parser";

const cachedComputed = <T>(
  val: () => T | undefined,
  comparator: (a: T | undefined, b: T | undefined) => boolean,
  defaultValue?: T
) => {
  // @ts-ignore
  const r: Ref<T | undefined> = ref(defaultValue ? defaultValue : undefined);
  watchEffect(() => {
    const value = val();
    if (typeof value === "undefined") {
      r.value = undefined;
    } else if (!r.value || !comparator(r.value, value)) {
      r.value = value;
    }
  });
  return r;
};

export const useEventRefs = (eventNode: Ref<Event | undefined>) => {
  const timelineStore = useTimelineStore();

  const cachedEventComputed = <T>(
    val: () => T,
    comparator: (a: T, b: T) => boolean = (a, b) => a === b,
    defaultValue?: T
  ) =>
    cachedComputed(
      val,
      (a, b) => bothDefined(a, b) && comparator(a!, b!),
      defaultValue
    );

  const event = computed(() => eventNode.value);
  const source = cachedComputed(
    // @ts-ignore
    () => eventNode.value!.source as string,
    (a, b) => a === b,
    "default"
  );
  const eventRange = cachedEventComputed(
    () => unref(event)!.dateRangeIso,
    dateRangeIsoComparator
  );

  const completed = cachedEventComputed(() => unref(event)?.completed);

  const supplemental = cachedEventComputed(
    () => unref(event)?.supplemental || [],
    supplementalComparator
  );

  const percent = cachedEventComputed(() => unref(event)?.percent);

  const matchedListItems = cachedEventComputed(
    () => unref(event)?.matchedListItems || [],
    matchedListItemsComparator
  );

  const tags = cachedEventComputed(
    () => unref(event)?.tags || [],
    stringArrayComparator
  );

  const color = ref<string>();
  watchEffect(() => {
    const eventColor = tags.value?.length
      ? timelineStore.colors[source.value || "default"]?.[tags.value[0]]
      : undefined;
    if (color.value !== eventColor) {
      color.value = eventColor;
    }
  });

  const dateText = cachedEventComputed(() => {
    const e = unref(event);

    if (e?.textRanges?.recurrence?.content) {
      return e.textRanges.recurrence.content;
    }
    return toInnerHtml(e?.firstLine?.datePart || "");
  });

  const titleHtml = cachedEventComputed(() => {
    const ed = unref(event)?.firstLine?.restTrimmed;
    if (!ed) {
      return "";
    }
    return toInnerHtml(
      ed.replace(COMPLETION_REGEX, (a, b) => a.substring(b.length))
    );
  });

  const recurrence = cachedEventComputed(
    () => unref(event)?.recurrence,
    recurrenceComparator
  );

  return {
    eventRange,
    supplemental,
    percent,
    matchedListItems,
    tags,
    color,
    dateText,
    titleHtml,
    completed,
    recurrence,
    source,
  };
};
