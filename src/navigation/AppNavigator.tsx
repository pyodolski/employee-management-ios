import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "../screens/LoginScreen";
import DashboardScreen from "../screens/DashboardScreen";
import AdminScreen from "../screens/AdminScreen";

export type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
  Admin: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{ title: "대시보드" }}
        />
        <Stack.Screen
          name="Admin"
          component={AdminScreen}
          options={{ title: "관리자" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
