import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ApiError, cancelarSolicitacao, getUserProfile, listarMinhasSolicitacoes, Solicitacao } from "../src/services/api";
import { Cores, useEstilos, useTema } from "../src/tema";

const STATUS: Record<Solicitacao["status"], string> = {
  PENDENTE: "Pendente", ACEITO: "Aceito", A_CAMINHO: "A caminho", EM_ANDAMENTO: "Em andamento", CONCLUIDO: "Concluído", CANCELADO: "Cancelado",
};

function formatarData(data: string) {
  const valor = new Date(data);
  return Number.isNaN(valor.getTime()) ? data : new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(valor);
}

export default function Atendimentos() {
  const { cores: CORES } = useTema();
  const styles = useEstilos(criarEstilos);
  const router = useRouter();
  const [atendimentos, setAtendimentos] = useState<Solicitacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async (pullToRefresh = false) => {
    pullToRefresh ? setAtualizando(true) : setCarregando(true);
    try {
      setErro(null);
      const usuario = await getUserProfile();
      setAtendimentos(await listarMinhasSolicitacoes(usuario.id));
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : "Não foi possível carregar os atendimentos.");
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  function confirmarCancelamento(item: Solicitacao) {
    Alert.alert("Cancelar atendimento?", `O atendimento #${item.id} será cancelado.`, [
      { text: "Voltar", style: "cancel" },
      { text: "Cancelar", style: "destructive", onPress: async () => { try { await cancelarSolicitacao(item.id); await carregar(true); } catch (error) { Alert.alert("Erro", error instanceof ApiError ? error.message : "Tente novamente."); } } },
    ]);
  }

  return (
    <SafeAreaView style={styles.tela}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.scroll} refreshControl={<RefreshControl refreshing={atualizando} onRefresh={() => carregar(true)} tintColor={CORES.destaque} />}>
        <TouchableOpacity style={styles.voltar} onPress={() => router.back()}><MaterialCommunityIcons name="arrow-left" size={20} color={CORES.texto} /><Text style={styles.voltarTexto}>Voltar</Text></TouchableOpacity>
        <Text style={styles.titulo}>Meus atendimentos</Text>
        <Text style={styles.subtitulo}>Acompanhe todas as suas solicitações em um só lugar.</Text>
        {carregando ? <ActivityIndicator size="large" color={CORES.destaque} style={styles.carregando} /> : erro ? <View style={styles.estado}><Text style={styles.erro}>{erro}</Text><TouchableOpacity style={styles.botao} onPress={() => carregar()}><Text style={styles.botaoTexto}>Tentar novamente</Text></TouchableOpacity></View> : atendimentos.length === 0 ? <View style={styles.estado}><MaterialCommunityIcons name="clipboard-text-outline" size={40} color={CORES.textoSuave} /><Text style={styles.vazio}>Nenhum atendimento encontrado.</Text></View> : atendimentos.map((item) => { const podeCancelar = item.status === "PENDENTE" || item.status === "ACEITO"; const podeConversar = Boolean(item.prestador_id) && item.status !== "CANCELADO"; return <View key={item.id} style={styles.card}><View style={styles.linha}><Text style={styles.nome}>{item.categoria_nome ?? "Assistência veicular"}</Text><Text style={styles.status}>{STATUS[item.status]}</Text></View><Text style={styles.descricao}>{item.descricao_problema || "Sem detalhes adicionais."}</Text><Text style={styles.data}>{formatarData(item.criado_em)} · #{item.id}</Text>{podeConversar && <TouchableOpacity style={styles.conversar} onPress={() => router.push({ pathname: "/chat-vendedor", params: { solicitacaoId: String(item.id), vendedor: item.prestador_nome ?? "Prestador" } })}><MaterialCommunityIcons name="message-text-outline" size={18} color={CORES.destaque} /><Text style={styles.conversarTexto}>Conversar com o prestador</Text></TouchableOpacity>}{podeCancelar && <TouchableOpacity onPress={() => confirmarCancelamento(item)}><Text style={styles.cancelar}>Cancelar atendimento</Text></TouchableOpacity>}</View>; })}
      </ScrollView>
    </SafeAreaView>
  );
}

const criarEstilos = (CORES: Cores) =>
  StyleSheet.create({
  tela: { flex: 1, backgroundColor: CORES.fundo }, scroll: { padding: 20, paddingBottom: 40 }, voltar: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 24 }, voltarTexto: { color: CORES.texto, fontWeight: "600" }, titulo: { color: CORES.texto, fontSize: 28, fontWeight: "800" }, subtitulo: { color: CORES.textoSuave, lineHeight: 20, marginTop: 6, marginBottom: 24 }, carregando: { marginTop: 40 }, card: { backgroundColor: CORES.cartao, borderColor: CORES.borda, borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 12 }, linha: { flexDirection: "row", justifyContent: "space-between", gap: 12 }, nome: { color: CORES.texto, fontSize: 16, fontWeight: "700", flex: 1 }, status: { color: CORES.destaque, fontSize: 12, fontWeight: "700" }, descricao: { color: CORES.textoSuave, marginTop: 12, lineHeight: 20 }, data: { color: CORES.textoSuave, fontSize: 12, marginTop: 12 }, conversar: { flexDirection: "row", gap: 8, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: CORES.primaria, borderRadius: 9, paddingVertical: 10, marginTop: 16 }, conversarTexto: { color: CORES.destaque, fontWeight: "700" }, cancelar: { color: CORES.erro, fontWeight: "700", marginTop: 16 }, estado: { alignItems: "center", backgroundColor: CORES.cartao, borderColor: CORES.borda, borderWidth: 1, borderRadius: 16, padding: 28 }, vazio: { color: CORES.textoSuave, marginTop: 12 }, erro: { color: CORES.erro, textAlign: "center" }, botao: { backgroundColor: CORES.primaria, borderRadius: 10, marginTop: 18, paddingHorizontal: 18, paddingVertical: 10 }, botaoTexto: { color: CORES.sobrePrimaria, fontWeight: "700" },
});
