import { equivalentPaths, type EventPath } from "@/Timeline/paths";
import { defineStore } from "pinia";
import { ref, watchEffect } from "vue";
import { useLpc, type AppState, type MarkwhenState } from "./useLpc";
import produce from "immer";
import type {
  DateFormat,
  DateRangeIso,
  DateTimeGranularity,
} from "@markwhen/parser/lib/Types";
import type { DisplayScale } from "@/Timeline/utilities/dateTimeUtilities";
import { useRoute } from "vue-router";
import { parse } from "@markwhen/parser";

export const useMarkwhenStore = defineStore("markwhen", () => {
  const route = useRoute();
  const app = ref<AppState>();
  const markwhen = ref<MarkwhenState>();

  const onJumpToPath = ref((path: EventPath) => {});
  const onJumpToRange = ref((range: DateRangeIso) => {});
  const onGetSvg = ref((params: any): any => {});

  watchEffect(async () => {
    const { user, timeline } = route.params;
    if (user) {
      try {
        const url = timeline
          ? `https://markwhen.com/${user}/${timeline}.mw`
          : `https://markwhen.com/${user}.mw`;
        const resp = await fetch(url);
        if (resp.ok) {
          const text = await resp.text();
          const mw = parse(text);
          app.value = {
            pageIndex: 0,
            isDark: false,
          };
          markwhen.value = {
            rawText: text,
            parsed: mw.timelines,
            page: {
              parsed: mw.timelines[0],
              transformed: mw.timelines[0].events,
            },
          };
        }
      } catch {}
    }
  });

  const { postRequest } = useLpc({
    state: (s) => {
      app.value = produce(app.value, () => s.app);
      markwhen.value = produce(markwhen.value, () => s.markwhen);
    },
    jumpToPath: ({ path }) => {
      onJumpToPath.value?.(path);
    },
    jumpToRange: ({ dateRangeIso }) => {
      onJumpToRange.value?.(dateRangeIso);
    },
    getSvg: (params: any) => onGetSvg.value?.(params),
  });

  const setHoveringPath = (path?: EventPath) => {
    postRequest("setHoveringPath", path);
  };

  const setDetailEventPath = (path?: EventPath) => {
    postRequest("setDetailPath", path);
  };

  const setText = (text: string, at?: { from: number; to: number }) => {
    postRequest("setText", { text, at });
  };

  const showInEditor = (path: EventPath) => {
    postRequest("showInEditor", path);
  };

  const isDetailEventPath = (path: EventPath | undefined) =>
    !!path && equivalentPaths(path, app.value?.detailPath);

  const createEventFromRange = (
    dateRangeIso: DateRangeIso,
    granularity: DateTimeGranularity,
    immediate: boolean = true
  ) => {
    postRequest("newEvent", { dateRangeIso, granularity, immediate });
  };

  const editEventDateRange = (
    path: EventPath,
    dateRangeIso: DateRangeIso,
    scale: DisplayScale,
    preferredInterpolationFormat: DateFormat | undefined
  ) => {
    const params = {
      path,
      range: dateRangeIso,
      scale,
      preferredInterpolationFormat,
    };
    postRequest("editEventDateRange", params);
  };

  const requestStateUpdate = () => postRequest("state");
  requestStateUpdate();

  return {
    app,
    markwhen,

    onJumpToPath,
    onJumpToRange,
    onGetSvg,

    requestStateUpdate,
    setHoveringPath,
    setDetailEventPath,
    isDetailEventPath,
    setText,
    showInEditor,
    createEventFromRange,
    editEventDateRange,
  };
});
