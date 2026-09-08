import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { resetPassword } from "../src/auth-store";

export default function RecuperarSenha() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");

  const valid = email.trim() !== "" && password.trim().length >= 6 && confirmation.trim() !== "";

  const submit = () => {
    if (password !== confirmation) return Alert.alert("Senhas diferentes", "Digite a mesma senha nos dois campos.");
    const result = resetPassword(email, password);
    if (!result.ok) return Alert.alert("Conta não encontrada", result.message);
    Alert.alert("Senha alterada", "Use sua nova senha para entrar. Esta alteração vale somente nesta sessão.", [
      { text: "Ir para o login", onPress: () => router.replace("/") },
    ]);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Recuperar Senha" }} />

      <View style={styles.formCard}>
        <Text style={styles.title}>Recuperar senha</Text>
        <Text style={styles.subtitle}>Informe o e-mail da conta e defina uma nova senha. Nenhum e-mail será enviado.</Text>

        <TextInput
          style={styles.input}
          placeholder="E-mail cadastrado"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextInput
          style={styles.input}
          placeholder="Nova senha (mínimo 6 caracteres)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TextInput
          style={styles.input}
          placeholder="Confirmar nova senha"
          value={confirmation}
          onChangeText={setConfirmation}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, !valid && styles.disabled]}
          onPress={submit}
          disabled={!valid}
        >
          <Text style={styles.buttonText}>Alterar senha</Text>
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
    alignItems: "center", // Centraliza o cartão horizontalmente na Web
    paddingHorizontal: 24,
    backgroundColor: "#fff",
  },
  formCard: {
    width: "100%",      // Ocupa 100% no mobile
    maxWidth: 400,     // Limita a largura em 400px no computador
  },
  title: { fontSize: 28, fontWeight: "bold", textAlign: "center", marginBottom: 8 },
  subtitle: { fontSize: 14, color: "#666", textAlign: "center", lineHeight: 20, marginBottom: 24 },
  input: { height: 48, borderColor: "#ccc", borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, marginBottom: 16 },
  button: { backgroundColor: "#2563eb", borderRadius: 8, paddingVertical: 14, alignItems: "center" },
  disabled: { backgroundColor: "#9ca3af" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  link: { color: "#2563eb", fontSize: 15, textAlign: "center", marginTop: 20 },
});