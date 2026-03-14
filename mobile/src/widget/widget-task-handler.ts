import React from "react";
import type { WidgetTaskHandlerProps } from "react-native-android-widget";
import { completeExpense } from "../lib/expenses";
import { ExpensesWidget } from "./ExpensesWidget";
import { fetchWidgetData } from "./widget-data";

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

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const { widgetAction, renderWidget } = props;

  switch (widgetAction) {
    case "WIDGET_ADDED":
    case "WIDGET_UPDATE":
    case "WIDGET_RESIZED": {
      const data = await fetchWidgetData();
      render(renderWidget, data.expenses, data.error);
      break;
    }

    case "WIDGET_CLICK": {
      const { clickAction } = props;

      if (clickAction === "REFRESH") {
        const data = await fetchWidgetData();
        render(renderWidget, data.expenses, data.error);
      } else if (clickAction?.startsWith("CONFIRM_START:")) {
        // First tap: show confirmation UI for this item
        const expenseId = clickAction.replace("CONFIRM_START:", "");
        const data = await fetchWidgetData();
        render(renderWidget, data.expenses, data.error, expenseId);
      } else if (clickAction === "CONFIRM_CANCEL") {
        // Cancel: re-render without confirmation
        const data = await fetchWidgetData();
        render(renderWidget, data.expenses, data.error);
      } else if (clickAction?.startsWith("CONFIRM_YES:")) {
        // Second tap: actually complete
        const expenseId = clickAction.replace("CONFIRM_YES:", "");
        try {
          await completeExpense(expenseId);
        } catch (err) {
          console.error("Widget complete error:", err);
        }
        const data = await fetchWidgetData();
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
