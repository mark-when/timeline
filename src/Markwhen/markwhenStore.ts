import { equivalentPaths, type EventPath } from "@/Timeline/paths";
import { eqPath } from "@/Timeline/timelineStore";
import { defineStore } from "pinia";
import { ref } from "vue";
import { useLpc, type AppState, type MarkwhenState } from "./useLpc";

export const useMarkwhenStore = defineStore("markwhen", () => {
  const app = ref<AppState>();
  const markwhen = ref<MarkwhenState>();
  console.log("markwhen store inited");
  const { postRequest } = useLpc({
    state: (s) => {
      app.value = s.app;
      markwhen.value = s.markwhen;
    },
  });

  const setHoveringPath = (path?: EventPath) => {
    postRequest("setHoveringPath", path);
  };

  const setDetailEventPath = (path?: EventPath) => {
    postRequest("setDetailPath", path);
  };

  const isDetailEventPath = (path: EventPath | undefined) =>
    !!path && equivalentPaths(path, app.value?.detailPath);

  postRequest("state");

  return {
    app,
    markwhen,
    setHoveringPath,
    setDetailEventPath,
    isDetailEventPath,
  };
});
