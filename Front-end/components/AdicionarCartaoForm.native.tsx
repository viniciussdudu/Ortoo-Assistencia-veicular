import { useStripe } from "@stripe/stripe-react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Cores, useEstilos, useTema } from "../src/tema";

const CLIENTE_ID = 1; // TODO: usuário logado
const API_URL = (process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api").replace(/\/$/, "");

export default function AdicionarCartaoForm() {
  const { cores: CORES } = useTema();
  const styles = useEstilos(criarEstilos);
  const router = useRouter();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [carregando, setCarregando] = useState(false);

  async function adicionarCartao() {
    setCarregando(true);
    try {
      const r1 = await fetch(`${API_URL}/pagamento/novo-cartao`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario_id: CLIENTE_ID }),
      });
      const d1 = await r1.json();
      if (!r1.ok) throw new Error(d1.erro || "Erro ao iniciar cadastro.");

      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: "Ortoo",
        setupIntentClientSecret: d1.client_secret,
        returnURL: "ortoo://stripe-redirect",
        allowsDelayedPaymentMethods: false,
        appearance: {
          colors: {
            primary: CORES.primaria,
            background: CORES.fundo,
            componentBackground: CORES.cartao,
            componentBorder: CORES.borda,
            componentText: CORES.texto,
            primaryText: CORES.texto,
            secondaryText: CORES.textoSuave,
            placeholderText: CORES.textoSuave,
          },
          shapes: { borderRadius: 12, borderWidth: 1 },
          primaryButton: { shapes: { borderRadius: 12 } },
        },
      });
      if (initError) throw new Error(initError.message);

      const { error } = await presentPaymentSheet();
      if (error) {
        if (error.code !== "Canceled") Alert.alert("Erro", error.message);
        return;
      }

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
    <SafeAreaView style={styles.tela}>
      <View style={styles.conteudo}>
        <Text style={styles.titulo}>Novo cartão</Text>
        <Text style={styles.subtitulo}>Insira os dados do cartão para salvar no seu perfil</Text>
        <TouchableOpacity style={styles.botaoSalvar} onPress={adicionarCartao} disabled={carregando}>
          {carregando ? <ActivityIndicator color={CORES.sobrePrimaria} /> : <Text style={styles.textoBotao}>Salvar cartão</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const criarEstilos = (CORES: Cores) =>
  StyleSheet.create({
  tela: { flex: 1, backgroundColor: CORES.fundo },
  conteudo: { flex: 1, paddingHorizontal: 20, paddingTop: 32 },
  titulo: { fontSize: 28, fontWeight: "800", color: CORES.texto },
  subtitulo: { fontSize: 14, color: CORES.textoSuave, marginTop: 4, marginBottom: 28 },
  botaoSalvar: {
    height: 52,
    backgroundColor: CORES.primaria,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  textoBotao: { color: CORES.sobrePrimaria, fontSize: 16, fontWeight: "700" },
});
