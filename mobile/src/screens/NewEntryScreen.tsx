import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../App";
import { getExpense, addExpenseEntry } from "../lib/expenses";
import { formatCurrency } from "../lib/format";
import { formatDateISO } from "../shared/recurrence";
import type { Expense } from "../shared/types";
import { refreshWidget } from "../lib/widget-update";

type Props = NativeStackScreenProps<RootStackParamList, "NewEntry">;

export default function NewEntryScreen({ route, navigation }: Props) {
  const { expenseId } = route.params;
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const today = formatDateISO(new Date());
  const [date, setDate] = useState(today);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await getExpense(expenseId);
        setExpense(data);
        setAmount(String(data.amount));
      } catch {
        Alert.alert("Erro", "Despesa não encontrada", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      } finally {
        setLoading(false);
      }
    })();
  }, [expenseId, navigation]);

  const handleSave = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert("Erro", "Informe um valor válido");
      return;
    }

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      Alert.alert("Erro", "Informe uma data válida (AAAA-MM-DD)");
      return;
    }

    setSaving(true);
    try {
      await addExpenseEntry(expenseId, {
        date,
        amount: numAmount,
        description: description.trim() || undefined,
      });
      refreshWidget();
      Alert.alert("Sucesso", "Lançamento adicionado", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert(
        "Erro",
        err instanceof Error ? err.message : "Erro ao salvar",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        {expense && (
          <View style={styles.infoBox}>
            <Text style={styles.expenseName}>{expense.name}</Text>
            <Text style={styles.expenseInfo}>
              Planejado: {formatCurrency(expense.amount, expense.currency)}
            </Text>
            {expense.executed_amount > 0 && (
              <Text style={styles.expenseInfo}>
                Executado:{" "}
                {formatCurrency(expense.executed_amount, expense.currency)}
              </Text>
            )}
          </View>
        )}

        <Text style={styles.label}>Data</Text>
        <TextInput
          style={styles.input}
          value={date}
          onChangeText={setDate}
          placeholder="AAAA-MM-DD"
          placeholderTextColor="#64748b"
        />

        <Text style={styles.label}>Valor</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          placeholderTextColor="#64748b"
          keyboardType="decimal-pad"
        />

        <Text style={styles.label}>Descrição (opcional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Descrição do lançamento"
          placeholderTextColor="#64748b"
          multiline
          numberOfLines={3}
        />

        <TouchableOpacity
          style={[styles.button, saving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Salvar Lançamento</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
  },
  content: {
    padding: 24,
  },
  infoBox: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  expenseName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#f8fafc",
    marginBottom: 4,
  },
  expenseInfo: {
    fontSize: 14,
    color: "#94a3b8",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#cbd5e1",
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: "#1e293b",
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: "#f8fafc",
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  button: {
    backgroundColor: "#3b82f6",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
