import { equivalentPaths, type EventPath } from "@/Timeline/paths";
import { defineStore } from "pinia";
import { computed, ref, watch, watchEffect } from "vue";
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
  const showEditButton = ref(false);
  const showCopyLinkButton = ref(true);

  const onJumpToPath = ref((path: EventPath) => {});
  const onJumpToRange = ref((range: DateRangeIso) => {});
  const onGetSvg = ref((params: any): any => {});

  const hash = computed(() =>
    markwhen.value?.rawText ? btoa(markwhen.value?.rawText) : ""
  );

  const pathOrHash = computed(() => {
    const { user, timeline } = route.params;
    if (user) {
      return `/${user}` + (timeline ? `/${timeline}` : "");
    }
    if (app.value?.path && app.value.path !== "/") {
      return app.value.path;
    }
    return `#mw=${hash.value}`;
  });

  const editorLink = computed(() => `https://markwhen.com${pathOrHash.value}`);
  const timelineLink = computed(
    () => `https://timeline.markwhen.com${pathOrHash.value}`
  );
  const embedLink = computed(() => `<iframe src="${timelineLink.value}" />`);

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
          showEditButton.value = true;
          showCopyLinkButton.value = false;
        }
      } catch {}
    } else if (route.hash && route.hash.startsWith("#mw=")) {
      const decoded = atob(route.hash.substring("#mw=".length));
      const mw = parse(decoded);
      app.value = {
        pageIndex: 0,
        isDark: false,
      };
      markwhen.value = {
        rawText: decoded,
        parsed: mw.timelines,
        page: {
          parsed: mw.timelines[0],
          transformed: mw.timelines[0].events,
        },
      };
      showEditButton.value = true;
      showCopyLinkButton.value = false;
    }
  });

  const { postRequest } = useLpc({
    state: (s) => {
      showEditButton.value = false;
      showCopyLinkButton.value = true;
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

    showEditButton,
    showCopyLinkButton,
    showEmbedButton: showCopyLinkButton,

    timelineLink,
    editorLink,
    embedLink,
  };
});
