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
    width: "100%",      // Ocupa 100% da largura em telas pequenas (mobile)
    maxWidth: 400,     // Trava a largura máxima em 400px no computador
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
  },
  button: { backgroundColor: "#2563eb", borderRadius: 8, paddingVertical: 14, alignItems: "center" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  subtitle: { color: "#666", fontSize: 15, textAlign: "center", lineHeight: 22, marginBottom: 24 },
});
