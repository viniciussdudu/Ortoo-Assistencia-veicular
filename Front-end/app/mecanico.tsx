import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  ApiError,
  getUserProfile,
  listarPrestadores,
  logout,
  Prestador,
  UserProfile,
} from "../src/services/api";

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

const ROTULO_TIPO: Record<UserProfile["tipo_usuario"], string> = {
  CLIENTE: "Cliente",
  PRESTADOR_AUTONOMO: "Prestador autônomo",
  EMPRESA: "Empresa",
};

function formatarPreco(valor: number | string) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return "—";
  return `R$ ${numero.toFixed(2).replace(".", ",")}`;
}

function iniciais(nome?: string | null) {
  if (!nome) return "??";
  return nome
    .split(" ")
    .filter(Boolean)
    .map((parte) => parte[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function Mecanico() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [saindo, setSaindo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [usuario, setUsuario] = useState<UserProfile | null>(null);
  const [prestador, setPrestador] = useState<Prestador | null>(null);

  const carregar = useCallback(async () => {
    try {
      setErro(null);
      const perfil = await getUserProfile();
      setUsuario(perfil);

      // Não existe endpoint "meu prestador": o vínculo é feito localmente,
      // procurando na lista o registro cujo usuario_id é o do usuário logado.
      const lista = await listarPrestadores();
      setPrestador(lista.find((p) => p.usuario_id === perfil.id) ?? null);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        router.replace("/");
        return;
      }
      setErro(
        e instanceof ApiError
          ? e.message
          : "Verifique sua conexão e tente novamente."
      );
    }
  }, [router]);

  // Recarrega ao voltar da tela de cadastro, para mostrar o serviço novo.
  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      setLoading(true);
      carregar().finally(() => {
        if (ativo) setLoading(false);
      });
      return () => {
        ativo = false;
      };
    }, [carregar])
  );

  async function aoAtualizar() {
    setAtualizando(true);
    await carregar();
    setAtualizando(false);
  }

  async function handleLogout() {
    setSaindo(true);
    try {
      await logout();
      router.replace("/");
    } catch (e) {
      Alert.alert(
        "Erro ao sair",
        e instanceof ApiError ? e.message : "Tente novamente."
      );
    } finally {
      setSaindo(false);
    }
  }

  function irParaCadastro() {
    if (!prestador) return;
    router.push({
      pathname: "/cadastroServico",
      params: { prestadorId: String(prestador.id) },
    });
  }

  if (loading && !usuario) {
    return (
      <View style={[styles.container, styles.center]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={CORES.destaque} />
      </View>
    );
  }

  if (erro || !usuario) {
    return (
      <View style={[styles.container, styles.center]}>
        <Stack.Screen options={{ headerShown: false }} />
        <MaterialCommunityIcons
          name="account-off-outline"
          size={48}
          color={CORES.textoSuave}
        />
        <Text style={styles.textoErro}>
          {erro ?? "Não foi possível carregar os dados do perfil."}
        </Text>
        <TouchableOpacity
          style={styles.botaoAcao}
          onPress={() => {
            setLoading(true);
            carregar().finally(() => setLoading(false));
          }}
        >
          <Text style={styles.botaoAcaoTexto}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const nomeExibido = prestador?.nome_fantasia || usuario.nome;
  const servicos = prestador?.servicos ?? [];

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={aoAtualizar}
            tintColor={CORES.destaque}
          />
        }
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarTexto}>{iniciais(nomeExibido)}</Text>
          </View>

          <Text style={styles.nome}>{nomeExibido}</Text>
          <Text style={styles.infoTexto}>{usuario.email}</Text>
          {usuario.telefone ? (
            <Text style={styles.infoTexto}>{usuario.telefone}</Text>
          ) : null}
          <Text style={styles.infoTexto}>
            {ROTULO_TIPO[usuario.tipo_usuario]} • {usuario.tipo_documento}{" "}
            {usuario.documento}
          </Text>
        </View>

        {usuario.tipo_usuario === "CLIENTE" ? (
          <View style={styles.secaoContainer}>
            <View style={styles.card}>
              <Text style={styles.textoVazio}>
                Esta área é exclusiva para prestadores de serviço.
              </Text>
            </View>
          </View>
        ) : (
          <>
            {prestador ? (
              <View style={styles.secaoContainer}>
                <Text style={styles.secaoTitulo}>Atendimento</Text>
                <View style={styles.card}>
                  <View style={styles.linhaEntre}>
                    <Text style={styles.rotulo}>Situação</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        prestador.disponivel
                          ? styles.statusAtivo
                          : styles.statusInativo,
                      ]}
                    >
                      <Text
                        style={
                          prestador.disponivel
                            ? styles.statusTextoAtivo
                            : styles.statusTextoInativo
                        }
                      >
                        {prestador.disponivel ? "Disponível" : "Indisponível"}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.linhaEntre, styles.linhaEspaco]}>
                    <Text style={styles.rotulo}>Raio de atendimento</Text>
                    <Text style={styles.valor}>
                      {prestador.raio_atendimento_km} km
                    </Text>
                  </View>

                  {prestador.descricao_empresa ? (
                    <Text style={styles.descricao}>
                      {prestador.descricao_empresa}
                    </Text>
                  ) : null}
                </View>
              </View>
            ) : (
              <View style={styles.secaoContainer}>
                <View style={styles.card}>
                  <Text style={styles.textoVazio}>
                    Não encontramos um cadastro de prestador para a sua conta.
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.secaoContainer}>
              <Text style={styles.secaoTitulo}>Meus serviços</Text>

              {prestador && servicos.length === 0 ? (
                <Text style={styles.textoVazio}>
                  Você ainda não cadastrou nenhum serviço.
                </Text>
              ) : (
                servicos.map((servico) => (
                  <View key={servico.id} style={styles.card}>
                    <View style={styles.linhaEntre}>
                      <View style={styles.cardHeader}>
                        <MaterialCommunityIcons
                          name="wrench-outline"
                          size={22}
                          color={CORES.destaque}
                        />
                        <Text style={styles.servicoNome}>
                          {servico.categoria_nome ??
                            `Categoria ${servico.categoria_id}`}
                        </Text>
                      </View>
                      <Text style={styles.servicoPreco}>
                        {formatarPreco(servico.preco_base)}
                      </Text>
                    </View>
                  </View>
                ))
              )}

              <TouchableOpacity
                style={[
                  styles.cardBotao,
                  !prestador && styles.cardBotaoDesabilitado,
                ]}
                onPress={irParaCadastro}
                disabled={!prestador}
                activeOpacity={0.8}
              >
                <View style={styles.cardHeader}>
                  <MaterialCommunityIcons
                    name="plus-circle-outline"
                    size={22}
                    color={CORES.destaque}
                  />
                  <Text style={styles.cardBotaoTexto}>Cadastrar serviço</Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={22}
                  color={CORES.textoSuave}
                />
              </TouchableOpacity>

              {!prestador ? (
                <Text style={styles.textoAjuda}>
                  Sem um perfil de prestador não é possível cadastrar serviços.
                </Text>
              ) : null}
            </View>
          </>
        )}

        {/* SAIR */}
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
    textAlign: "center",
  },
  infoTexto: {
    fontSize: 14,
    color: CORES.textoSuave,
    marginTop: 2,
    textAlign: "center",
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
    flexShrink: 1,
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
  linhaEntre: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  linhaEspaco: {
    marginTop: 12,
  },
  rotulo: {
    fontSize: 14,
    color: CORES.textoSuave,
  },
  valor: {
    fontSize: 14,
    fontWeight: "600",
    color: CORES.texto,
  },
  descricao: {
    fontSize: 13,
    color: CORES.textoSuave,
    marginTop: 12,
    lineHeight: 19,
  },
  servicoNome: {
    fontSize: 15,
    fontWeight: "600",
    color: CORES.texto,
    flexShrink: 1,
  },
  servicoPreco: {
    fontSize: 15,
    fontWeight: "700",
    color: CORES.destaque,
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusAtivo: {
    backgroundColor: "rgba(34, 197, 94, 0.15)",
  },
  statusInativo: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
  },
  statusTextoAtivo: {
    color: "#4ade80",
    fontSize: 12,
    fontWeight: "700",
  },
  statusTextoInativo: {
    color: "#f87171",
    fontSize: 12,
    fontWeight: "700",
  },
  textoErro: {
    fontSize: 15,
    color: CORES.textoSuave,
    marginTop: 12,
    marginBottom: 4,
    textAlign: "center",
  },
  textoVazio: {
    fontSize: 14,
    color: CORES.textoSuave,
    textAlign: "center",
    marginVertical: 16,
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
  cardBotaoDesabilitado: {
    opacity: 0.45,
  },
  textoAjuda: {
    fontSize: 13,
    color: CORES.textoSuave,
    marginTop: 8,
  },
});