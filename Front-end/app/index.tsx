import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
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
      // 1. Recebe o objeto do usuário logado do MySQL
      const usuario = await login({ email, password });

      // 2. Redireciona conforme o tipo de usuário cadastrado no banco
      if (usuario.tipo_usuario === "CLIENTE") {
        router.replace("/home");
      } else {
        router.replace("/mecanico");
      }
    } catch (error) {
      ShowAlert(
        "Não foi possível entrar",
        error instanceof ApiError ? error.message : "Tente novamente."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formCard}>
            {/* Header da Marca */}
            <View style={styles.header}>
              <Text style={styles.brandTitle}>Örtöö</Text>
              <Text style={styles.subtitle}>
                Assistência veicular rápida e em tempo real.
              </Text>
            </View>

            {/* Formulário */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>E-mail</Text>
              <TextInput
                style={styles.input}
                placeholder="seu.email@exemplo.com"
                placeholderTextColor="#6b7280"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Senha</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#6b7280"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            

            {/* Botão de Entrar */}
            <TouchableOpacity
              style={[
                styles.button,
                (!isFormValid || submitting) && styles.buttonDisabled,
              ]}
              onPress={handleLogin}
              disabled={!isFormValid || submitting}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.buttonText}>Entrar</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.esqueciSenhaBtn}
              onPress={() => router.push("/recuperar-senha")}
            >
              <Text style={styles.esqueciSenhaTexto}>Esqueceu a senha?</Text>
            </TouchableOpacity>

            {/* Rodapé / Link Criar Conta */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Não tem uma conta?</Text>
              <TouchableOpacity onPress={() => router.push("/cadastro")}>
                <Text style={styles.linkTexto}> Criar conta</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  formCard: {
    width: "100%",
    maxWidth: 400,
  },
  header: {
    alignItems: "center",
    marginBottom: 36,
  },
  brandTitle: {
    fontSize: 40,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
    marginTop: 8,
  },
  inputContainer: {
    marginBottom: 16,
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
  esqueciSenhaBtn: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  esqueciSenhaTexto: {
    color: "#38bdf8",
    fontSize: 13,
    fontWeight: "500",
  },
  button: {
    height: 52,
    backgroundColor: "#2563eb",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: "#1f2937",
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 28,
  },
  footerText: {
    color: "#9ca3af",
    fontSize: 14,
  },
  linkTexto: {
    color: "#38bdf8",
    fontSize: 14,
    fontWeight: "700",
  },
});