import React from "react";
import { requestWidgetUpdate } from "react-native-android-widget";
import { ExpensesWidget, ExpensesWidgetName } from "../widget/ExpensesWidget";
import { fetchWidgetData } from "../widget/widget-data";

export async function refreshWidget(): Promise<void> {
  try {
    await requestWidgetUpdate({
      widgetName: ExpensesWidgetName,
      renderWidget: async () => {
        const data = await fetchWidgetData();
        return React.createElement(ExpensesWidget, data);
      },
    });
  } catch {
    // Widget may not be added to home screen
  }
}
