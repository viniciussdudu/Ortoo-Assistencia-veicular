import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import { Button, StyleSheet, Text, TextInput, View } from "react-native";

import { ShowAlert } from "../components/alert";
import { ApiError, login } from "../src/services/api";

export default function Index() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // O botão só estará habilitado se ambos os campos tiverem conteúdo
  const isFormValid = email.trim() !== "" && password.trim() !== "";

  const handleLogin = async () => {
    setSubmitting(true);

    try {
      await login({ email, password });
      ShowAlert("Login realizado", "Seus dados estão corretos.");
    } catch (error) {
      ShowAlert("Não foi possível entrar", error instanceof ApiError ? error.message : "Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Örtöö" }} />
      <Text style={styles.title}>Login</Text>

      <TextInput
        style={styles.input}
        placeholder="E-mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Senha"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Button 
        title="Entrar" 
        onPress={handleLogin} 
        disabled={!isFormValid || submitting} 
      />

      <Button
        title="recuperar senha"
        onPress={() => router.push("/recuperar-senha")}
      />


      <Button
        title="Criar conta"
        onPress={() => router.push("/cadastro")}
      />

      <Button
        title="testar-mapa"
        onPress={() => router.push("/solicitar-assistencia")}
      />

    </View>
  );

}

  const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 16,
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
  button: { backgroundColor: "#2563eb", borderRadius: 8, paddingVertical: 14, alignItems: "center", margin: 1000 },
  disabled: { backgroundColor: "#9ca3af" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  link: { color: "#2563eb", fontSize: 15, textAlign: "center", marginTop: 20 },
});
