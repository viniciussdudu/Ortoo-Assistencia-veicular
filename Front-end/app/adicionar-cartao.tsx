import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.100:3000/api";
const CLIENTE_ID = 1; // ID do usuário logado

export default function AdicionarCartao() {
  const router = useRouter();

  const [numero, setNumero] = useState("");
  const [nome, setNome] = useState("");
  const [validade, setValidade] = useState("");
  const [cvv, setCvv] = useState("");
  const [salvando, setSalvando] = useState(false);

  // Formata o número do cartão com espaços
  const handleNumeroChange = (text: string) => {
    const limpo = text.replace(/\D/g, "");
    const formatado = limpo.replace(/(\d{4})/g, "$1 ").trim();
    setNumero(formatado.slice(0, 19));
  };

  // Formata a validade no formato MM/AA
  const handleValidadeChange = (text: string) => {
    const limpo = text.replace(/\D/g, "");
    if (limpo.length >= 3) {
      setValidade(`${limpo.slice(0, 2)}/${limpo.slice(2, 4)}`);
    } else {
      setValidade(limpo);
    }
  };

  async function handleSalvarCartao() {
    if (!numero || !nome || !validade || !cvv) {
      Alert.alert("Atenção", "Por favor, preencha todos os campos do cartão.");
      return;
    }

    const [mes, ano] = validade.split("/");
    const ultimosDigitos = numero.replace(/\s/g, "").slice(-4);

    setSalvando(true);

    try {
      const response = await fetch(`${API_URL}/pagamento/salvar-cartao`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuario_id: CLIENTE_ID,
          payment_method_id: `pm_simulated_${Date.now()}`,
          ultimos_digitos: ultimosDigitos || "4242",
          bandeira: "Visa",
          validade_mes: Number(mes) || 12,
          validade_ano: Number(`20${ano}`) || 2028,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Sucesso", "Cartão adicionado com sucesso!", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } else {
        Alert.alert("Erro", data.erro || "Não foi possível salvar o cartão.");
      }
    } catch (error) {
      Alert.alert("Erro de Conexão", "Não foi possível se conectar ao servidor.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Botão Voltar */}
          <TouchableOpacity style={styles.botaoVoltar} onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={20} color="#ffffff" />
            <Text style={styles.voltarTexto}>Voltar</Text>
          </TouchableOpacity>

          <Text style={styles.titulo}>Novo Cartão</Text>
          <Text style={styles.subtitulo}>
            Insira os dados do cartão para salvar no seu perfil.
          </Text>

          {/* Form Número */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Número do Cartão</Text>
            <TextInput
              style={styles.input}
              placeholder="0000 0000 0000 0000"
              placeholderTextColor="#6b7280"
              keyboardType="number-pad"
              maxLength={19}
              value={numero}
              onChangeText={handleNumeroChange}
            />
          </View>

          {/* Form Nome */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Nome Impresso no Cartão</Text>
            <TextInput
              style={styles.input}
              placeholder="João Silva"
              placeholderTextColor="#6b7280"
              autoCapitalize="characters"
              value={nome}
              onChangeText={setNome}
            />
          </View>

          {/* Row Validade e CVV */}
          <View style={styles.row}>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>Validade (MM/AA)</Text>
              <TextInput
                style={styles.input}
                placeholder="12/28"
                placeholderTextColor="#6b7280"
                keyboardType="number-pad"
                maxLength={5}
                value={validade}
                onChangeText={handleValidadeChange}
              />
            </View>

            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>CVV</Text>
              <TextInput
                style={styles.input}
                placeholder="123"
                placeholderTextColor="#6b7280"
                keyboardType="number-pad"
                maxLength={4}
                secureTextEntry
                value={cvv}
                onChangeText={setCvv}
              />
            </View>
          </View>

          {/* Botão Salvar */}
          <TouchableOpacity
            style={[styles.botaoSalvar, salvando && styles.botaoDisabled]}
            onPress={handleSalvarCartao}
            disabled={salvando}
            activeOpacity={0.8}
          >
            {salvando ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.botaoSalvarTexto}>Salvar Cartão</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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