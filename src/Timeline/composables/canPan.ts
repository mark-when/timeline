import { defineStore } from "pinia";
import { ref, watch } from "vue";

export const useCanPanStore = defineStore("canPan", () => {
  const canPan = ref(true);

  return { canPan };
});
