<script setup lang="ts">
import { useTimelineStore } from "../timelineStore";
import { computed } from "vue";
import TimelineScale from "../Settings/TimelineScale.vue";
import Minimap from "./Minimap.vue";
import AutoCenter from "./AutoCenter.vue";
import ToggleMiniMap from "./ToggleMiniMap.vue";
import CollapseAll from "./CollapseAll.vue";
import ExpandAll from "./ExpandAll.vue";
import ToggleMode from "./ToggleMode.vue";
import ToggleNowLine from "./ToggleNowLine.vue";
import SettingsButton from "./SettingsButton.vue";
import { useMarkwhenStore } from "@/Markwhen/markwhenStore";
import ToggleDateTimeDisplay from "./ToggleDateTimeDisplay.vue";
import ToggleShowProgress from "./ToggleShowProgress.vue";

const timelineStore = useTimelineStore();
const markwhenStore = useMarkwhenStore();

const styleLeftInset = computed(() => {
  let inset = timelineStore.pageSettings.viewport.offsetLeft;
  if (timelineStore.mode === "gantt") {
    return (
      inset +
      (timelineStore.ganttSidebarTempWidth
        ? timelineStore.ganttSidebarTempWidth
        : timelineStore.ganttSidebarWidth)
    );
  }
  return inset;
});

const copyToClipboard = async (s: string, description?: string) => {
  if (!navigator.clipboard) {
    return alert("Clipboard not available :/");
  }
  try {
    await navigator.clipboard.writeText(s);
    alert(`Copied ${description}to clipboard.`);
  } catch (e) {
    console.error(e);
    alert("Unable to copy to clipboard:" + e);
  }
};

const copyTimelineLink = async () =>
  copyToClipboard(markwhenStore.timelineLink, "link ");

const copyEmbedLink = async () =>
  copyToClipboard(markwhenStore.embedLink, "embed code ");
</script>

<template>
  <div
    class="absolute dark:text-gray-300 text-gray-500"
    :style="`left: calc(${styleLeftInset}px); bottom: 0rem;`"
  >
    <div
      class="flex"
      style="grid-area: minimap"
      v-if="timelineStore.miniMapShowing"
    >
      <div class="p-2 pointer-events-auto">
        <Minimap />
      </div>
    </div>
    <div class="flex flex-row gap-2 dark:bg-slate-800 bg-white">
      <div
        class="flex flex row overflow-visible p-[2px] pointer-events-auto"
        style="grid-area: gantt"
      >
        <ToggleMode></ToggleMode>
      </div>

      <div
        class="flex flex row overflow-visible p-[2px] pointer-events-auto"
        style="grid-area: view"
      >
        <ToggleMiniMap></ToggleMiniMap>
        <TimelineScale></TimelineScale>
        <AutoCenter></AutoCenter>
      </div>
      <!-- </div> -->
      <div
        class="overflow-visible p-[2px] pointer-events-auto flex flex-row"
        style="grid-area: collapse"
      >
        <ToggleDateTimeDisplay></ToggleDateTimeDisplay>
        <ToggleShowProgress></ToggleShowProgress>
      </div>

      <div
        class="overflow-visible p-[2px] pointer-events-auto flex flex-row"
        style="grid-area: collapse"
      >
        <ExpandAll></ExpandAll>
        <CollapseAll></CollapseAll>
        <ToggleNowLine></ToggleNowLine>
      </div>
      <div
        class="flex flex row overflow-visible p-[2px] pointer-events-auto link"
      >
        <SettingsButton
          :hover-hint-left="-1"
          hover-hint-title="Copy view link"
          v-if="markwhenStore.showCopyLinkButton"
          @click="copyTimelineLink"
        >
          <svg
            class="w-4 h-4 mr-1"
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="currentColor"
            stroke="currentColor"
            stroke-width="1"
          >
            <path
              d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"
            ></path>
          </svg>
          <p
            class="pr-1 font-mono text-xs"
            style="
              white-space: nowrap;
              text-overflow: ellipsis;
              overflow: hidden;
              max-width: 32ch;
            "
          >
            {{ markwhenStore.timelineLink.substring(8) }}
          </p>
        </SettingsButton>
        <SettingsButton
          v-if="markwhenStore.showEmbedButton"
          @click="copyEmbedLink"
          :hover-hint-left="1"
          hover-hint-title="Copy embed code"
          ><svg
            class="h-4 w-4"
            focusable="false"
            aria-hidden="true"
            viewBox="0 0 24 24"
            data-testid="CodeIcon"
            fill="currentColor"
            stroke="currentColor"
            stroke-width="1"
          >
            <path
              d="M9.4 16.6 4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0 4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"
            ></path></svg
        ></SettingsButton>
        <a
          v-if="markwhenStore.showEditButton"
          :href="markwhenStore.editorLink"
          target="_blank"
          class="h-6 flex flex-row items-center rounded hover:bg-zinc-200 transition dark:border-gray-900 dark:hover:bg-gray-900 dark:hover:text-gray-100 px-1 text-sm lg:text-base font-bold relative"
          ><svg
            class="h-4 w-4 mr-1"
            focusable="false"
            viewBox="0 0 24 24"
            aria-hidden="true"
            fill="currentColor"
          >
            <path
              d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
            ></path></svg
          >Open editor</a
        >
      </div>
    </div>
  </div>
</template>

<style scoped></style>
