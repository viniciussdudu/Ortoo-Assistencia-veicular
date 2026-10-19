import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ApiError, enviarMensagemChat, getUserProfile, listarMensagensChat, MensagemChat } from "../src/services/api";

const CORES = {
  fundo: "#000000",
  cartao: "#111827",
  borda: "#1f2937",
  primaria: "#2563eb",
  destaque: "#38bdf8",
  texto: "#ffffff",
  textoSuave: "#9ca3af",
};

function formatarHorario(data: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(data));
}

export default function ChatVendedor() {
  const router = useRouter();
  const { vendedor, solicitacaoId: solicitacaoIdParam } = useLocalSearchParams<{ vendedor?: string; solicitacaoId?: string }>();
  const listaRef = useRef<ScrollView>(null);
  const solicitacaoId = Number(solicitacaoIdParam);
  const [nomePrestador, setNomePrestador] = useState(vendedor?.trim() || "Prestador Örtöö");
  const nomeVendedor = nomePrestador;
  const [texto, setTexto] = useState("");
  const [mensagens, setMensagens] = useState<MensagemChat[]>([]);
  const [usuarioId, setUsuarioId] = useState<number | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isInteger(solicitacaoId) || solicitacaoId <= 0) {
      setErro("Atendimento inválido para iniciar a conversa.");
      setCarregando(false);
      return;
    }
    let ativo = true;
    const carregar = async () => {
      try {
        const [perfil, conversa] = await Promise.all([getUserProfile(), listarMensagensChat(solicitacaoId)]);
        if (!ativo) return;
        setUsuarioId(perfil.id);
        setNomePrestador(conversa.prestador.nome || nomeVendedor);
        setMensagens(conversa.mensagens);
        setErro(null);
      } catch (error) {
        if (ativo) setErro(error instanceof ApiError ? error.message : "Não foi possível carregar a conversa.");
      } finally {
        if (ativo) setCarregando(false);
      }
    };
    carregar();
    const intervalo = setInterval(carregar, 5000);
    return () => { ativo = false; clearInterval(intervalo); };
  }, [solicitacaoId]);

  const iniciais = useMemo(
    () =>
      nomeVendedor
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((parte) => parte[0]?.toUpperCase())
        .join(""),
    [nomeVendedor]
  );

  async function enviarMensagem() {
    const conteudo = texto.trim();
    if (!conteudo || !Number.isInteger(solicitacaoId)) return;
    try {
      const mensagem = await enviarMensagemChat(solicitacaoId, conteudo);
      setMensagens((anteriores) => [...anteriores, mensagem]);
      setTexto("");
    } catch (error) {
      Alert.alert("Não foi possível enviar", error instanceof ApiError ? error.message : "Tente novamente.");
    }
  }

  return (
    <SafeAreaView style={styles.tela} edges={["top", "left", "right"]}>
      <Stack.Screen options={{ headerShown: false }} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.cabecalho}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.botaoVoltar}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={CORES.texto} />
          </TouchableOpacity>

          <View style={styles.identidadeVendedor}>
            <View style={styles.avatar}>
              <Text style={styles.iniciais}>{iniciais || "O"}</Text>
              <View style={styles.indicadorOnline} />
            </View>
            <View>
              <Text style={styles.nomeVendedor} numberOfLines={1}>
                {nomeVendedor}
              </Text>
              <Text style={styles.statusVendedor}>Disponível para ajudar</Text>
            </View>
          </View>
        </View>

        <ScrollView
          ref={listaRef}
          style={styles.lista}
          contentContainerStyle={styles.conteudoLista}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => listaRef.current?.scrollToEnd({ animated: true })}
        >
          <View style={styles.aviso}>
            <MaterialCommunityIcons name="lock-outline" size={14} color={CORES.destaque} />
            <Text style={styles.textoAviso}>Conversa com o vendedor</Text>
          </View>

          {carregando ? <ActivityIndicator color={CORES.destaque} /> : erro ? <Text style={styles.erro}>{erro}</Text> : mensagens.length === 0 ? <Text style={styles.vazio}>Envie a primeira mensagem para o prestador.</Text> : mensagens.map((mensagem) => (
            <View
              key={mensagem.id}
              style={[
                styles.linhaMensagem,
                mensagem.remetente_id === usuarioId && styles.linhaMensagemEnviada,
              ]}
            >
              <View
                style={[
                  styles.balao,
                  mensagem.remetente_id === usuarioId
                    ? styles.balaoEnviado
                    : styles.balaoRecebido,
                ]}
              >
                <Text style={styles.textoMensagem}>{mensagem.conteudo}</Text>
                <Text style={styles.horarioMensagem}>{formatarHorario(mensagem.criado_em)}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.compositor}>
          <TextInput
            value={texto}
            onChangeText={setTexto}
            onSubmitEditing={enviarMensagem}
            placeholder="Escreva uma mensagem"
            placeholderTextColor={CORES.textoSuave}
            style={styles.campoMensagem}
            multiline
            maxLength={1000}
            accessibilityLabel="Mensagem para o vendedor"
          />
          <TouchableOpacity
            style={[styles.botaoEnviar, !texto.trim() && styles.botaoEnviarInativo]}
            onPress={enviarMensagem}
            disabled={!texto.trim()}
            accessibilityRole="button"
            accessibilityLabel="Enviar mensagem"
          >
            <MaterialCommunityIcons name="send" size={20} color={CORES.texto} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: CORES.fundo },
  flex: { flex: 1 },
  cabecalho: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: CORES.borda,
    backgroundColor: CORES.fundo,
  },
  botaoVoltar: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  identidadeVendedor: { flexDirection: "row", alignItems: "center", flex: 1 },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: CORES.primaria,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  iniciais: { color: CORES.texto, fontSize: 14, fontWeight: "800" },
  indicadorOnline: {
    position: "absolute",
    right: 0,
    bottom: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#22c55e",
    borderWidth: 2,
    borderColor: CORES.fundo,
  },
  nomeVendedor: { color: CORES.texto, fontSize: 16, fontWeight: "700", maxWidth: 240 },
  statusVendedor: { color: CORES.destaque, fontSize: 12, marginTop: 2 },
  lista: { flex: 1 },
  conteudoLista: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 12 },
  aviso: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: CORES.cartao,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 20,
  },
  textoAviso: { color: CORES.textoSuave, fontSize: 12 },
  erro: { color: "#f87171", textAlign: "center", marginTop: 24 },
  vazio: { color: CORES.textoSuave, textAlign: "center", marginTop: 24 },
  linhaMensagem: { flexDirection: "row", marginBottom: 12 },
  linhaMensagemEnviada: { justifyContent: "flex-end" },
  balao: { maxWidth: "82%", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  balaoRecebido: {
    backgroundColor: CORES.cartao,
    borderWidth: 1,
    borderColor: CORES.borda,
    borderBottomLeftRadius: 4,
  },
  balaoEnviado: { backgroundColor: CORES.primaria, borderBottomRightRadius: 4 },
  textoMensagem: { color: CORES.texto, fontSize: 15, lineHeight: 21 },
  horarioMensagem: { color: "#cbd5e1", fontSize: 10, alignSelf: "flex-end", marginTop: 5 },
  compositor: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: CORES.borda,
    backgroundColor: CORES.fundo,
  },
  campoMensagem: {
    flex: 1,
    maxHeight: 112,
    minHeight: 46,
    color: CORES.texto,
    backgroundColor: CORES.cartao,
    borderWidth: 1,
    borderColor: CORES.borda,
    borderRadius: 23,
    paddingHorizontal: 16,
    paddingVertical: 11,
    fontSize: 15,
    marginRight: 10,
  },
  botaoEnviar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: CORES.primaria,
  },
  botaoEnviarInativo: { opacity: 0.45 },
});
