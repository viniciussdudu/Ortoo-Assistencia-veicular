import { StripeProvider } from "@stripe/stripe-react-native";
import { ReactElement } from "react";

const STRIPE_KEY =
  process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
  "pk_test_51...SUA_CHAVE_DE_TESTES_AQUI";

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