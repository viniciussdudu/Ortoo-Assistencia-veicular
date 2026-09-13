import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { ApiError, register } from "../src/services/api";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Cadastro() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const valid = nome.trim() !== "" && EMAIL_PATTERN.test(email.trim()) && cpf.replace(/\D/g, "").length === 11 && /^\d{6}$/.test(password) && confirmation !== "";

  const submit = async () => {
    if (password !== confirmation) return Alert.alert("Senhas diferentes", "Digite a mesma senha nos dois campos.");
    if (!EMAIL_PATTERN.test(email.trim())) return Alert.alert("E-mail inválido", "Informe um e-mail válido.");
    if (!/^\d{6}$/.test(password)) return Alert.alert("Senha inválida", "A senha deve ter exatamente 6 dígitos numéricos.");

    setSubmitting(true);
    try {
      await register({ nome, email, documento: cpf, password });
      router.replace("/");
    } catch (error) {
      Alert.alert("Não foi possível criar a conta", error instanceof ApiError ? error.message : "Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Criar Conta" }} />

      <View style={styles.formCard}>
        <Text style={styles.title}>Criar conta</Text>
        <Text style={styles.subtitle}>Informe seus dados para criar sua conta.</Text>

        <TextInput
          style={styles.input}
          placeholder="Nome completo"
          value={nome}
          onChangeText={setNome}
        />

        <TextInput
          style={styles.input}
          placeholder="E-mail"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextInput
          style={styles.input}
          placeholder="CPF"
          value={cpf}
          onChangeText={setCpf}
          keyboardType="number-pad"
        />
        <TextInput
          style={styles.input}
          placeholder="Senha (6 dígitos)"
          value={password}
          onChangeText={setPassword}
          keyboardType="number-pad"
          secureTextEntry
        />
        <TextInput
          style={styles.input}
          placeholder="Confirmar senha"
          value={confirmation}
          onChangeText={setConfirmation}
          keyboardType="number-pad"
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, (!valid || submitting) && styles.disabled]}
          onPress={submit}
          disabled={!valid || submitting}
        >
          <Text style={styles.buttonText}>{submitting ? "Criando..." : "Criar conta"}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.link}>Voltar ao login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center", // Centraliza o formulário na Web
    paddingHorizontal: 24,
    backgroundColor: "#fff"
  },
  formCard: {
    width: "100%",     // Ocupa a largura total em telas mobile
    maxWidth: 400,    // Limita o tamanho em 400px no computador
  },
  title: { fontSize: 28, fontWeight: "bold", textAlign: "center", marginBottom: 8 },
  subtitle: { fontSize: 14, color: "#666", textAlign: "center", marginBottom: 24 },
  input: { height: 48, borderColor: "#ccc", borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, marginBottom: 16 },
  button: { backgroundColor: "#2563eb", borderRadius: 8, paddingVertical: 14, alignItems: "center" },
  disabled: { backgroundColor: "#9ca3af" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  link: { color: "#2563eb", fontSize: 15, textAlign: "center", marginTop: 20 },
});
