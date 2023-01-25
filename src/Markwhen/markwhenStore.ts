import { equivalentPaths, type EventPath } from "@/Timeline/paths";
import { defineStore } from "pinia";
import { ref } from "vue";
import { useLpc, type AppState, type MarkwhenState } from "./useLpc";
import produce from "immer";

export const useMarkwhenStore = defineStore("markwhen", () => {
  const app = ref<AppState>();
  const markwhen = ref<MarkwhenState>();

  const { postRequest } = useLpc({
    state: (s) => {
      app.value = produce(app.value, () => s.app);
      markwhen.value = produce(markwhen.value, () => s.markwhen);
    },
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

  const requestStateUpdate = () => postRequest("state");
  requestStateUpdate();

  return {
    app,
    markwhen,

    requestStateUpdate,
    setHoveringPath,
    setDetailEventPath,
    isDetailEventPath,
    setText,
    showInEditor,
  };
});
