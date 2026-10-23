import { Stack } from "expo-router";
import React from "react";
import StripeProviderWrapper from "../components/StripeProviderWrapper";

export default function RootLayout() {
  const content = (
    <Stack
    screenOptions={{
      headerShown: false,
    }}
    />
  );

  return <StripeProviderWrapper>{content}</StripeProviderWrapper>;
}
