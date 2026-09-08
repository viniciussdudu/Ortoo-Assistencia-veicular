import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { createAccount } from "../src/auth-store";

export default function Cadastro() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");

  const valid = email.trim() !== "" && password.trim().length >= 6 && confirmation.trim() !== "";

  const submit = () => {
    if (password !== confirmation) return Alert.alert("Senhas diferentes", "Digite a mesma senha nos dois campos.");
    const result = createAccount(email, password);
    if (!result.ok) return Alert.alert("Não foi possível criar a conta", result.message);
    Alert.alert("Conta criada", "Agora você pode entrar ou recuperar sua senha.", [
      { text: "Ir para o login", onPress: () => router.replace("/") },
    ]);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Criar Conta" }} />

      <View style={styles.formCard}>
        <Text style={styles.title}>Criar conta</Text>
        <Text style={styles.subtitle}>Os dados ficam disponíveis apenas enquanto o app estiver aberto.</Text>

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
          placeholder="Senha (mínimo 6 caracteres)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TextInput
          style={styles.input}
          placeholder="Confirmar senha"
          value={confirmation}
          onChangeText={setConfirmation}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, !valid && styles.disabled]}
          onPress={submit}
          disabled={!valid}
        >
          <Text style={styles.buttonText}>Criar conta</Text>
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