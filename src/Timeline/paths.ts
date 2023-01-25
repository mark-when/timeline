export type EventPaths = { [pathType in EventPath["type"]]?: EventPath };

export interface EventPath {
  type: "whole" | "page" | "pageFiltered";
  path: number[];
}

export const equivalentPaths = (p1?: EventPath, p2?: EventPath): boolean => {
  if (!p1 || !p2 || p1.type !== p2.type) {
    return false;
  }
  const path1 = p1.path;
  const path2 = p2.path;

  return path1.join(",") === path2.join(",");
};
