import { StripeProvider } from "@stripe/stripe-react-native";
import { ReactElement } from "react";

const STRIPE_KEY =
  process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";

export default function StripeProviderWrapper({
  children,
}: {
  children: ReactElement;
}) {
  return (
    <StripeProvider publishableKey={STRIPE_KEY}>
      {children}
    </StripeProvider>
  );
}