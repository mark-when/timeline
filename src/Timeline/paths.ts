export type EventPath = number[];

export const equivalentPaths = (p1?: EventPath, p2?: EventPath): boolean => {
  if (!p1 || !p2) {
    return false;
  }
  return p1.join(",") === p2.join(",");
};
