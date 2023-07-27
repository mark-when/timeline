<script setup lang="ts">
import HoverHint from "@/Timeline/Settings/HoverHint.vue";
import { ref } from "vue";
import { useIsTouchscreen } from "@/Timeline/composables/useIsTouchscreen";

defineProps<{
  hoverHintTitle?: string;
  hoverHintShortcut?: string;
  selected?: boolean;
  hoverHintLeft?: number;
}>();
const emit = defineEmits<{ (event: "click"): void }>();

const hovering = ref(false);
const { canHover } = useIsTouchscreen();

const events = canHover.value
  ? {
      mouseover: () => {
        hovering.value = true;
      },
      mouseleave: () => {
        hovering.value = false;
      },
    }
  : {};

const click = () => {
  hovering.value = false;
  emit("click");
};
</script>

<template>
  <button
    @click="click"
    class="p-1 flex flex-row items-center hover:bg-slate-200 transition dark:border-gray-900 dark:hover:bg-slate-600 dark:hover:text-gray-100 text-sm lg:text-base font-bold relative shrink-0"
    v-on="events"
    @mousedown.stop=""
    @touchstart.stop=""
    :class="{
      'text-indigo-600 outline-2 outline outline-indigo-600 dark:text-indigo-400 dark:outline-indigo-400':
        selected,
    }"
  >
    <slot></slot>
    <HoverHint
      v-if="hoverHintTitle"
      :hover-position="'top'"
      :hovering="hovering"
      :title="hoverHintTitle"
      :shortcut="hoverHintShortcut"
      :left="hoverHintLeft"
    />
  </button>
</template>

<style scoped></style>
