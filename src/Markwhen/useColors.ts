import { RangeType, type Timeline } from "@markwhen/parser";
import { computed } from "vue";

// RGB, so we can use rgba(... ) with a different alpha where we need it
export const COLORS = [
  "22, 163, 76",
  "2, 132, 199",
  "212, 50, 56",
  "242, 202, 45",
  "80, 73, 229",
  "145, 57, 234",
  "214, 45, 123",
  "234, 88, 11",
  "168, 162, 157",
  "255, 255, 255",
  "0, 0, 0",
];
export const HUMAN_COLORS = [
  "green",
  "blue",
  "red",
  "yellow",
  "indigo",
  "purple",
  "pink",
  "orange",
  "gray",
  "white",
  "black",
];

export function hexToRgb(hex: string): string | undefined {
  hex = hex.replace("#", "").replace(")", "");
  const isShortHex = hex.length === 3;
  var r = parseInt(
    isShortHex ? hex.slice(0, 1).repeat(2) : hex.slice(0, 2),
    16
  );
  if (isNaN(r)) {
    return undefined;
  }
  var g = parseInt(
    isShortHex ? hex.slice(1, 2).repeat(2) : hex.slice(2, 4),
    16
  );
  if (isNaN(g)) {
    return undefined;
  }
  var b = parseInt(
    isShortHex ? hex.slice(2, 3).repeat(2) : hex.slice(4, 6),
    16
  );
  if (isNaN(b)) {
    return undefined;
  }
  return `${r}, ${g}, ${b}`;
}

function componentToHex(c: number) {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

function rgbNumberToHex(...rgb: number[]) {
  return (
    "#" +
    componentToHex(rgb[0]) +
    componentToHex(rgb[1]) +
    componentToHex(rgb[2])
  );
}

export function rgbStringToHex(s: string) {
  return rgbNumberToHex(...s.split(",").map((n) => parseInt(n.trim())));
}

const colorMapAndRangesFromMarkwhen = (
  timeline: Timeline,
  colorIndex: number
) => {
  const map = {} as Record<string, string>;
  const ranges = timeline.ranges.flatMap((r) => {
    if (r.type !== RangeType.Tag) {
      return [];
    }
    if (map[r.content.tag]) {
      r.content.color = map[r.content.tag];
      return [r];
    }
    const headerDefinition =
      r.content?.tag && timeline.header[")" + r.content.tag];
    let tagColorDefintion: string | undefined;
    tagColorDefintion =
      !!headerDefinition &&
      ((typeof headerDefinition === "string" && headerDefinition) ||
        (typeof headerDefinition === "object" && headerDefinition.color));
    if (tagColorDefintion) {
      const humanColorIndex = HUMAN_COLORS.indexOf(tagColorDefintion);
      if (humanColorIndex === -1) {
        const rgb = hexToRgb(tagColorDefintion);
        if (rgb) {
          r.content.color = rgb;
        } else {
          r.content.color = COLORS[colorIndex++ % COLORS.length];
        }
      } else {
        r.content.color = COLORS[humanColorIndex];
      }
    } else {
      r.content.color = COLORS[colorIndex++ % COLORS.length];
    }
    map[r.content.tag] = r.content.color;
    return [r];
  });
  return [map, ranges, colorIndex] as const;
};

export const useColors = (markwhen: Timeline) => {
  const map = computed(() => {
    let colorIndex = 0;
    const colorMap = {} as Record<string, Record<string, string>>;
    for (const [path, timeline] of [["default", markwhen]] as [
      string,
      Timeline
    ][]) {
      const [map, ranges, index] = colorMapAndRangesFromMarkwhen(
        timeline,
        colorIndex
      );
      colorMap[path] = map;
      colorIndex = index;
    }
    return colorMap;
  });
  return map;
};
