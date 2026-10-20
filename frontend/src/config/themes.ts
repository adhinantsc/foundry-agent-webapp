import {
  type BrandVariants,
  createDarkTheme,
  createLightTheme,
  type Theme,
} from "@fluentui/react-components";

// RAKTA brand ramp built around the logo blue (#00498F at slot 80)
const brandColors: BrandVariants = {
  10: "#01070F",
  20: "#03111F",
  30: "#051B30",
  40: "#062541",
  50: "#052F55",
  60: "#033A6A",
  70: "#01417C",
  80: "#00498F",
  90: "#1A5A9C",
  100: "#336BA8",
  110: "#4A7DB5",
  120: "#618EC1",
  130: "#78A0CD",
  140: "#90B3D8",
  150: "#A9C5E3",
  160: "#C2D8EE",
};

// Readex Pro covers Latin and Arabic, so a future Arabic UI needs no second family
const fontFamilyBase =
  "'Readex Pro Variable', 'Segoe UI', system-ui, -apple-system, sans-serif";

// Lane Gold from the logo. Darker in light mode so the focus ring keeps 3:1 on white.
const laneGoldOnLight = "#9C7608";
const laneGoldOnDark = "#D9A514";

export const lightTheme: Theme = {
  ...createLightTheme(brandColors),
  fontFamilyBase,
  colorNeutralBackground2: "#F5F7FA",
  colorNeutralForeground2: "#3F4043",
  colorNeutralForeground3: "#58595B",
  colorStrokeFocus2: laneGoldOnLight,
};

// Dark surfaces are tinted towards Night Route (#0B2340) rather than neutral grey
export const darkTheme: Theme = {
  ...createDarkTheme(brandColors),
  fontFamilyBase,
  colorNeutralBackground1: "#0E1A2B",
  colorNeutralBackground1Hover: "#15253B",
  colorNeutralBackground1Pressed: "#0A1422",
  colorNeutralBackground1Selected: "#15253B",
  colorNeutralBackground2: "#122136",
  colorNeutralBackground2Hover: "#192B44",
  colorNeutralBackground3: "#162840",
  colorNeutralBackground3Hover: "#1D3250",
  colorNeutralBackground4: "#1B2F4A",
  colorSubtleBackgroundHover: "#1A2C45",
  colorSubtleBackgroundPressed: "#13233A",
  colorNeutralStroke1: "#2E4565",
  colorNeutralStroke2: "#22364F",
  colorBrandForeground1: brandColors[130],
  colorBrandForeground2: brandColors[140],
  colorBrandForegroundLink: brandColors[150],
  colorStrokeFocus2: laneGoldOnDark,
};
