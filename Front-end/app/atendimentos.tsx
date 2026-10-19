import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { colors } from "../constants/colors";
import {
  ApiError,
  cancelarSolicitacao,
  listarMinhasSolicitacoes,
  obterUsuarioAtual,
  Solicitacao,
} from "../src/services/api";

const statusInfo: Record<Solicitacao["status"], { label: string; background: string; color: string }> = {
  PENDENTE: { label: "Pendente", background: colors.terracotaLight, color: colors.terracota },
  ACEITO: { label: "Aceito", background: "#E7EEF5", color: colors.navy },
  EM_ANDAMENTO: { label: "Em andamento", background: "#F8E7B8", color: "#7A5600" },
  CONCLUIDO: { label: "Concluído", background: colors.successBg, color: colors.success },
  CANCELADO: { label: "Cancelado", background: colors.dangerBg, color: colors.danger },
};

function formatarData(valor: string) {
  const data = new Date(valor);
  return Number.isNaN(data.getTime())
    ? valor
    : new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(data);
}

export default function Atendimentos() {
  const [atendimentos, setAtendimentos] = useState<Solicitacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [cancelandoId, setCancelandoId] = useState<number | null>(null);

  const carregar = useCallback(async (atualizacao = false) => {
    if (atualizacao) {
      setAtualizando(true);
    } else {
      setCarregando(true);
    }
    try {
      setErro(null);
      const usuario = obterUsuarioAtual();
      if (!usuario) {
        throw new ApiError("Sua sessão expirou. Entre novamente para ver seus atendimentos.");
      }
      setAtendimentos(await listarMinhasSolicitacoes(usuario.id));
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : "Não foi possível carregar os atendimentos.");
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function confirmarCancelamento(atendimento: Solicitacao) {
    Alert.alert("Cancelar atendimento?", `O atendimento #${atendimento.id} será cancelado.`, [
      { text: "Voltar", style: "cancel" },
      {
        text: "Cancelar atendimento",
        style: "destructive",
        onPress: async () => {
          setCancelandoId(atendimento.id);
          try {
            await cancelarSolicitacao(atendimento.id);
            await carregar(true);
          } catch (error) {
            Alert.alert("Não foi possível cancelar", error instanceof ApiError ? error.message : "Tente novamente.");
          } finally {
            setCancelandoId(null);
          }
        },
      },
    ]);
  }

  if (carregando) {
    return <View style={styles.centro}><ActivityIndicator size="large" color={colors.terracota} /><Text style={styles.carregando}>Buscando seus atendimentos…</Text></View>;
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={atualizando} onRefresh={() => carregar(true)} tintColor={colors.terracota} />}
    >
      <Text style={styles.titulo}>Meus atendimentos</Text>
      <Text style={styles.subtitulo}>Acompanhe cada solicitação em um só lugar.</Text>

      {erro ? (
        <View style={styles.estado}><Text style={styles.erro}>{erro}</Text><Pressable style={styles.botaoSecundario} onPress={() => carregar()}><Text style={styles.textoBotaoSecundario}>Tentar novamente</Text></Pressable></View>
      ) : atendimentos.length === 0 ? (
        <View style={styles.estado}><Text style={styles.iconeVazio}>🛟</Text><Text style={styles.tituloVazio}>Nenhum atendimento ainda</Text><Text style={styles.textoVazio}>Quando você solicitar ajuda, ela aparecerá aqui.</Text></View>
      ) : atendimentos.map((atendimento) => {
        const status = statusInfo[atendimento.status];
        const podeCancelar = atendimento.status === "PENDENTE" || atendimento.status === "ACEITO";
        return (
          <View key={atendimento.id} style={styles.card}>
            <View style={styles.cabecalho}><View><Text style={styles.categoria}>{atendimento.categoria_nome}</Text><Text style={styles.data}>{formatarData(atendimento.criado_em)}</Text></View><View style={[styles.status, { backgroundColor: status.background }]}><Text style={[styles.textoStatus, { color: status.color }]}>{status.label}</Text></View></View>
            <Text style={styles.descricao}>{atendimento.descricao_problema?.trim() || "Sem detalhes adicionais."}</Text>
            <Text style={styles.codigo}>Atendimento #{atendimento.id}</Text>
            {podeCancelar && <Pressable accessibilityRole="button" disabled={cancelandoId === atendimento.id} onPress={() => confirmarCancelamento(atendimento)} style={[styles.botaoCancelar, cancelandoId === atendimento.id && styles.desabilitado]}><Text style={styles.textoCancelar}>{cancelandoId === atendimento.id ? "Cancelando…" : "Cancelar atendimento"}</Text></Pressable>}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: colors.creamLight, padding: 24, gap: 14 },
  centro: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.creamLight, gap: 12 },
  carregando: { color: colors.navyMuted, fontSize: 15 },
  titulo: { color: colors.navy, fontSize: 28, fontWeight: "800", marginTop: 24 },
  subtitulo: { color: colors.textMuted, fontSize: 15, lineHeight: 22, marginBottom: 10 },
  card: { backgroundColor: colors.white, borderColor: colors.border, borderRadius: 16, borderWidth: 1, padding: 18, gap: 12 },
  cabecalho: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between", gap: 12 },
  categoria: { color: colors.navy, fontSize: 17, fontWeight: "700" },
  data: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  status: { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 6 },
  textoStatus: { fontSize: 12, fontWeight: "700" },
  descricao: { color: colors.navyMuted, fontSize: 15, lineHeight: 21 },
  codigo: { color: colors.textMuted, fontSize: 12 },
  botaoCancelar: { alignItems: "center", borderColor: colors.danger, borderRadius: 9, borderWidth: 1, paddingVertical: 10 },
  textoCancelar: { color: colors.danger, fontSize: 14, fontWeight: "700" },
  desabilitado: { opacity: 0.55 },
  estado: { alignItems: "center", backgroundColor: colors.white, borderColor: colors.border, borderRadius: 16, borderWidth: 1, marginTop: 24, padding: 28 },
  iconeVazio: { fontSize: 36, marginBottom: 12 },
  tituloVazio: { color: colors.navy, fontSize: 18, fontWeight: "700", marginBottom: 6 },
  textoVazio: { color: colors.textMuted, fontSize: 14, lineHeight: 20, textAlign: "center" },
  erro: { color: colors.danger, fontSize: 15, lineHeight: 21, textAlign: "center" },
  botaoSecundario: { borderColor: colors.terracota, borderRadius: 9, borderWidth: 1, marginTop: 18, paddingHorizontal: 16, paddingVertical: 10 },
  textoBotaoSecundario: { color: colors.terracota, fontWeight: "700" },
});
