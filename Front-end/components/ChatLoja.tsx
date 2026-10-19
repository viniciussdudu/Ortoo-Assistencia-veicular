import React, { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { colors } from "../constants/colors";

type Message = {
  id: string;
  text: string;
  sender: "loja" | "cliente";
  time: string;
};

type ChatLojaProps = {
  loja: string;
  testMode?: boolean;
};

const getInitialMessages = (loja: string): Message[] => [
  {
    id: "boas-vindas",
    text: `Olá! Você está falando com ${loja}. Como podemos ajudar com seu veículo?`,
    sender: "loja",
    time: "Agora",
  },
  {
    id: "orientacao",
    text: "Envie uma mensagem com o que aconteceu e retornaremos em breve.",
    sender: "loja",
    time: "Agora",
  },
];

export default function ChatLoja({ loja, testMode = false }: ChatLojaProps) {
  const [mensagem, setMensagem] = useState("");
  const [mensagens, setMensagens] = useState<Message[]>(() => getInitialMessages(loja));

  const horaAtual = useMemo(
    () =>
      new Intl.DateTimeFormat("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date()),
    []
  );

  const enviarMensagem = () => {
    const texto = mensagem.trim();
    if (!texto) return;

    setMensagens((atual) => [
      ...atual,
      { id: `${Date.now()}`, text: texto, sender: "cliente", time: horaAtual },
    ]);
    setMensagem("");
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{loja.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.headerText}>
          <Text style={styles.storeName}>{loja}</Text>
          <Text style={styles.online}>● Atendimento disponível</Text>
        </View>
      </View>

      {testMode && (
        <View style={styles.testNotice}>
          <Text style={styles.testNoticeText}>Página de teste do chat — envie uma mensagem para validar o fluxo.</Text>
        </View>
      )}

      <ScrollView
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.today}>Hoje</Text>
        {mensagens.map((item) => (
          <View
            key={item.id}
            style={[styles.messageRow, item.sender === "cliente" && styles.messageRowClient]}
          >
            <View style={[styles.bubble, item.sender === "cliente" ? styles.clientBubble : styles.storeBubble]}>
              <Text style={[styles.messageText, item.sender === "cliente" && styles.clientMessageText]}>
                {item.text}
              </Text>
              <Text style={[styles.time, item.sender === "cliente" && styles.clientTime]}>{item.time}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.composer}>
        <TextInput
          accessibilityLabel="Mensagem para a loja"
          value={mensagem}
          onChangeText={setMensagem}
          onSubmitEditing={enviarMensagem}
          placeholder="Digite sua mensagem"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          multiline
          maxLength={500}
          returnKeyType="send"
        />
        <TouchableOpacity
          accessibilityLabel="Enviar mensagem"
          style={[styles.sendButton, !mensagem.trim() && styles.sendButtonDisabled]}
          onPress={enviarMensagem}
          disabled={!mensagem.trim()}
        >
          <Text style={styles.sendButtonText}>Enviar</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.creamLight },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.terracotaLight,
  },
  avatarText: { color: colors.terracota, fontSize: 18, fontWeight: "700" },
  headerText: { marginLeft: 12, flex: 1 },
  storeName: { color: colors.navy, fontSize: 16, fontWeight: "700" },
  online: { color: colors.success, fontSize: 12, marginTop: 2 },
  testNotice: { backgroundColor: colors.terracotaLight, paddingHorizontal: 16, paddingVertical: 10 },
  testNoticeText: { color: colors.navy, fontSize: 12, textAlign: "center" },
  messages: { flex: 1 },
  messagesContent: { padding: 16, paddingBottom: 24 },
  today: { alignSelf: "center", color: colors.textMuted, fontSize: 12, marginBottom: 16 },
  messageRow: { flexDirection: "row", marginBottom: 10 },
  messageRowClient: { justifyContent: "flex-end" },
  bubble: { maxWidth: "82%", borderRadius: 14, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 6 },
  storeBubble: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 4 },
  clientBubble: { backgroundColor: colors.terracota, borderBottomRightRadius: 4 },
  messageText: { color: colors.navy, fontSize: 15, lineHeight: 21 },
  clientMessageText: { color: colors.white },
  time: { color: colors.textMuted, fontSize: 10, alignSelf: "flex-end", marginTop: 4 },
  clientTime: { color: colors.creamLight },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    padding: 12,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 110,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    color: colors.navy,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  sendButton: { backgroundColor: colors.terracota, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13 },
  sendButtonDisabled: { backgroundColor: colors.border },
  sendButtonText: { color: colors.white, fontSize: 13, fontWeight: "700" },
});
