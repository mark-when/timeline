import { ref, watch, type Ref } from "vue";
export function hasLocalStorage() {
  return typeof localStorage !== "undefined";
}
export const lsRef = <T extends string | number>(
  key: string,
  defaultValue: T
) => {
  let initialValue: T;
  if (hasLocalStorage()) {
    const item = localStorage.getItem(key);
    if (item) {
      initialValue = JSON.parse(item).value;
    } else {
      initialValue = defaultValue;
    }
  } else {
    initialValue = defaultValue;
  }
  const r = ref(initialValue);
  watch(r, (v) => {
    if (hasLocalStorage()) {
      localStorage.setItem(key, JSON.stringify({ value: v }));
    }
  });
  return ref;
};
