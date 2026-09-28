import { ShowAlert } from "@/components/alert";
import { CardField, useStripe } from "@stripe/stripe-react-native";
import { Stack } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { styles } from '../app/cadastro';

const CLIENT_ID = 1;
const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.100:3000/api";

interface CardDetails {
  complete: boolean;
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
}

export default function AdicionarCartao() {
  const { confirmSetupIntent } = useStripe();
  const [cardDetails, setCardDetails] = useState<CardDetails>({ complete: false });
  const [salvando, setSalvando] = useState(false);

  async function handleSalvarCartao() {
    if (!cardDetails.complete) {
      ShowAlert("Cartao incompleto", "Preencha todos os dados do cartao.");
      return;
    }

    setSalvando(true);
    try {
      const setupResponse = await fetch(`${API_URL}/pagamento/novo-cartão`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id: CLIENT_ID }),
      });

      if (!setupResponse.ok) throw new Error("Nao foi possivel iniciar o cadastro do cartao.");

      const { client_secret: clientSecret } = await setupResponse.json();
      const { setupIntent, error } = await confirmSetupIntent(clientSecret, {
        paymentMethodType: "Card",
        paymentMethodData: { billingDetails: {} },
      });
      if (error || !setupIntent?.paymentMethodId) {
        throw new Error(error?.message || "Nao foi possivel validar o cartao.");
      }

      const saveResponse = await fetch(`${API_URL}/pagamento/salvar-cartão`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuario_id: CLIENT_ID,
          payment_method_id: setupIntent.paymentMethodId,
          ultimos_digitos: cardDetails.last4,
          bandeira: cardDetails.brand,
          validade_mes: cardDetails.expiryMonth,
          validade_ano: cardDetails.expiryYear,
        }),
      });
      if (!saveResponse.ok) throw new Error("O cartao foi validado, mas nao pode ser salvo.");

      ShowAlert("Sucesso", "Cartao salvo com sucesso.");
    } catch (error) {
      ShowAlert("Erro", error instanceof Error ? error.message : "Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Adicionar cartao" }} />
      <View style={styles.formCard}>
        <Text style={styles.title}>Adicionar cartao</Text>
        <Text style={styles.subtitle}>Seus dados serao tratados com seguranca pelo Stripe.</Text>
        <CardField
          postalCodeEnabled={false}
          placeholders={{ number: "Numero do cartao" }}
          cardStyle={styles.cardField}
          style={styles.input}
          onCardChange={(details) => setCardDetails(details)}
        />
        <TouchableOpacity
          style={[styles.button, (!cardDetails.complete || salvando) && styles.disabled]}
          onPress={handleSalvarCartao}
          disabled={!cardDetails.complete || salvando}
        >
          {salvando ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Salvar cartao</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}