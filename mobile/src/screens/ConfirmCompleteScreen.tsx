import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../App";
import { getExpense, completeExpense } from "../lib/expenses";
import { formatCurrency, getDueDateDisplay } from "../lib/format";
import { refreshWidget } from "../lib/widget-update";
import type { Expense } from "../shared/types";

type Props = NativeStackScreenProps<RootStackParamList, "ConfirmComplete">;

export default function ConfirmCompleteScreen({ route, navigation }: Props) {
  const { expenseId } = route.params;
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await getExpense(expenseId);
        setExpense(data);
      } catch {
        Alert.alert("Erro", "Despesa nao encontrada", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      } finally {
        setLoading(false);
      }
    })();
  }, [expenseId, navigation]);

  const handleComplete = async () => {
    if (!expense) return;
    setCompleting(true);
    try {
      await completeExpense(expense.id);
      await refreshWidget();
      navigation.replace("Home");
    } catch (err) {
      Alert.alert(
        "Erro",
        err instanceof Error ? err.message : "Erro ao concluir",
      );
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!expense) return null;

  const { label } = getDueDateDisplay(expense.due_date, expense.status);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Concluir despesa?</Text>
        <Text style={styles.name}>{expense.name}</Text>
        <Text style={styles.amount}>
          {formatCurrency(expense.amount, expense.currency)}
        </Text>
        <Text style={styles.detail}>{label}</Text>

        <View style={styles.buttons}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleComplete}
            disabled={completing}
          >
            {completing ? (
              <ActivityIndicator size="small" color="#f8fafc" />
            ) : (
              <Text style={styles.confirmText}>Concluir</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0f172a",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0f172a",
    padding: 24,
  },
  card: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#f8fafc",
    marginBottom: 16,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#f8fafc",
    marginBottom: 4,
  },
  amount: {
    fontSize: 20,
    fontWeight: "700",
    color: "#3b82f6",
    marginBottom: 4,
  },
  detail: {
    fontSize: 14,
    color: "#94a3b8",
    marginBottom: 24,
  },
  buttons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#334155",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelText: {
    color: "#94a3b8",
    fontSize: 15,
    fontWeight: "600",
  },
  confirmButton: {
    flex: 1,
    backgroundColor: "#166534",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  confirmText: {
    color: "#f8fafc",
    fontSize: 15,
    fontWeight: "600",
  },
});
