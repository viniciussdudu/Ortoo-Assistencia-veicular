import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import MapaTempoReal from "../components/(componentes-mapas)/MapaTempoReal";
import {
  atualizarLocalizacaoPrestador,
  atualizarStatusSolicitacao,
  buscarSolicitacaoPorId,
  Solicitacao,
  SolicitacaoStatus,
} from "../src/services/api";

const ETAPAS: Array<{ key: SolicitacaoStatus; label: string; icone: string }> = [
  { key: "PENDENTE", label: "Aguardando confirmação", icone: "clock-outline" },
  { key: "ACEITO", label: "Aceito pelo mecânico", icone: "check-circle-outline" },
  { key: "A_CAMINHO", label: "Mecânico a caminho", icone: "car-tow-truck" },
  { key: "EM_ANDAMENTO", label: "Em atendimento", icone: "wrench-outline" },
  { key: "CONCLUIDO", label: "Concluído", icone: "check-all" },
];

export default function StatusAtendimento() {
  const router = useRouter();
  
  // Captura tanto solicitacaoId quanto id para evitar quebras
  const { solicitacaoId, id, modo, vendedor } = useLocalSearchParams<{
    solicitacaoId?: string;
    id?: string;
    modo?: string;
    vendedor?: string;
  }>();

  const idSolicitacao = solicitacaoId || id;
  const isMecanico = modo === "mecanico";

  const [solicitacao, setSolicitacao] = useState<Solicitacao | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);

  // Polling a cada 3 segundos para atualizar status e localização do mecânico
  useEffect(() => {
    if (!idSolicitacao) {
      console.warn("⚠️ Nenhum ID de solicitação recebido.");
      setCarregando(false);
      return;
    }

    carregarDados();
    const interval = setInterval(carregarDados, 3000);
    return () => clearInterval(interval);
  }, [idSolicitacao]);

  // Enquanto o mecânico acompanha o chamado, envia a posição atual ao servidor.
  useEffect(() => {
    if (
      !isMecanico ||
      !solicitacao ||
      !["ACEITO", "A_CAMINHO", "EM_ANDAMENTO"].includes(solicitacao.status)
    ) return;

    let ativo = true;
    let inscricao: Location.LocationSubscription | null = null;

    async function iniciarRastreamento() {
      try {
        const permissao = await Location.requestForegroundPermissionsAsync();
        if (permissao.status !== "granted") {
          Alert.alert(
            "Localização necessária",
            "Permita o acesso à localização para compartilhar sua posição com o cliente."
          );
          return;
        }

        const posicaoInicial = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        if (!ativo) return;

        await atualizarLocalizacaoPrestador(
          posicaoInicial.coords.latitude,
          posicaoInicial.coords.longitude,
        ).catch((error) => console.warn("Falha ao enviar localização inicial:", error));

        const novaInscricao = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000,
            distanceInterval: 10,
          },
          ({ coords }) => {
            void atualizarLocalizacaoPrestador(coords.latitude, coords.longitude)
              .catch((error) => console.warn("Falha ao enviar localização:", error));
          },
        );
        if (!ativo) {
          novaInscricao.remove();
          return;
        }
        inscricao = novaInscricao;
      } catch (error) {
        console.warn("Não foi possível iniciar o rastreamento do mecânico:", error);
      }
    }

    void iniciarRastreamento();
    return () => {
      ativo = false;
      inscricao?.remove();
    };
  }, [isMecanico, solicitacao?.status]);

  async function carregarDados() {
    if (!idSolicitacao) return;

    try {
      const data = await buscarSolicitacaoPorId(Number(idSolicitacao));
      setSolicitacao(data);
    } catch (error) {
      console.error("Erro ao carregar status:", error);
    } finally {
      setCarregando(false);
    }
  }

  // Coordenadas formatadas para o Mapa
  const clienteLocation = useMemo(() => {
    if (!solicitacao?.latitude_origem || !solicitacao?.longitude_origem) return null;
    return {
      latitude: Number(solicitacao.latitude_origem),
      longitude: Number(solicitacao.longitude_origem),
    };
  }, [solicitacao?.latitude_origem, solicitacao?.longitude_origem]);

  const mecanicoLocation = useMemo(() => {
  if (!solicitacao) return null;

  // Busca os campos de latitude e longitude retornados pela API
  const lat = Number(
    (solicitacao as any).prestador_latitude ??
    (solicitacao as any).latitude_atual ??
    (solicitacao as any).latitude
  );
  const lng = Number(
    (solicitacao as any).prestador_longitude ??
    (solicitacao as any).longitude_atual ??
    (solicitacao as any).longitude
  );

  // Se for nulo, undefined ou zero, não renderiza pino inválido
  if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return null;

  return {
    latitude: lat,
    longitude: lng,
    heading: 0,
  };
}, [solicitacao]);

  async function alterarStatus(novoStatus: SolicitacaoStatus) {
    if (!solicitacao) return;
    setAtualizando(true);
    try {
      await atualizarStatusSolicitacao(solicitacao.id, novoStatus);
      await carregarDados();
      if (novoStatus === "CONCLUIDO") {
        Alert.alert("Finalizado!", "Atendimento concluído com sucesso.", [
          {
            text: "OK",
            onPress: () => router.replace((isMecanico ? "/mecanico" : "/home") as any),
          },
        ]);
      }
    } catch (error) {
      Alert.alert("Erro", "Não foi possível atualizar o status.");
    } finally {
      setAtualizando(false);
    }
  }

  // Função para abrir a tela de Chat
  const handleAbrirChat = () => {
    if (!idSolicitacao) return;
    router.push({
      pathname: "/chat-vendedor",
      params: {
        solicitacaoId: String(idSolicitacao),
        vendedor: vendedor || (solicitacao as any)?.nome_prestador || "Prestador",
      },
    });
  };

  if (carregando || !solicitacao) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color="#38bdf8" />
        <Text style={styles.carregandoTexto}>Buscando dados do atendimento...</Text>
      </View>
    );
  }

  const indexEtapaAtual = ETAPAS.findIndex((e) => e.key === solicitacao.status);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* CABEÇALHO */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.botaoVoltar} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={20} color="#fff" />
          <Text style={styles.voltarTexto}>Voltar</Text>
        </TouchableOpacity>

        {/* BOTÃO FLUTUANTE DO CHAT */}
        <TouchableOpacity style={styles.botaoChatHeader} onPress={handleAbrirChat}>
          <MaterialCommunityIcons name="message-text-outline" size={20} color="#38bdf8" />
          <Text style={styles.chatHeaderTexto}>Chat</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.titulo}>Acompanhamento</Text>
        <Text style={styles.subtitulo}>Solicitação #{solicitacao.id}</Text>

        {/* MAPA COM LOCALIZAÇÃO EM TEMPO REAL */}
        <View style={styles.mapaContainer}>
          {clienteLocation ? (
            <MapaTempoReal
              clienteLocation={clienteLocation}
              mecanicoLocation={mecanicoLocation}
            />
          ) : (
            <View style={styles.mapaPlaceholder}>
              <ActivityIndicator size="small" color="#38bdf8" />
              <Text style={styles.mapaTexto}>Carregando mapa...</Text>
            </View>
          )}
        </View>

        {/* BOTÃO PRINCIPAL DE CHAT */}
        <TouchableOpacity style={styles.botaoChatPrincipal} onPress={handleAbrirChat}>
          <MaterialCommunityIcons name="chat-processing-outline" size={22} color="#fff" />
          <Text style={styles.botaoChatTexto}>Falar com o Prestador</Text>
        </TouchableOpacity>

        {/* TIMELINE DE STATUS */}
        <View style={styles.timeline}>
          {ETAPAS.map((etapa, idx) => {
            const concluida = idx <= indexEtapaAtual;
            const atual = idx === indexEtapaAtual;

            return (
              <View key={etapa.key} style={styles.etapaItem}>
                <View
                  style={[
                    styles.iconeCirculo,
                    concluida && styles.iconeConcluido,
                    atual && styles.iconeAtual,
                  ]}
                >
                  <MaterialCommunityIcons
                    name={etapa.icone as any}
                    size={20}
                    color={concluida ? "#fff" : "#6b7280"}
                  />
                </View>
                <Text
                  style={[
                    styles.etapaTexto,
                    concluida && styles.etapaTextoConcluida,
                    atual && styles.etapaTextoAtual,
                  ]}
                >
                  {etapa.label}
                </Text>
              </View>
            );
          })}
        </View>

        {/* CONTROLES EXCLUSIVOS DO MECÂNICO */}
        {isMecanico && solicitacao.status !== "CONCLUIDO" && (
          <View style={styles.acoesContainer}>
            <Text style={styles.acoesTitulo}>Atualizar Etapa do Atendimento:</Text>

            {solicitacao.status === "ACEITO" && (
              <TouchableOpacity
                style={styles.botaoAcao}
                onPress={() => alterarStatus("A_CAMINHO")}
                disabled={atualizando}
              >
                <Text style={styles.botaoAcaoTexto}>Iniciar Deslocamento (A caminho)</Text>
              </TouchableOpacity>
            )}

            {solicitacao.status === "A_CAMINHO" && (
              <TouchableOpacity
                style={styles.botaoAcao}
                onPress={() => alterarStatus("EM_ANDAMENTO")}
                disabled={atualizando}
              >
                <Text style={styles.botaoAcaoTexto}>Cheguei no Local (Iniciar Reparo)</Text>
              </TouchableOpacity>
            )}

            {solicitacao.status === "EM_ANDAMENTO" && (
              <TouchableOpacity
                style={[styles.botaoAcao, { backgroundColor: "#16a34a" }]}
                onPress={() => alterarStatus("CONCLUIDO")}
                disabled={atualizando}
              >
                <Text style={styles.botaoAcaoTexto}>Concluir Atendimento</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  center: { flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" },
  carregandoTexto: { color: "#9ca3af", marginTop: 12, fontSize: 14 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  botaoVoltar: { flexDirection: "row", alignItems: "center", gap: 6 },
  voltarTexto: { color: "#fff", fontSize: 15, fontWeight: "600" },
  botaoChatHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#1f2937",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#374151",
  },
  chatHeaderTexto: { color: "#38bdf8", fontWeight: "600", fontSize: 13 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 30 },
  titulo: { fontSize: 26, fontWeight: "800", color: "#fff" },
  subtitulo: { fontSize: 14, color: "#9ca3af", marginBottom: 16 },
  mapaContainer: {
    height: 220,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  mapaPlaceholder: {
    flex: 1,
    backgroundColor: "#111827",
    justifyContent: "center",
    alignItems: "center",
  },
  mapaTexto: { color: "#9ca3af", marginTop: 8, fontSize: 13 },
  botaoChatPrincipal: {
    flexDirection: "row",
    backgroundColor: "#2563eb",
    borderRadius: 14,
    paddingVertical: 14,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  botaoChatTexto: { color: "#fff", fontWeight: "700", fontSize: 15 },
  timeline: { backgroundColor: "#111827", borderRadius: 16, padding: 20, gap: 16 },
  etapaItem: { flexDirection: "row", alignItems: "center", gap: 14 },
  iconeCirculo: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#1f2937", justifyContent: "center", alignItems: "center" },
  iconeConcluido: { backgroundColor: "#2563eb" },
  iconeAtual: { backgroundColor: "#38bdf8" },
  etapaTexto: { fontSize: 14, color: "#6b7280", fontWeight: "600" },
  etapaTextoConcluida: { color: "#d1d5db" },
  etapaTextoAtual: { color: "#38bdf8", fontWeight: "800" },
  acoesContainer: { marginTop: 24, backgroundColor: "#111827", padding: 16, borderRadius: 16 },
  acoesTitulo: { color: "#9ca3af", fontSize: 13, fontWeight: "700", marginBottom: 12 },
  botaoAcao: { backgroundColor: "#2563eb", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  botaoAcaoTexto: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
