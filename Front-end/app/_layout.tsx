import { Stack } from "expo-router";
import React from "react";
import { LogBox, Platform } from "react-native";
import StripeProviderWrapper from "../components/StripeProviderWrapper";

// Desativa avisos do LogBox na Web para evitar colisões com o inspector
if (Platform.OS === "web") {
  LogBox.ignoreAllLogs();
}

export default function RootLayout() {
  const content = (
    <Stack
    screenOptions={{
      headerShown: false,
    }}
    />
  );

  // No navegador web, ignora o StripeProvider nativo para evitar ecrã em branco
  if (Platform.OS === "web") {
    return content;
  }

  // Em Android / iOS, utiliza o wrapper nativo do Stripe
  return <StripeProviderWrapper>{content}</StripeProviderWrapper>;
}
