import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  ApiError,
  cadastrarServico,
  Categoria,
  listarCategorias,
  listarPrestadores,
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

const PRECO_MAXIMO = 99999.99;

// Aceita "120", "120,5", "120.50". Retorna null se inválido.
function converterPreco(texto: string): number | null {
  const limpo = texto.trim().replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(limpo)) return null;
  const valor = Number(limpo);
  return Number.isFinite(valor) ? valor : null;
}

export default function CadastrarServico() {
  const router = useRouter();
  const { prestadorId } = useLocalSearchParams<{ prestadorId?: string }>();
  const idPrestador = Number(prestadorId);
  const idValido = Number.isInteger(idPrestador) && idPrestador > 0;

  const [loading, setLoading] = useState(true);
  const [erroCarga, setErroCarga] = useState<string | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [jaCadastradas, setJaCadastradas] = useState<number[]>([]);

  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [preco, setPreco] = useState("");
  const [erroCategoria, setErroCategoria] = useState<string | null>(null);
  const [erroPreco, setErroPreco] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    try {
      setLoading(true);
      setErroCarga(null);
      const [cats, prestadores] = await Promise.all([
        listarCategorias(),
        listarPrestadores(),
      ]);
      setCategorias(cats);
      const meu = prestadores.find((p) => p.id === idPrestador);
      setJaCadastradas((meu?.servicos ?? []).map((s) => s.categoria_id));
    } catch (e) {
      setErroCarga(
        e instanceof ApiError
          ? e.message
          : "Não foi possível carregar as categorias."
      );
    } finally {
      setLoading(false);
    }
  }, [idPrestador]);

  useEffect(() => {
    if (idValido) carregar();
    else setLoading(false);
  }, [carregar, idValido]);

  async function salvar() {
    let valido = true;

    if (categoriaId === null) {
      setErroCategoria("Escolha uma categoria.");
      valido = false;
    } else {
      setErroCategoria(null);
    }

    const valor = converterPreco(preco);
    if (valor === null || valor <= 0) {
      setErroPreco("Informe um valor maior que zero, com até 2 casas decimais.");
      valido = false;
    } else if (valor > PRECO_MAXIMO) {
      setErroPreco("O valor máximo é R$ 99.999,99.");
      valido = false;
    } else {
      setErroPreco(null);
    }

    if (!valido || categoriaId === null || valor === null) return;

    setSalvando(true);
    try {
      await cadastrarServico({
        categoria_id: categoriaId,
        preco_base: valor,
      });
      Alert.alert("Serviço cadastrado", "O serviço já aparece no seu perfil.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        router.replace("/");
        return;
      }
      Alert.alert(
        "Erro ao cadastrar serviço",
        e instanceof ApiError ? e.message : "Tente novamente."
      );
    } finally {
      setSalvando(false);
    }
  }

  const cabecalho = (
    <TouchableOpacity style={styles.botaoVoltar} onPress={() => router.back()}>
      <MaterialCommunityIcons name="arrow-left" size={20} color="#fff" />
      <Text style={styles.voltarTexto}>Voltar</Text>
    </TouchableOpacity>
  );

  if (!idValido) {
    return (
      <View style={[styles.container, styles.center]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.textoErro}>
          Não foi possível identificar o prestador. Volte e tente novamente.
        </Text>
        <TouchableOpacity style={styles.botaoAcao} onPress={() => router.back()}>
          <Text style={styles.botaoAcaoTexto}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={CORES.destaque} />
      </View>
    );
  }

  if (erroCarga) {
    return (
      <View style={[styles.container, styles.center]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.textoErro}>{erroCarga}</Text>
        <TouchableOpacity style={styles.botaoAcao} onPress={carregar}>
          <Text style={styles.botaoAcaoTexto}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {cabecalho}

          <Text style={styles.titulo}>Cadastrar serviço</Text>
          <Text style={styles.subtitulo}>
            Escolha a categoria e defina o preço base que você cobra.
          </Text>

          {/* CATEGORIA */}
          <View style={styles.secaoContainer}>
            <Text style={styles.secaoTitulo}>Categoria</Text>

            {categorias.length === 0 ? (
              <Text style={styles.textoVazio}>
                Nenhuma categoria disponível no momento.
              </Text>
            ) : (
              categorias.map((cat) => {
                const cadastrada = jaCadastradas.includes(cat.id);
                const selecionada = categoriaId === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.opcao,
                      selecionada && styles.opcaoSelecionada,
                      cadastrada && styles.opcaoDesabilitada,
                    ]}
                    disabled={cadastrada}
                    activeOpacity={0.8}
                    onPress={() => {
                      setCategoriaId(cat.id);
                      setErroCategoria(null);
                    }}
                  >
                    <View style={styles.opcaoTextos}>
                      <Text style={styles.opcaoNome}>{cat.nome}</Text>
                      {cadastrada ? (
                        <Text style={styles.opcaoInfo}>Já cadastrado</Text>
                      ) : cat.descricao ? (
                        <Text style={styles.opcaoInfo}>{cat.descricao}</Text>
                      ) : null}
                    </View>
                    <MaterialCommunityIcons
                      name={
                        selecionada
                          ? "radiobox-marked"
                          : "radiobox-blank"
                      }
                      size={22}
                      color={selecionada ? CORES.destaque : CORES.textoSuave}
                    />
                  </TouchableOpacity>
                );
              })
            )}

            {erroCategoria ? (
              <Text style={styles.erroCampo}>{erroCategoria}</Text>
            ) : null}
          </View>

          {/* PREÇO */}
          <View style={styles.secaoContainer}>
            <Text style={styles.secaoTitulo}>Preço base</Text>
            <View style={[styles.campo, erroPreco && styles.campoErro]}>
              <Text style={styles.prefixo}>R$</Text>
              <TextInput
                style={styles.input}
                value={preco}
                onChangeText={(t) => {
                  setPreco(t);
                  setErroPreco(null);
                }}
                placeholder="0,00"
                placeholderTextColor={CORES.textoSuave}
                keyboardType="decimal-pad"
                maxLength={9}
              />
            </View>
            {erroPreco ? <Text style={styles.erroCampo}>{erroPreco}</Text> : null}
          </View>

          <TouchableOpacity
            style={[styles.botaoSalvar, salvando && styles.botaoDesabilitado]}
            onPress={salvar}
            disabled={salvando}
            activeOpacity={0.8}
          >
            {salvando ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.botaoSalvarTexto}>Salvar serviço</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
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
  titulo: {
    fontSize: 22,
    fontWeight: "800",
    color: CORES.texto,
    marginBottom: 6,
  },
  subtitulo: {
    fontSize: 14,
    color: CORES.textoSuave,
    marginBottom: 28,
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
  opcao: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    backgroundColor: CORES.cartao,
    borderWidth: 1,
    borderColor: CORES.borda,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },
  opcaoSelecionada: {
    borderColor: CORES.destaque,
  },
  opcaoDesabilitada: {
    opacity: 0.45,
  },
  opcaoTextos: {
    flex: 1,
  },
  opcaoNome: {
    fontSize: 15,
    fontWeight: "600",
    color: CORES.texto,
  },
  opcaoInfo: {
    fontSize: 13,
    color: CORES.textoSuave,
    marginTop: 3,
  },
  campo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: CORES.cartao,
    borderWidth: 1,
    borderColor: CORES.borda,
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  campoErro: {
    borderColor: CORES.erro,
  },
  prefixo: {
    fontSize: 16,
    fontWeight: "600",
    color: CORES.textoSuave,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: CORES.texto,
  },
  erroCampo: {
    color: CORES.erro,
    fontSize: 13,
    marginTop: 8,
  },
  botaoSalvar: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: CORES.primaria,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 4,
  },
  botaoDesabilitado: {
    opacity: 0.5,
  },
  botaoSalvarTexto: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
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
  textoErro: {
    fontSize: 15,
    color: CORES.textoSuave,
    textAlign: "center",
  },
  textoVazio: {
    fontSize: 14,
    color: CORES.textoSuave,
    textAlign: "center",
    marginVertical: 16,
  },
});