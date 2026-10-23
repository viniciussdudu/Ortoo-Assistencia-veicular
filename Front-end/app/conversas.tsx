import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ApiError, Conversa, listarConversas } from "../src/services/api";

export default function Conversas() {
  const router = useRouter();
  const [items, setItems] = useState<Conversa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const retry = useRef<() => void>(() => {});
  useFocusEffect(useCallback(() => {
    let active = true;
    let busy = false;
    async function load() {
      if (busy) return;
      busy = true;
      try {
        const result = await listarConversas();
        if (active) { setItems(result); setError(""); }
      } catch (err) {
        if (active) setError(err instanceof ApiError ? err.message : "Não foi possível carregar as conversas.");
      } finally { busy = false; if (active) setLoading(false); }
    }
    setLoading(true);
    retry.current = () => { setLoading(true); void load(); };
    void load();
    const timer = setInterval(load, 3000);
    return () => { active = false; retry.current = () => {}; clearInterval(timer); };
  }, []));

  return <SafeAreaView style={styles.screen}>
    <Stack.Screen options={{ headerShown: false }} />
    <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace("/home")} style={styles.back}><Text style={styles.text}>‹ Voltar</Text></TouchableOpacity>
    <Text style={styles.title}>Conversas</Text>
    <Text style={styles.subtitle}>Fale com quem participa do seu atendimento.</Text>
    {loading ? <ActivityIndicator color="#38bdf8" /> : <ScrollView contentContainerStyle={styles.list}>
      {!!error && <View><Text style={styles.error}>{error}</Text><TouchableOpacity onPress={() => retry.current()}><Text style={styles.link}>Tentar novamente</Text></TouchableOpacity></View>}
      {!error && !items.length && <Text style={styles.subtitle}>Nenhuma conversa ainda. No mapa, escolha um prestador e toque em “Conversar com prestador”.</Text>}
      {items.map(item => <TouchableOpacity key={item.id} style={styles.card} accessibilityRole="button" onPress={() => router.push({ pathname: "/chat", params: { id: item.id } })}>
        <MaterialCommunityIcons name="chat-outline" size={24} color="#38bdf8" />
        <View style={styles.info}><Text style={styles.name}>{item.meu_id === item.cliente_id ? item.prestador_nome : item.cliente_nome}</Text><Text style={styles.subtitle}>Atendimento #{item.id}{["CANCELADO", "CONCLUIDO"].includes(item.status) ? " · Encerrado" : ""}</Text></View>
        <MaterialCommunityIcons name="chevron-right" size={22} color="#9ca3af" />
      </TouchableOpacity>)}
    </ScrollView>}
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#000", padding: 20 }, back: { paddingVertical: 12 }, text: { color: "#fff", fontSize: 16 }, title: { color: "#fff", fontSize: 28, fontWeight: "800", marginTop: 16 }, subtitle: { color: "#9ca3af", marginTop: 6, lineHeight: 20 }, list: { paddingTop: 24, gap: 12, paddingBottom: 24 }, card: { flexDirection: "row", alignItems: "center", gap: 12, padding: 18, backgroundColor: "#111827", borderRadius: 14 }, info: { flex: 1 }, name: { color: "#fff", fontWeight: "700", fontSize: 16 }, error: { color: "#f87171" }, link: { color: "#38bdf8", marginTop: 12 },
});
