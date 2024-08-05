import { ref, watch, type Ref } from "vue";
export function hasLocalStorage() {
  return typeof localStorage !== "undefined";
}
export const lsRef = <T extends string | number>(
  key: string,
  defaultValue: T
): Ref<T> => {
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
  // @ts-ignore
  const r: Ref<T> = ref(initialValue);
  watch(r, (v) => {
    if (hasLocalStorage()) {
      localStorage.setItem(key, JSON.stringify({ value: v }));
    }
  });
  // @ts-ignore
  return ref;
};
