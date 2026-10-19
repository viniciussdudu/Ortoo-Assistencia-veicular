import { useStripe } from "@stripe/stripe-react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const CLIENTE_ID = 1; // TODO: usuário logado
const API_URL = (process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api").replace(/\/$/, "");

export default function AdicionarCartaoForm() {
  const router = useRouter();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [carregando, setCarregando] = useState(false);

  async function adicionarCartao() {
    setCarregando(true);
    try {
      // Para criar o novo cartão no Stripe
      const r1 = await fetch(`${API_URL}/pagamento/novo-cartao`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario_id: CLIENTE_ID }),
      });
      const d1 = await r1.json();
      if (!r1.ok) throw new Error(d1.erro || "Erro ao iniciar cadastro.");

      // Folha pré pronta recomendada pelo Stripe
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: "Ortoo",
        setupIntentClientSecret: d1.client_secret,
        returnURL: "ortoo://stripe-redirect",
        allowsDelayedPaymentMethods: false,
        appearance: {
          colors: {
            primary: "#1E90FF",
            background: "#FFFFFF",
            componentBackground: "#F5F7FA",
            componentBorder: "#E0E4EA",
            componentText: "#111111",
            primaryText: "#111111",
            secondaryText: "#6B7280",
            placeholderText: "#9CA3AF",
          },
          shapes: { borderRadius: 12, borderWidth: 1 },
          primaryButton: { shapes: { borderRadius: 12 } },
        },
      });
      if (initError) throw new Error(initError.message);

      // Abre a folha
      const { error } = await presentPaymentSheet();
      if (error) {
        if (error.code !== "Canceled") Alert.alert("Erro", error.message);
        return;
      }

      // Backend salva
      const r2 = await fetch(`${API_URL}/pagamento/salvar-cartao`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuario_id: CLIENTE_ID,
          setup_intent_id: d1.setup_intent_id,
        }),
      });
      const d2 = await r2.json();
      if (!r2.ok) throw new Error(d2.erro || "Não foi possível salvar o cartão.");

      Alert.alert("Sucesso", "Cartão adicionado!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert("Erro", e instanceof Error ? e.message : "Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Novo cartão</Text>
      <Text style={styles.subtitulo}>Insira os dados do cartão para salvar no seu perfil</Text>

      <TouchableOpacity style={styles.botaoSalvar} onPress={adicionarCartao} disabled={carregando}>
        {carregando ? <ActivityIndicator color="#fff" /> : <Text style={styles.botaoSalvarTexto}>Salvar cartão</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
  },
  botaoVoltar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 20,
  },
  voltarTexto: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
  titulo: {
    fontSize: 28,
    fontWeight: "800",
    color: "#ffffff",
  },
  subtitulo: {
    fontSize: 14,
    color: "#9ca3af",
    marginTop: 4,
    marginBottom: 28,
  },
  formGroup: {
    marginBottom: 18,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#d1d5db",
    marginBottom: 6,
  },
  input: {
    height: 52,
    backgroundColor: "#111827",
    borderColor: "#1f2937",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    color: "#ffffff",
    fontSize: 15,
  },
  botaoSalvar: {
    height: 52,
    backgroundColor: "#2563eb",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  botaoDisabled: {
    backgroundColor: "#1f2937",
    shadowOpacity: 0,
    elevation: 0,
  },
  botaoSalvarTexto: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});