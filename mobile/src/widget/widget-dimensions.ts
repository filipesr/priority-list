import type { WidgetInfo } from "react-native-android-widget";

const MIN_VALID_WIDTH = 100;
const MIN_VALID_HEIGHT = 80;

// Matches expenses_widget_info.xml minWidth/minHeight
const FALLBACK_WIDTH = 250;
const FALLBACK_HEIGHT = 180;

const validCache = new Map<number, { width: number; height: number }>();

export function isValidWidgetSize(width: number, height: number): boolean {
  return (
    Number.isFinite(width) &&
    Number.isFinite(height) &&
    width >= MIN_VALID_WIDTH &&
    height >= MIN_VALID_HEIGHT
  );
}

export function getSafeWidgetDimensions(widgetInfo: WidgetInfo): {
  width: number;
  height: number;
  usedFallback: boolean;
} {
  const { width, height, widgetId } = widgetInfo;

  if (isValidWidgetSize(width, height)) {
    validCache.set(widgetId, { width, height });
    return { width, height, usedFallback: false };
  }

  const cached = validCache.get(widgetId);
  if (cached) {
    return { ...cached, usedFallback: true };
  }

  return { width: FALLBACK_WIDTH, height: FALLBACK_HEIGHT, usedFallback: true };
}
