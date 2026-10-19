import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

import { colors } from "../constants/colors";
import { LOJAS_PARCEIRAS } from "../src/lojas-parceiras";

export default function Home() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Örtöö</Text>
      <Text style={styles.subtitulo}>O que você precisa hoje?</Text>

      <TouchableOpacity style={styles.card} onPress={() => router.push("/solicitar-assistencia")}>
        <Text style={styles.cardIcone}>🆘</Text>
        <Text style={styles.cardTexto}>Solicitar Assistência</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card} onPress={() => router.push("/atendimentos")}>
        <Text style={styles.cardIcone}>📋</Text>
        <Text style={styles.cardTexto}>Meus atendimentos</Text>
      </TouchableOpacity>

      <Text style={styles.secaoTitulo}>Assistências parceiras</Text>
      {LOJAS_PARCEIRAS.map((loja) => (
        <TouchableOpacity
          key={loja.nome}
          style={styles.lojaCard}
          onPress={() => router.push({ pathname: "/chat", params: { loja: loja.nome } })}
        >
          <View>
            <Text style={styles.lojaNome}>{loja.nome}</Text>
            <Text style={styles.lojaInfo}>{loja.info}</Text>
          </View>
          <Text style={styles.chatIcone}>💬</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={styles.card} onPress={() => router.push("/perfil")}>
        <Text style={styles.cardIcone}>👤</Text>
        <Text style={styles.cardTexto}>Meu Perfil</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.creamLight,
    paddingHorizontal: 24,
    paddingTop: 80,
  },
  titulo: {
    fontSize: 32,
    fontWeight: "bold",
    color: colors.navy,
    textAlign: "center",
  },
  subtitulo: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: 40,
    marginTop: 4,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
    backgroundColor: colors.white,
  },
  cardIcone: {
    fontSize: 28,
    marginRight: 16,
  },
  cardTexto: {
    fontSize: 17,
    fontWeight: "600",
  },
  secaoTitulo: {
    color: colors.navy,
    fontSize: 15,
    fontWeight: "700",
    marginTop: 8,
    marginBottom: 10,
  },
  lojaCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    backgroundColor: colors.white,
  },
  lojaNome: { color: "#1F3140", fontSize: 16, fontWeight: "700" },
  lojaInfo: { color: "#6B7280", fontSize: 13, marginTop: 4 },
  chatIcone: { fontSize: 20 },
});
