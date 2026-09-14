import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const cleanCpf = cpf.replace(/\D/g, "");
  const valid =
    nome.trim() !== "" &&
    EMAIL_PATTERN.test(email.trim()) &&
    cleanCpf.length === 11 &&
    /^\d{6}$/.test(password) &&
    confirmation !== "";

  const showAlert = (title: string, msg: string) => {
    if (Platform.OS === "web") {
      alert(`${title}: ${msg}`);
    } else {
      alert(`${title}: ${msg}`);
    }
  };

  const submit = async () => {
    setErrorMessage(null);

    if (password !== confirmation) {
      setErrorMessage("Senhas diferentes. Digite a mesma senha nos dois campos.");
      return;
    }
    if (!EMAIL_PATTERN.test(email.trim())) {
      setErrorMessage("Informe um e-mail válido.");
      return;
    }
    if (!/^\d{6}$/.test(password)) {
      setErrorMessage("A senha deve ter exatamente 6 dígitos numéricos.");
      return;
    }

    setSubmitting(true);
    try {
      await register({ nome, email, documento: cleanCpf, password });
      showAlert("Sucesso", "Conta criada com sucesso!");
      router.replace("/");
    } catch (error) {
      const msg = error instanceof ApiError ? error.message : "Tente novamente.";
      setErrorMessage(msg);
      console.error("[ERRO NO CADASTRO]:", error);
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

        {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

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
          placeholder="CPF (11 dígitos)"
          value={cpf}
          onChangeText={setCpf}
          keyboardType="number-pad"
          maxLength={14}
        />

        <TextInput
          style={styles.input}
          placeholder="Senha (6 dígitos numéricos)"
          value={password}
          onChangeText={setPassword}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={6}
        />

        <TextInput
          style={styles.input}
          placeholder="Confirmar senha"
          value={confirmation}
          onChangeText={setConfirmation}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={6}
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
    alignItems: "center",
    paddingHorizontal: 24,
    backgroundColor: "#fff",
  },
  formCard: {
    width: "100%",
    maxWidth: 400,
  },
  title: { fontSize: 28, fontWeight: "bold", textAlign: "center", marginBottom: 8 },
  subtitle: { fontSize: 14, color: "#666", textAlign: "center", marginBottom: 24 },
  errorText: {
    color: "#dc2626",
    backgroundColor: "#fee2e2",
    padding: 10,
    borderRadius: 6,
    marginBottom: 16,
    textAlign: "center",
    fontSize: 14,
  },
  input: {
    height: 48,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  disabled: { backgroundColor: "#9ca3af" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  link: { color: "#2563eb", fontSize: 15, textAlign: "center", marginTop: 20 },
});