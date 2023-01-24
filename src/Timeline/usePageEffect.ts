import { computed, reactive, watchEffect, watch } from "vue";
import { useMarkwhenStore } from "@/Markwhen/markwhenStore";

export const usePageEffect = <T>(
  defaultPageState: (pageIndex: number) => T
) => {
  // const editorOrchestrator = useEditorOrchestratorStore();
  const markwhenStore = useMarkwhenStore();
  const appState = computed(() => markwhenStore.app);
  const markwhenState = computed(() => markwhenStore.markwhen);

  const pageState = reactive({} as { [pageIndex: number]: T });

  watch(
    () => markwhenState.value?.parsed.length,
    (length) => {
      if (!isNaN(length!)) {
        const indices = Object.keys(pageState);
        const toDelete = indices.filter((i) => parseInt(i) >= length!);
        toDelete.forEach((i) => delete pageState[parseInt(i)]);
      }
    }
  );

  watchEffect(() => {
    const pageIndex = appState.value?.pageIndex || 0;
    if (pageState[pageIndex] === undefined) {
      // If we do not have state for this page, give it the default
      pageState[pageIndex] = defaultPageState(pageIndex);
    }
  });

  // pageStore.$onAction(({ name, store, args, after }) => {
  //   if (name === "setPageIndex") {
  //     const pageIndex = args[0];
  //     if (pageState[pageIndex] === undefined) {
  //       pageState[pageIndex] = defaultPageState(pageIndex);
  //     }
  //   }
  // });

  // editorOrchestrator.$onAction(({ name, store, args, after }) => {
  //   switch (name) {
  //     case "movePages":
  //       const [from, to] = args;
  //       if (from === to) {
  //         return;
  //       }
  //       const order = newOrder(
  //         markwhenStore.timelines.map((c, i) => i),
  //         from,
  //         to
  //       );
  //       const rearrangedSettings = order.map((i) => pageState[i]);
  //       const newIndex = order.findIndex((i) => i === pageStore.pageIndex);
  //       const newIndices = Object.keys(rearrangedSettings);

  //       after(() => {
  //         for (const newIndex of newIndices) {
  //           const i = parseInt(newIndex);
  //           pageState[i] = rearrangedSettings[i];
  //         }
  //         pageStore.setPageIndex(newIndex);
  //       });

  //       break;
  //     case "deletePage":
  //       const index = args[0];
  //       if (index === 0 && markwhenStore.timelines.length === 1) {
  //         return;
  //       }
  //       if (
  //         pageStore.pageIndex === index &&
  //         index === markwhenStore.timelines.length - 1
  //       ) {
  //         pageStore.setPageIndex(index - 1);
  //       }
  //       // Move all the settings up
  //       const indices = Object.keys(pageState)
  //         .map(parseInt)
  //         .filter((i) => i > index)
  //         .sort();
  //       indices.forEach((i) => (pageState[i - 1] = pageState[i]));
  //       delete pageState[indices[indices.length]];
  //       break;
  //   }
  // });

  return computed({
    get: () => pageState[appState.value?.pageIndex || 0],
    set(newVal: T) {
      pageState[appState.value?.pageIndex || 0] = newVal;
    },
  });
};
