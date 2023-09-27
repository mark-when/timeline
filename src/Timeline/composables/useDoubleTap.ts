import { useDebounceFn } from "@vueuse/core";
import { useTimelineStore } from "../timelineStore";

function getDistance(p1: [number, number], p2: [number, number]) {
  var x = p2[0] - p1[0],
    y = p2[1] - p1[1];

  return Math.sqrt(x * x + y * y);
}

function getScale(start: [number, number][], end: [number, number][]) {
  return getDistance(end[0], end[1]) / getDistance(start[0], start[1]);
}

export const useDoubleTap = (setViewport: () => void) => {
  let last = {
    time: 0,
    x: 0,
    y: 0,
  };
  let timeout: number;

  const timelineStore = useTimelineStore();
  let initialScale = 0;
  let initialX = 0;
  let initialY = 0;

  const addMoveListeners = (element: HTMLDivElement) => {
    const pointerMove = useDebounceFn((moveEvent: PointerEvent) => {
      const yDiff = initialY - moveEvent.clientY;
      const newScale = yDiff < 0 ? (yDiff - 10) / -10 : 10 / (yDiff + 10);
      timelineStore.setPageScale(Math.max(initialScale * newScale, 0.01));
      setViewport();
      moveEvent.stopPropagation();
      moveEvent.stopImmediatePropagation();
      moveEvent.preventDefault();
    }, 20);

    function pointerUp() {
      console.log("pointer up");
      element.removeEventListener("pointermove", pointerMove);
      element.removeEventListener("pointerup", pointerUp);
    }

    element.addEventListener("pointermove", pointerMove);
    element.addEventListener("pointerup", pointerUp);
    element.addEventListener("pointercancel", () => {
      console.log("canceled");
    });
    element.addEventListener("pointerout", () => {
      console.log("out");
    });
    element.addEventListener("pointerleave", () => {
      console.log("leave");
    });
  };

  const pointerListener = (e: PointerEvent) => {
    if (e.pointerType === "touch") {
      const currentTime = new Date().getTime();
      const tapLength = currentTime - last.time;

      if (
        tapLength < 500 &&
        tapLength > 0 &&
        Math.abs(e.clientX - last.x) < 10 &&
        Math.abs(e.clientY - last.y) < 10
      ) {
        e.preventDefault();

        initialX = e.clientX;
        initialY = e.clientY;
        initialScale = timelineStore.pageScale;

        const element = e.target as HTMLDivElement;
        const newReferenceDate = timelineStore.dateFromClientLeft(initialX);
        const d = timelineStore.distanceBetweenDates(
          newReferenceDate,
          timelineStore.referenceDate
        );
        timelineStore.referenceDate = newReferenceDate;
        element.scrollLeft = element.scrollLeft + d;
        addMoveListeners(element);
      } else {
        timeout = setTimeout(() => {
          clearTimeout(timeout);
        }, 500);
        last = {
          time: currentTime,
          x: e.clientX,
          y: e.clientY,
        };
      }
    }
  };

  return pointerListener;
};
