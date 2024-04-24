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
import UserRanges from "./UserRanges.vue";

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

const goToNow = () => timelineStore.goToNow();
</script>

<template>
  <div
    class="fixed hover:text-zinc-700 dark:text-zinc-400 text-zinc-500 dark:hover:text-zinc-300 mt-16"
    :style="`left: calc(${styleLeftInset}px); bottom: 0rem; right: 0;`"
  >
    <div
      class="flex flex-row-items-center overflow-scroll noScrollBar relative"
    >
      <!-- <div
        class="flex"
        style="grid-area: minimap"
        v-if="timelineStore.miniMapShowing"
      >
        <div class="p-2 pointer-events-auto">
          <Minimap />
        </div>
      </div> -->
      <div class="flex flex-row gap-2 pt-8">
        <div class="dark:bg-zinc-800 bg-white flex flex-row gap-2 px-2">
          <div
            class="flex flex row overflow-visible p-[2px] pointer-events-auto"
            style="grid-area: gantt"
          >
            <ToggleMode></ToggleMode>
          </div>
          <div class="flex flex-row pointer-events-auto shrink-0">
            <SettingsButton class="gap-1" @click="goToNow">
              <svg
                class="h-4 w-4"
                focusable="false"
                aria-hidden="true"
                viewBox="0 0 24 24"
                data-testid="ModeStandbyIcon"
                fill="currentColor"
                stroke="currentColor"
                stroke-width="0.4"
              >
                <path
                  d="M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10 10-4.49 10-10S17.51 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3-8c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3z"
                ></path></svg
              ><span class="text-xs mt-px">Now</span>
            </SettingsButton>
            <UserRanges></UserRanges>
            <AutoCenter></AutoCenter>
          </div>
          <div
            class="flex flex row overflow-visible p-[2px] pointer-events-auto"
          >
            <!-- <ToggleMiniMap></ToggleMiniMap> -->
            <TimelineScale></TimelineScale>
          </div>
          <div
            class="overflow-visible p-[2px] pointer-events-auto flex flex-row"
          >
            <ToggleDateTimeDisplay></ToggleDateTimeDisplay>
            <ToggleShowProgress></ToggleShowProgress>
          </div>
          <div
            class="overflow-visible p-[2px] pointer-events-auto flex flex-row"
          >
            <ExpandAll></ExpandAll>
            <CollapseAll></CollapseAll>
            <ToggleNowLine></ToggleNowLine>
          </div>
          <input
            type="number"
            placeholder="Year offset"
            class="placeholder:text-sm px-1"
            v-model="timelineStore.yearOffset"
          />
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
                class="w-3 h-3 mr-1"
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
                class="h-4 w-4 md:mr-1"
                focusable="false"
                viewBox="0 0 24 24"
                aria-hidden="true"
                fill="currentColor"
              >
                <path
                  d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
                ></path></svg
              ><span class="hidden md:block">Open editor</span></a
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
