"use no memo";

import React from "react";
import { FlexWidget, TextWidget } from "react-native-android-widget";
import type { ClickActionProps } from "react-native-android-widget";
import type { Expense, ExpenseCategory, ExpenseType } from "../shared/types";
import { formatCurrency, getDueDateDisplay } from "../lib/format";
import type { ColorProp } from "../lib/widget-types";

export const ExpensesWidgetName = "ExpensesWidget";

interface ExpensesWidgetProps {
  expenses: Expense[];
  error?: string;
  confirmingId?: string;
}

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  casa: "Casa",
  saude: "Saude",
  educacao: "Educacao",
  viagem: "Viagem",
  pessoais: "Pessoais",
  emergenciais: "Emergenciais",
  outro: "Outro",
};

const TYPE_ICONS: Record<ExpenseType, string> = {
  recorrente: "\u267B",
  esporadico: "\u2022",
  imprevisto: "\u2022",
};

function act(action: string): ClickActionProps {
  if (action === "OPEN_APP") {
    return { clickAction: "OPEN_APP" };
  }
  if (action.startsWith("ADD_ENTRY:")) {
    return {
      clickAction: "OPEN_URI",
      clickActionData: {
        uri: `prioritylist://add-entry/${action.replace("ADD_ENTRY:", "")}`,
      },
    };
  }
  // All other actions go to JS widget task handler
  return { clickAction: action, clickActionData: {} };
}

export function ExpensesWidget({
  expenses,
  error,
  confirmingId,
}: ExpensesWidgetProps) {
  if (error) {
    return (
      <FlexWidget
        style={{
          backgroundColor: "#1e293b",
          borderRadius: 16,
          padding: 16,
          width: "match_parent",
          height: "match_parent",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <TextWidget
          text={error}
          style={{ fontSize: 14, color: "#94a3b8", textAlign: "center" }}
        />
      </FlexWidget>
    );
  }

  return (
    <FlexWidget
      style={{
        backgroundColor: "#1e293b",
        borderRadius: 16,
        width: "match_parent",
        height: "match_parent",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <FlexWidget
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 10,
          paddingVertical: 8,
          borderBottomWidth: 1,
          borderBottomColor: "#334155",
          width: "match_parent",
        }}
      >
        <TextWidget
          text={`Despesas (${expenses.length})`}
          style={{ fontSize: 16, fontWeight: "700", color: "#f8fafc" }}
        />
        <FlexWidget
          style={{
            backgroundColor: "#334155",
            borderRadius: 6,
            width: 28,
            height: 28,
            justifyContent: "center",
            alignItems: "center",
          }}
          {...act("REFRESH")}
        >
          <TextWidget
            text={"\u21BB"}
            style={{ fontSize: 16, color: "#94a3b8" }}
          />
        </FlexWidget>
      </FlexWidget>

      {/* List */}
      {expenses.length === 0 ? (
        <FlexWidget
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 16,
          }}
        >
          <TextWidget
            text="Nenhuma despesa pendente"
            style={{ fontSize: 13, color: "#64748b" }}
          />
        </FlexWidget>
      ) : (
        <FlexWidget style={{ width: "match_parent", flexDirection: "column" }}>
          {expenses.slice(0, 5).map((expense) => {
            const isConfirming = confirmingId === expense.id;

            if (isConfirming) {
              // Confirmation row
              return (
                <FlexWidget
                  key={expense.id}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingHorizontal: 8,
                    paddingVertical: 8,
                    borderBottomWidth: 1,
                    borderBottomColor: "#334155",
                    width: "match_parent",
                    backgroundColor: "#1a2332",
                  }}
                >
                  <FlexWidget style={{ flex: 1 }}>
                    <TextWidget
                      text={`Concluir "${expense.name}"?`}
                      style={{
                        fontSize: 12,
                        fontWeight: "600",
                        color: "#f59e0b",
                      }}
                    />
                  </FlexWidget>
                  <FlexWidget style={{ flexDirection: "row", flexGap: 6 }}>
                    <FlexWidget
                      style={{
                        backgroundColor: "#166534",
                        borderRadius: 5,
                        width: 24,
                        height: 24,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                      {...act(`CONFIRM_YES:${expense.id}`)}
                    >
                      <TextWidget
                        text={"\u2713"}
                        style={{
                          fontSize: 13,
                          fontWeight: "700",
                          color: "#f8fafc",
                        }}
                      />
                    </FlexWidget>
                    <FlexWidget
                      style={{
                        backgroundColor: "#7f1d1d",
                        borderRadius: 5,
                        width: 24,
                        height: 24,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                      {...act("CONFIRM_CANCEL")}
                    >
                      <TextWidget
                        text={"\u2715"}
                        style={{
                          fontSize: 12,
                          fontWeight: "700",
                          color: "#f8fafc",
                        }}
                      />
                    </FlexWidget>
                  </FlexWidget>
                </FlexWidget>
              );
            }

            // Normal row
            const { label, color } = getDueDateDisplay(
              expense.due_date,
              expense.status,
            );
            const category =
              CATEGORY_LABELS[expense.category] ?? expense.category;
            const typeIcon = TYPE_ICONS[expense.type] ?? "\u2022";
            const amount = formatCurrency(expense.amount, expense.currency);
            const subtitle = `${amount}  \u00B7  ${category}  \u00B7  ${label}  \u00B7  ${typeIcon}`;

            return (
              <FlexWidget
                key={expense.id}
                style={{
                  flexDirection: "column",
                  paddingHorizontal: 8,
                  paddingVertical: 6,
                  borderBottomWidth: 1,
                  borderBottomColor: "#334155",
                  width: "match_parent",
                }}
              >
                {/* Row 1: [☐] nome ... [+] */}
                <FlexWidget
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "match_parent",
                  }}
                >
                  <FlexWidget
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      flex: 1,
                    }}
                  >
                    <FlexWidget
                      style={{
                        borderColor: "#475569",
                        borderWidth: 2,
                        borderRadius: 4,
                        width: 22,
                        height: 22,
                        justifyContent: "center",
                        alignItems: "center",
                        marginRight: 6,
                      }}
                      {...act(`CONFIRM_START:${expense.id}`)}
                    >
                      <TextWidget
                        text=" "
                        style={{ fontSize: 1, color: "#475569" }}
                      />
                    </FlexWidget>
                    <TextWidget
                      text={expense.name}
                      style={{
                        fontSize: 13,
                        fontWeight: "600",
                        color: "#f8fafc",
                      }}
                      {...act("OPEN_APP")}
                    />
                  </FlexWidget>
                  <FlexWidget
                    style={{
                      backgroundColor: "#334155",
                      borderRadius: 5,
                      width: 24,
                      height: 24,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                    {...act(`ADD_ENTRY:${expense.id}`)}
                  >
                    <TextWidget
                      text="+"
                      style={{
                        fontSize: 13,
                        fontWeight: "700",
                        color: "#f8fafc",
                      }}
                    />
                  </FlexWidget>
                </FlexWidget>

                {/* Row 2: categoria · vencimento · tipo */}
                <TextWidget
                  text={subtitle}
                  style={{
                    fontSize: 10,
                    color: color as ColorProp,
                    marginTop: 2,
                    marginLeft: 28,
                  }}
                />
              </FlexWidget>
            );
          })}
        </FlexWidget>
      )}
    </FlexWidget>
  );
}
