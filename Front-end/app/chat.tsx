import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ApiError, Chat, enviarMensagem, obterChat } from "../src/services/api";

export default function TelaChat() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [chat, setChat] = useState<Chat | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const retry = useRef<() => void>(() => {});
  const scroll = useRef<ScrollView>(null);
  const sendLock = useRef(false);
  const active = useRef(false);

  useFocusEffect(useCallback(() => {
    active.current = true;
    let current = true;
    let busy = false;
    async function load() {
      if (busy) return;
      busy = true;
      try {
        if (!Number.isSafeInteger(Number(id)) || Number(id) <= 0) throw new Error("Atendimento inválido.");
        const result = await obterChat(Number(id));
        if (current) { setChat(result); setError(""); }
      } catch (err) {
        if (current) setError(err instanceof Error ? err.message : "Não foi possível carregar o chat.");
      } finally { busy = false; if (current) setLoading(false); }
    }
    setLoading(true);
    setChat(null);
    setSending(sendLock.current);
    retry.current = () => { void load(); };
    void load();
    const timer = setInterval(load, 3000);
    return () => { current = false; active.current = false; retry.current = () => {}; clearInterval(timer); };
  }, [id]));

  async function send() {
    const message = text.trim();
    if (!message || sendLock.current) return;
    sendLock.current = true;
    setSending(true);
    try {
      await enviarMensagem(Number(id), message);
      if (active.current) setText("");
      const result = await obterChat(Number(id));
      if (active.current) { setChat(result); setError(""); }
    } catch (err) {
      if (active.current) setError(err instanceof ApiError ? err.message : "Não foi possível enviar. Tente novamente.");
    } finally { sendLock.current = false; if (active.current) setSending(false); }
  }

  const closed = !!chat && ["CANCELADO", "CONCLUIDO"].includes(chat.status);
  const name = chat ? chat.meu_id === chat.cliente_id ? chat.prestador_nome : chat.cliente_nome : "Conversa";
  return <SafeAreaView style={styles.screen}>
    <Stack.Screen options={{ headerShown: false }} />
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace("/conversas")}><Text style={styles.back}>‹ Voltar</Text></TouchableOpacity>
        <Text style={styles.title}>{name}</Text><Text style={styles.muted}>Atendimento #{id}</Text>
      </View>
      {!!error && <View style={styles.errorBox}><Text accessibilityRole="alert" style={styles.error}>{error}</Text><TouchableOpacity onPress={() => retry.current()}><Text style={styles.back}>Atualizar conversa</Text></TouchableOpacity></View>}
      {loading ? <ActivityIndicator style={styles.messages} color="#38bdf8" /> : <ScrollView ref={scroll} style={styles.messages} contentContainerStyle={styles.messageList} onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}>
        {chat && !chat.mensagens.length && <Text style={styles.muted}>Conversa iniciada. Envie a primeira mensagem.</Text>}
        {chat?.mensagens.map(message => <View key={message.id} style={[styles.bubble, message.remetente_id === chat.meu_id ? styles.mine : styles.theirs]}>
          <Text style={styles.message}>{message.conteudo}</Text><Text style={styles.time}>{new Date(message.criado_em).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</Text>
        </View>)}
      </ScrollView>}
      {closed ? <Text style={styles.closed}>Atendimento encerrado. Histórico disponível para leitura.</Text> : <View style={styles.composer}>
        <TextInput accessibilityLabel="Mensagem" placeholder="Escreva sua mensagem…" placeholderTextColor="#9ca3af" value={text} onChangeText={setText} maxLength={2000} multiline editable={!!chat && !sending} style={styles.input} />
        <TouchableOpacity accessibilityRole="button" disabled={!chat || !text.trim() || sending} onPress={send} style={[styles.send, (!chat || !text.trim() || sending) && styles.disabled]}>{sending ? <ActivityIndicator color="#fff" /> : <Text style={styles.message}>Enviar</Text>}</TouchableOpacity>
      </View>}
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#000" }, header: { padding: 20, borderBottomWidth: 1, borderColor: "#1f2937", gap: 8 }, back: { color: "#38bdf8", fontSize: 15 }, title: { color: "#fff", fontSize: 22, fontWeight: "700" }, muted: { color: "#9ca3af", lineHeight: 20 }, messages: { flex: 1 }, messageList: { padding: 20, gap: 12 }, bubble: { maxWidth: "85%", borderRadius: 16, padding: 14 }, mine: { backgroundColor: "#2563eb", alignSelf: "flex-end" }, theirs: { backgroundColor: "#1f2937", alignSelf: "flex-start" }, message: { color: "#fff", fontSize: 16, lineHeight: 22 }, time: { color: "#d1d5db", fontSize: 11, alignSelf: "flex-end", marginTop: 6 }, composer: { flexDirection: "row", alignItems: "flex-end", gap: 10, padding: 16, borderTopWidth: 1, borderColor: "#1f2937" }, input: { flex: 1, maxHeight: 140, minHeight: 48, backgroundColor: "#111827", color: "#fff", borderRadius: 12, padding: 12, fontSize: 16 }, send: { backgroundColor: "#2563eb", padding: 14, borderRadius: 12, minHeight: 48 }, disabled: { opacity: 0.4 }, closed: { color: "#9ca3af", padding: 20 }, errorBox: { padding: 16, gap: 8 }, error: { color: "#f87171" },
});
