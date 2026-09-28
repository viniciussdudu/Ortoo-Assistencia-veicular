import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
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

import { ApiError, getUserProfile, logout } from "../src/services/api";

const CORES = {
  fundo: "#000000",
  cartao: "#111827",
  borda: "#1f2937",
  primaria: "#2563eb",
  destaque: "#38bdf8",
  texto: "#ffffff",
  textoSuave: "#9ca3af",
  erro: "#ef4444",
};

export default function Perfil() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saindo, setSaindo] = useState(false);
  const [usuario, setUsuario] = useState<any>(null);
  const [veiculo, setVeiculo] = useState<any>(null);
  const [historico, setHistorico] = useState<any[]>([]);

  useEffect(() => {
    fetchPerfil();
  }, []);

  const fetchPerfil = async () => {
    try {
      setLoading(true);
      const data = await getUserProfile();

      setUsuario(data);
      setVeiculo((data as any).veiculo);
      setHistorico((data as any).historico || []);
    } catch (error) {
      Alert.alert(
        "Erro ao carregar perfil",
        error instanceof ApiError
          ? error.message
          : "Verifique sua conexão e tente novamente."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setSaindo(true);
    try {
      await logout();
      router.replace("/");
    } catch (error) {
      Alert.alert(
        "Erro ao sair",
        error instanceof ApiError ? error.message : "Tente novamente."
      );
    } finally {
      setSaindo(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const isConcluido = status === "Concluído" || status === "PAGO";
    const isCancelado = status === "Cancelado" || status === "CANCELADO";

    if (isConcluido) {
      return {
        style: styles.statusConcluido,
        textoStyle: styles.statusTextoConcluido,
      };
    }
    if (isCancelado) {
      return {
        style: styles.statusCancelado,
        textoStyle: styles.statusTextoCancelado,
      };
    }
    return {
      style: styles.statusPadrao,
      textoStyle: styles.statusTextoPadrao,
    };
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={CORES.destaque} />
      </View>
    );
  }

  if (!usuario) {
    return (
      <View style={[styles.container, styles.center]}>
        <Stack.Screen options={{ headerShown: false }} />
        <MaterialCommunityIcons
          name="account-off-outline"
          size={48}
          color={CORES.textoSuave}
        />
        <Text style={styles.textoErro}>
          Não foi possível carregar os dados do perfil.
        </Text>
        <TouchableOpacity style={styles.botaoAcao} onPress={fetchPerfil}>
          <Text style={styles.botaoAcaoTexto}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* CABEÇALHO / VOLTAR */}
        <TouchableOpacity
          style={styles.botaoVoltar}
          onPress={() => router.back()}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color="#fff" />
          <Text style={styles.voltarTexto}>Voltar</Text>
        </TouchableOpacity>

        {/* HEADER PERFIL */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarTexto}>
              {usuario.nome
                ? usuario.nome
                    .split(" ")
                    .map((parte: string) => parte[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()
                : "??"}
            </Text>
          </View>

          <Text style={styles.nome}>{usuario.nome}</Text>
          <Text style={styles.infoTexto}>{usuario.email}</Text>
          {usuario.telefone ? (
            <Text style={styles.infoTexto}>{usuario.telefone}</Text>
          ) : null}

          <TouchableOpacity style={styles.botaoAcao}>
            <MaterialCommunityIcons
              name="account-edit-outline"
              size={18}
              color={CORES.destaque}
            />
            <Text style={styles.botaoAcaoTexto}>Editar perfil</Text>
          </TouchableOpacity>
        </View>

        {/* MEU VEÍCULO */}
        {veiculo && (
          <View style={styles.secaoContainer}>
            <Text style={styles.secaoTitulo}>Meu veículo</Text>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons
                  name="car-sports"
                  size={24}
                  color={CORES.destaque}
                />
                <Text style={styles.veiculoModelo}>{veiculo.modelo}</Text>
              </View>
              <Text style={styles.veiculoInfo}>
                Placa: <Text style={styles.destaqueTexto}>{veiculo.placa}</Text>{" "}
                • Cor: {veiculo.cor}
              </Text>
            </View>
          </View>
        )}

        {/* ATALHOS DE PAGAMENTO */}
        <View style={styles.secaoContainer}>
          <Text style={styles.secaoTitulo}>Formas de Pagamento</Text>
          <TouchableOpacity
            style={styles.cardBotao}
            onPress={() => router.push("/adicionar-cartao")}
            activeOpacity={0.8}
          >
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons
                name="credit-card-plus-outline"
                size={22}
                color={CORES.destaque}
              />
              <Text style={styles.cardBotaoTexto}>Adicionar novo cartão</Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={22}
              color={CORES.textoSuave}
            />
          </TouchableOpacity>
        </View>

        {/* HISTÓRICO DE ATENDIMENTOS */}
        <View style={styles.secaoContainer}>
          <Text style={styles.secaoTitulo}>Histórico de atendimentos</Text>
          {historico.length > 0 ? (
            historico.map((item) => {
              const badge = getStatusBadge(item.status);
              return (
                <View key={item.id} style={styles.card}>
                  <View style={styles.historicoLinha}>
                    <View style={styles.historicoInfo}>
                      <Text style={styles.historicoProblema}>
                        {item.problema || "Solicitação de Socorro"}
                      </Text>
                      <Text style={styles.historicoData}>{item.data}</Text>
                    </View>
                    <View style={[styles.statusBadge, badge.style]}>
                      <Text style={badge.textoStyle}>{item.status}</Text>
                    </View>
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={styles.textoVazio}>
              Nenhum histórico de atendimento encontrado.
            </Text>
          )}
        </View>

        {/* BOTÃO DE SAIR */}
        <TouchableOpacity
          style={[styles.botaoSair, saindo && styles.botaoSairDesabilitado]}
          onPress={handleLogout}
          disabled={saindo}
          activeOpacity={0.8}
        >
          {saindo ? (
            <ActivityIndicator color={CORES.erro} size="small" />
          ) : (
            <>
              <MaterialCommunityIcons
                name="logout"
                size={20}
                color={CORES.erro}
              />
              <Text style={styles.botaoSairTexto}>Sair da Conta</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CORES.fundo,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  botaoVoltar: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    marginBottom: 20,
    paddingVertical: 6,
  },
  voltarTexto: {
    color: CORES.texto,
    fontSize: 15,
    fontWeight: "600",
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: CORES.primaria,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: CORES.destaque,
    marginBottom: 14,
  },
  avatarTexto: {
    color: "#ffffff",
    fontSize: 26,
    fontWeight: "800",
  },
  nome: {
    fontSize: 22,
    fontWeight: "800",
    color: CORES.texto,
    marginBottom: 4,
  },
  infoTexto: {
    fontSize: 14,
    color: CORES.textoSuave,
    marginTop: 2,
  },
  botaoAcao: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    backgroundColor: CORES.cartao,
    borderWidth: 1,
    borderColor: CORES.borda,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 18,
  },
  botaoAcaoTexto: {
    color: CORES.destaque,
    fontWeight: "600",
    fontSize: 14,
  },
  secaoContainer: {
    marginBottom: 24,
  },
  secaoTitulo: {
    fontSize: 13,
    fontWeight: "700",
    color: CORES.textoSuave,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  card: {
    backgroundColor: CORES.cartao,
    borderWidth: 1,
    borderColor: CORES.borda,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  veiculoModelo: {
    fontSize: 16,
    fontWeight: "700",
    color: CORES.texto,
  },
  veiculoInfo: {
    fontSize: 13,
    color: CORES.textoSuave,
    marginTop: 8,
  },
  destaqueTexto: {
    color: CORES.texto,
    fontWeight: "600",
  },
  cardBotao: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: CORES.cartao,
    borderWidth: 1,
    borderColor: CORES.borda,
    borderRadius: 16,
    padding: 16,
  },
  cardBotaoTexto: {
    fontSize: 15,
    fontWeight: "600",
    color: CORES.texto,
  },
  historicoLinha: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historicoInfo: {
    flex: 1,
    marginRight: 10,
  },
  historicoProblema: {
    fontSize: 15,
    fontWeight: "600",
    color: CORES.texto,
  },
  historicoData: {
    fontSize: 13,
    color: CORES.textoSuave,
    marginTop: 4,
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusConcluido: {
    backgroundColor: "rgba(34, 197, 94, 0.15)",
  },
  statusTextoConcluido: {
    color: "#4ade80",
    fontSize: 12,
    fontWeight: "700",
  },
  statusCancelado: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
  },
  statusTextoCancelado: {
    color: "#f87171",
    fontSize: 12,
    fontWeight: "700",
  },
  statusPadrao: {
    backgroundColor: "rgba(156, 163, 175, 0.15)",
  },
  statusTextoPadrao: {
    color: "#d1d5db",
    fontSize: 12,
    fontWeight: "700",
  },
  botaoSair: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 12,
  },
  botaoSairDesabilitado: {
    opacity: 0.5,
  },
  botaoSairTexto: {
    color: CORES.erro,
    fontWeight: "700",
    fontSize: 15,
  },
  textoErro: {
    fontSize: 15,
    color: CORES.textoSuave,
    marginTop: 12,
    marginBottom: 20,
    textAlign: "center",
  },
  textoVazio: {
    fontSize: 14,
    color: CORES.textoSuave,
    textAlign: "center",
    marginVertical: 16,
  },
});