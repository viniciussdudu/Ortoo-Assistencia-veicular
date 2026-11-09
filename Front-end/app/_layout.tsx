import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { LogBox, Platform } from "react-native";
import StripeProviderWrapper from "../components/StripeProviderWrapper";
import { TemaProvider, useTema } from "../src/tema";

// Desativa avisos do LogBox na Web para evitar colisões com o inspector
if (Platform.OS === "web") {
  LogBox.ignoreAllLogs();
}

function Navegacao() {
  const { cores, escuro } = useTema();

  return (
    <>
      <StatusBar style={escuro ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: cores.fundo },
        }}
      />
    </>
  );
}

export default function RootLayout() {
  const content = (
    <TemaProvider>
      <Navegacao />
    </TemaProvider>
  );

  // No navegador web, ignora o StripeProvider nativo para evitar ecrã em branco
  if (Platform.OS === "web") {
    return content;
  }

  // Em Android / iOS, utiliza o wrapper nativo do Stripe
  return <StripeProviderWrapper>{content}</StripeProviderWrapper>;
}
