import { Stack } from "expo-router";
import StripeProviderWrapper from '../components/StripeProviderWrapper';

export default function RootLayout() {
  return (
    <StripeProviderWrapper>
      <Stack />
    </StripeProviderWrapper>
  );
}