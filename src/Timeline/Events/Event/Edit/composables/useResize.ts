import { useMarkersStore } from "../../../../Markers/markersStore";
import { useTimelineStore } from "../../../../timelineStore";
import {
  diffScale,
  floorDateTime,
  roundDateTime,
} from "../../../../utilities/dateTimeUtilities";
import type { DateTimeIso } from "@markwhen/parser";
import type { MaybeRef } from "@vueuse/core";
import { DateTime } from "luxon";
import { computed, ref, unref } from "vue";
import { useCanPanStore } from "@/Timeline/composables/canPan";

export const useResize = (
  rangeFrom: MaybeRef<DateTimeIso>,
  rangeTo: MaybeRef<DateTimeIso>,
  done?: (tempFrom: DateTime | undefined, tempTo: DateTime | undefined) => void
) => {
  const canPan = useCanPanStore();
  const tempFromIso = ref<string>();
  const tempFrom = computed<DateTime | undefined>(() => {
    if (!!tempFromIso.value) return DateTime.fromISO(tempFromIso.value);
  });
  const tempToIso = ref<string>();
  const tempTo = computed<DateTime | undefined>(() => {
    if (!!tempToIso.value) return DateTime.fromISO(tempToIso.value);
  });
  const diff = ref<number>();

  const markersStore = useMarkersStore();
  const timelineStore = useTimelineStore();

  const removeListeners = () => {
    document.removeEventListener("mousemove", moveListenerLeft);
    document.removeEventListener("mousemove", moveListenerRight);
    document.removeEventListener("mousemove", moveListener);

    document.removeEventListener("mouseup", upListener);
    document.removeEventListener("mouseup", moveEnd);

    document.removeEventListener("touchmove", moveListenerLeft);
    document.removeEventListener("touchmove", moveListenerRight);
    document.removeEventListener("touchmove", moveListener);

    document.removeEventListener("touchend", upListener);
    document.removeEventListener("touchend", moveEnd);

    document.removeEventListener("keydown", escapeListener);
  };

  const delayedStop = () => {
    canPan.canPan = true;
    removeListeners();
    setTimeout(() => {
      tempFromIso.value = undefined;
      tempToIso.value = undefined;
    }, 100);
  };

  const stop = () => {
    canPan.canPan = true;
    tempFromIso.value = undefined;
    tempToIso.value = undefined;

    removeListeners();
  };

  const escapeListener = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      stop();
    }
  };

  const upListener = (e: MouseEvent | TouchEvent) => {
    if (typeof TouchEvent !== "undefined" && e instanceof TouchEvent) {
    } else {
      e.preventDefault();
    }

    done?.(tempFrom.value, tempTo.value);

    // Add a delay so that there isn't a shift from the time we send the
    // request to when it actually comes through
    delayedStop();
  };

  const moveListenerLeft = (e: MouseEvent | TouchEvent) => {
    let x;
    if (typeof TouchEvent !== "undefined" && e instanceof TouchEvent) {
      x = e.touches[0].clientX;
    } else {
      x = (e as MouseEvent).clientX;
      e.preventDefault();
    }
    const date = timelineStore.dateFromClientLeft(x);
    const floored = floorDateTime(
      date,
      markersStore.nextMostGranularScaleOfViewportDateInterval
    );

    tempFromIso.value = floored.toISO()!;
  };

  const moveListenerRight = (e: MouseEvent | TouchEvent) => {
    let x;
    if (typeof TouchEvent !== "undefined" && e instanceof TouchEvent) {
      x = e.touches[0].clientX;
    } else {
      x = (e as MouseEvent).clientX;
      e.preventDefault();
    }
    const date = timelineStore.dateFromClientLeft(x);
    const floored = floorDateTime(
      date,
      markersStore.nextMostGranularScaleOfViewportDateInterval
    );

    tempToIso.value = floored.toISO()!;
  };

  const dragHandleListenerLeft = (e: MouseEvent | TouchEvent) => {
    canPan.canPan = false;
    document.addEventListener("mousemove", moveListenerLeft);
    document.addEventListener("mouseup", upListener);
    document.addEventListener("touchmove", moveListenerLeft);
    document.addEventListener("touchend", upListener);
    document.addEventListener("keydown", escapeListener);
  };

  const dragHandleListenerRight = (e: MouseEvent | TouchEvent) => {
    canPan.canPan = false;
    document.addEventListener("mousemove", moveListenerRight);
    document.addEventListener("mouseup", upListener);
    document.addEventListener("touchmove", moveListenerRight);
    document.addEventListener("touchend", upListener);
    document.addEventListener("keydown", escapeListener);
  };

  const moveListener = (e: MouseEvent | TouchEvent) => {
    canPan.canPan = false;
    let x;
    if (typeof TouchEvent !== "undefined" && e instanceof TouchEvent) {
      x = e.touches[0].clientX;
    } else {
      e.preventDefault();
      x = (e as MouseEvent).clientX;
    }
    // + 18 because of where the handle is
    const date = timelineStore.dateFromClientLeft(x + 18) as DateTime;
    const rounded = roundDateTime(
      date,
      markersStore.nextMostGranularScaleOfViewportDateInterval
    );
    tempFromIso.value = rounded.toISO()!;
    tempToIso.value = rounded.plus({ [diffScale]: diff.value }).toISO()!;
  };

  const moveEnd = (e: MouseEvent | TouchEvent) => {
    if (typeof TouchEvent !== "undefined" && e instanceof TouchEvent) {
    } else {
      e.preventDefault();
    }
    done?.(tempFrom.value, tempTo.value);
    delayedStop();
  };

  const moveHandleListener = (e: MouseEvent | TouchEvent) => {
    canPan.canPan = false;
    tempFromIso.value = unref(rangeFrom);
    tempToIso.value = unref(rangeTo);
    diff.value = tempTo.value?.diff(tempFrom.value!).as(diffScale);

    document.addEventListener("mousemove", moveListener);
    document.addEventListener("touchmove", moveListener);
    document.addEventListener("mouseup", moveEnd);
    document.addEventListener("touchend", moveEnd);
    document.addEventListener("keydown", escapeListener);
  };

  return {
    dragHandleListenerLeft,
    dragHandleListenerRight,
    moveHandleListener,
    tempFrom,
    tempTo,
  };
};
