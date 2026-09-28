import { StripeProvider } from '@stripe/stripe-react-native';
import { Stack } from "expo-router";
import { ReactNode } from 'react';

export default function StripeProviderWrapper({ children }: { children: ReactNode }) {
  return (
    <StripeProvider
      publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""}
    >
      <Stack />
    </StripeProvider>
  );
}