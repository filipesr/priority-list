import React from "react";
import type { WidgetTaskHandlerProps } from "react-native-android-widget";
import { completeExpense } from "../lib/expenses";
import { ExpensesWidget } from "./ExpensesWidget";
import { fetchWidgetData } from "./widget-data";
import type { WidgetData } from "./widget-data";

// Cache last fetched data to avoid redundant network calls on UI-only transitions
let cachedData: WidgetData | null = null;

function render(
  renderWidget: WidgetTaskHandlerProps["renderWidget"],
  expenses: any[],
  error?: string,
  confirmingId?: string,
) {
  renderWidget(
    React.createElement(ExpensesWidget, { expenses, error, confirmingId }),
  );
}

async function fetchAndCache(): Promise<WidgetData> {
  const data = await fetchWidgetData();
  cachedData = data;
  return data;
}

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const { widgetAction, renderWidget } = props;

  switch (widgetAction) {
    case "WIDGET_ADDED":
    case "WIDGET_UPDATE":
    case "WIDGET_RESIZED": {
      const data = await fetchAndCache();
      render(renderWidget, data.expenses, data.error);
      break;
    }

    case "WIDGET_CLICK": {
      const { clickAction } = props;

      if (clickAction === "REFRESH") {
        const data = await fetchAndCache();
        render(renderWidget, data.expenses, data.error);
      } else if (clickAction?.startsWith("CONFIRM_START:")) {
        // First tap: show confirmation UI — reuse cached data, no network call
        const expenseId = clickAction.replace("CONFIRM_START:", "");
        if (cachedData) {
          render(renderWidget, cachedData.expenses, cachedData.error, expenseId);
        } else {
          const data = await fetchAndCache();
          render(renderWidget, data.expenses, data.error, expenseId);
        }
      } else if (clickAction === "CONFIRM_CANCEL") {
        // Cancel: re-render without confirmation — reuse cached data
        if (cachedData) {
          render(renderWidget, cachedData.expenses, cachedData.error);
        } else {
          const data = await fetchAndCache();
          render(renderWidget, data.expenses, data.error);
        }
      } else if (clickAction?.startsWith("CONFIRM_YES:")) {
        // Second tap: actually complete — needs network, then refresh
        const expenseId = clickAction.replace("CONFIRM_YES:", "");
        try {
          await completeExpense(expenseId);
        } catch (err) {
          console.error("Widget complete error:", err);
        }
        const data = await fetchAndCache();
        render(renderWidget, data.expenses, data.error);
      }
      break;
    }

    case "WIDGET_DELETED":
      break;

    default:
      break;
  }
}
