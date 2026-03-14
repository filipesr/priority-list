import React, { useEffect, useState } from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { registerWidgetTaskHandler } from "react-native-android-widget";

import LoginScreen from "./screens/LoginScreen";
import HomeScreen from "./screens/HomeScreen";
import NewEntryScreen from "./screens/NewEntryScreen";
import ConfirmCompleteScreen from "./screens/ConfirmCompleteScreen";
import { getSession } from "./lib/auth";
import { widgetTaskHandler } from "./widget/widget-task-handler";

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  NewEntry: { expenseId: string };
  ConfirmComplete: { expenseId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Register widget task handler
registerWidgetTaskHandler(widgetTaskHandler);

// Deep linking config for widget actions
const linking = {
  prefixes: ["prioritylist://"],
  config: {
    screens: {
      NewEntry: "add-entry/:expenseId",
      ConfirmComplete: "complete/:expenseId",
      Home: "home",
    },
  },
};

export default function App() {
  const [initialRoute, setInitialRoute] = useState<
    keyof RootStackParamList | null
  >(null);

  useEffect(() => {
    (async () => {
      const session = await getSession();
      setInitialRoute(session ? "Home" : "Login");
    })();
  }, []);

  if (!initialRoute) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerStyle: { backgroundColor: "#1e293b" },
          headerTintColor: "#f8fafc",
          headerTitleStyle: { fontWeight: "600" },
          contentStyle: { backgroundColor: "#0f172a" },
        }}
      >
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="NewEntry"
          component={NewEntryScreen}
          options={{ title: "Novo Lançamento" }}
        />
        <Stack.Screen
          name="ConfirmComplete"
          component={ConfirmCompleteScreen}
          options={{ title: "Concluir Despesa" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0f172a",
  },
});
