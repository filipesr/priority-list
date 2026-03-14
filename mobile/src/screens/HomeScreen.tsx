import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../App";
import { getWidgetExpenses, completeExpense } from "../lib/expenses";
import { signOut } from "../lib/auth";
import type { Expense } from "../shared/types";
import { formatCurrency, getDueDateDisplay } from "../lib/format";
import { refreshWidget } from "../lib/widget-update";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchExpenses = useCallback(async () => {
    try {
      const data = await getWidgetExpenses();
      setExpenses(data);
    } catch (err) {
      console.error("Error fetching expenses:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  // Refresh widget when app opens
  useEffect(() => {
    refreshWidget();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchExpenses();
  };

  const handleComplete = (expense: Expense) => {
    Alert.alert(
      "Concluir despesa",
      `Deseja concluir "${expense.name}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Concluir",
          onPress: async () => {
            try {
              await completeExpense(expense.id);
              await fetchExpenses();
              refreshWidget();
            } catch (err) {
              Alert.alert("Erro", err instanceof Error ? err.message : "Erro ao concluir");
            }
          },
        },
      ],
    );
  };

  const handleLogout = () => {
    Alert.alert("Sair", "Deseja sair da sua conta?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          await signOut();
          navigation.replace("Login");
        },
      },
    ]);
  };

  const renderExpense = ({ item }: { item: Expense }) => {
    const { label, color } = getDueDateDisplay(item.due_date);

    return (
      <View style={styles.expenseCard}>
        <View style={styles.expenseHeader}>
          <Text style={styles.expenseName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.expenseAmount}>
            {formatCurrency(item.amount, item.currency)}
          </Text>
        </View>
        <View style={styles.expenseFooter}>
          <Text style={[styles.dueDate, { color }]}>{label}</Text>
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() =>
                navigation.navigate("NewEntry", { expenseId: item.id })
              }
            >
              <Text style={styles.actionText}>+</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.completeButton]}
              onPress={() => handleComplete(item)}
            >
              <Text style={styles.actionText}>✓</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Despesas Pendentes</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>

      {expenses.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Nenhuma despesa pendente</Text>
          <Text style={styles.emptySubtext}>
            Despesas vencidas ou dos próximos 3 dias aparecerão aqui
          </Text>
        </View>
      ) : (
        <FlatList
          data={expenses}
          keyExtractor={(item) => item.id}
          renderItem={renderExpense}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#3b82f6"
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0f172a",
    padding: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingTop: 48,
    backgroundColor: "#1e293b",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#f8fafc",
  },
  logoutText: {
    color: "#ef4444",
    fontSize: 14,
    fontWeight: "600",
  },
  list: {
    padding: 16,
    gap: 12,
  },
  expenseCard: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  expenseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  expenseName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#f8fafc",
    flex: 1,
    marginRight: 8,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#f8fafc",
  },
  expenseFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dueDate: {
    fontSize: 13,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    backgroundColor: "#334155",
    borderRadius: 8,
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  completeButton: {
    backgroundColor: "#166534",
  },
  actionText: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "700",
  },
  emptyText: {
    color: "#94a3b8",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptySubtext: {
    color: "#64748b",
    fontSize: 14,
    textAlign: "center",
  },
});
