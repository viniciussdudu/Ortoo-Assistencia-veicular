import { Stack, useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Index() {
  const router = useRouter();
  return (
    <View style={styles.container}>
    <Stack.Screen options={{ title: "Örtöö" }} />
    <View style={styles.formCard}>
    <Text style={styles.title}>Login</Text>
    <Text style={styles.subtitle}>O acesso por login será disponibilizado em breve.</Text>

    <TouchableOpacity style={styles.button} onPress={() => router.push("/cadastro")}>
    <Text style={styles.buttonText}>Criar conta</Text>
    </TouchableOpacity>

    <TouchableOpacity
    style={styles.secondaryButton}
    onPress={() => router.push("/recuperar-senha")}
    >
    <Text style={styles.secondaryButtonText}>Esqueci minha senha</Text>
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
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  secondaryButton: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#2563eb",
    fontSize: 15,
    fontWeight: "500",
  },
  subtitle: { color: "#666", fontSize: 15, textAlign: "center", lineHeight: 22, marginBottom: 24 },
});
