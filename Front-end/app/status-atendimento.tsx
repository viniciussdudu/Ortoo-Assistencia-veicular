import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  atualizarStatusSolicitacao,
  buscarSolicitacaoPorId,
  Solicitacao,
  SolicitacaoStatus,
} from "../src/services/api";

const ETAPAS: { key: SolicitacaoStatus; label: string; icone: string }[] = [
  { key: "PENDENTE", label: "Aguardando confirmação", icone: "clock-outline" },
  { key: "ACEITO", label: "Aceito pelo mecânico", icone: "check-circle-outline" },
  { key: "A_CAMINHO", label: "Mecânico a caminho", icone: "car-tow-truck" },
  { key: "EM_ANDAMENTO", label: "Em atendimento", icone: "wrench-outline" },
  { key: "CONCLUIDO", label: "Concluído", icone: "check-all" },
];

export default function StatusAtendimento() {
  const router = useRouter();
  const { id, modo } = useLocalSearchParams<{ id: string; modo?: string }>();

  const [solicitacao, setSolicitacao] = useState<Solicitacao | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);

  const isMecanico = modo === "mecanico";

  const carregarDados = useCallback(async () => {
    try {
      const data = await buscarSolicitacaoPorId(Number(id));
      setSolicitacao(data);
    } catch (error) {
      console.error("Erro ao carregar status:", error);
    } finally {
      setCarregando(false);
    }
  }, [id]);

  // Polling a cada 3 segundos para sincronizar em tempo real
  useEffect(() => {
    if (!id) return;
    carregarDados();
    const interval = setInterval(carregarDados, 3000);
    return () => clearInterval(interval);
  }, [id, carregarDados]);

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
            onPress: () =>
              router.replace((isMecanico ? "/mecanico" : "/home") as any),
          },
        ]);
      }
    } catch {
      Alert.alert("Erro", "Não foi possível atualizar o status.");
    } finally {
      setAtualizando(false);
    }
  }

  if (carregando || !solicitacao) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color="#38bdf8" />
      </View>
    );
  }

  const indexEtapaAtual = ETAPAS.findIndex((e) => e.key === solicitacao.status);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <TouchableOpacity style={styles.botaoVoltar} onPress={() => router.back()}>
        <MaterialCommunityIcons name="arrow-left" size={20} color="#fff" />
        <Text style={styles.voltarTexto}>Voltar</Text>
      </TouchableOpacity>

      <Text style={styles.titulo}>Acompanhamento do Atendimento</Text>
      <Text style={styles.subtitulo}>Solicitação #{solicitacao.id}</Text>

      {!!solicitacao.prestador_id && <TouchableOpacity style={styles.botaoAcao} onPress={() => router.push({ pathname: "/chat", params: { id: solicitacao.id } })} accessibilityRole="button"><Text style={styles.botaoAcaoTexto}>{isMecanico ? "Conversar com cliente" : "Conversar com prestador"}</Text></TouchableOpacity>}

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", paddingHorizontal: 20, paddingTop: 12 },
  center: { flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" },
  botaoVoltar: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16 },
  voltarTexto: { color: "#fff", fontSize: 15, fontWeight: "600" },
  titulo: { fontSize: 26, fontWeight: "800", color: "#fff" },
  subtitulo: { fontSize: 14, color: "#9ca3af", marginBottom: 24 },
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
