import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ApiError, Categoria, listarCategorias } from "../src/services/api";

const CORES = {
  fundo: "#000000",
  cartao: "#111827",
  borda: "#1f2937",
  primaria: "#2563eb",
  destaque: "#38bdf8",
  destaqueSuave: "rgba(56, 189, 248, 0.1)",
  texto: "#ffffff",
  textoSuave: "#9ca3af",
};

const ICONES: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  "pane seca": "gas-station",
  bateria: "car-battery",
  pneu: "car-tire-alert",
  chaveiro: "key-variant",
  reboque: "tow-truck",
  "mecanica leve": "wrench",
};

function iconeDe(nome: string) {
  return ICONES[nome.trim().toLowerCase()] ?? "car-wrench";
}

export default function Home() {
  const router = useRouter();

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    carregarCategorias();
  }, []);

  async function carregarCategorias() {
    try {
      setCarregando(true);
      setErro(null);
      setCategorias(await listarCategorias());
    } catch (e) {
      setErro(
        e instanceof ApiError
          ? e.message
          : "Não foi possível carregar os serviços."
      );
    } finally {
      setCarregando(false);
    }
  }

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return categorias;
    return categorias.filter(
      (c) =>
        c.nome.toLowerCase().includes(termo) ||
        (c.descricao ?? "").toLowerCase().includes(termo)
    );
  }, [busca, categorias]);

  function abrirSolicitacao(categoria?: Categoria) {
    router.push({
      pathname: "/solicitar-assistencia",
      params: categoria
        ? { categoriaId: String(categoria.id), categoriaNome: categoria.nome }
        : {},
    });
  }

  return (
    <SafeAreaView style={styles.tela}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.conteudo}>
          {/* CABEÇALHO */}
          <View style={styles.cabecalho}>
            <View>
              <Text style={styles.marca}>Örtöö</Text>
              <Text style={styles.marcaSub}>Assistência veicular</Text>
            </View>
            <TouchableOpacity
              style={styles.botaoPerfil}
              onPress={() => router.push("/perfil")}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="account-outline"
                size={22}
                color={CORES.texto}
              />
            </TouchableOpacity>
          </View>

          {/* TITULO */}
          <Text style={styles.titulo}>
            O que aconteceu{"\n"}com seu veículo?
          </Text>
          <Text style={styles.subtitulo}>
            Escolha o tipo de problema e encontramos quem pode te ajudar por
            perto.
          </Text>

          {/* CARD SOS */}
          <TouchableOpacity
            style={styles.sos}
            activeOpacity={0.85}
            onPress={() => abrirSolicitacao()}
          >
            <View style={styles.sosIcone}>
              <MaterialCommunityIcons name="lifebuoy" size={26} color="#FFF" />
            </View>
            <View style={styles.sosTextos}>
              <Text style={styles.sosTitulo}>Pedir ajuda agora</Text>
              <Text style={styles.sosSubtitulo}>
                Não sabe o problema? Descreva na próxima tela.
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color="#FFF"
            />
          </TouchableOpacity>

          {/* BARRA DE BUSCA */}
          <View style={styles.buscaCaixa}>
            <MaterialCommunityIcons
              name="magnify"
              size={20}
              color={CORES.textoSuave}
            />
            <TextInput
              style={styles.buscaInput}
              placeholder="Buscar serviço..."
              placeholderTextColor={CORES.textoSuave}
              value={busca}
              onChangeText={setBusca}
              autoCapitalize="none"
            />
            {busca.length > 0 && (
              <TouchableOpacity onPress={() => setBusca("")}>
                <MaterialCommunityIcons
                  name="close-circle"
                  size={18}
                  color={CORES.textoSuave}
                />
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.secao}>Serviços disponíveis</Text>

          {/* LISTAGEM DE CATEGORIAS */}
          {carregando ? (
            <ActivityIndicator
              size="large"
              color={CORES.destaque}
              style={styles.carregando}
            />
          ) : erro ? (
            <View style={styles.cartaoErro}>
              <MaterialCommunityIcons
                name="wifi-off"
                size={28}
                color={CORES.textoSuave}
              />
              <Text style={styles.textoErro}>{erro}</Text>
              <TouchableOpacity
                style={styles.botaoRetry}
                onPress={carregarCategorias}
                activeOpacity={0.8}
              >
                <Text style={styles.botaoRetryTexto}>Tentar novamente</Text>
              </TouchableOpacity>
            </View>
          ) : filtradas.length === 0 ? (
            <Text style={styles.vazio}>
              Nenhum serviço encontrado para &quot;{busca}&quot;.
            </Text>
          ) : (
            <View style={styles.lista}>
              {filtradas.map((categoria) => (
                <TouchableOpacity
                  key={categoria.id}
                  style={styles.cartao}
                  activeOpacity={0.7}
                  onPress={() => abrirSolicitacao(categoria)}
                >
                  <View style={styles.cartaoIcone}>
                    <MaterialCommunityIcons
                      name={iconeDe(categoria.nome)}
                      size={22}
                      color={CORES.destaque}
                    />
                  </View>
                  <View style={styles.cartaoTextos}>
                    <Text style={styles.cartaoNome}>{categoria.nome}</Text>
                    {categoria.descricao ? (
                      <Text style={styles.cartaoDescricao} numberOfLines={1}>
                        {categoria.descricao}
                      </Text>
                    ) : null}
                  </View>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={22}
                    color={CORES.textoSuave}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: CORES.fundo,
  },
  scroll: {
    alignItems: "center",
    paddingVertical: 20,
  },
  conteudo: {
    width: "100%",
    maxWidth: 520,
    paddingHorizontal: 20,
  },

  cabecalho: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
  },
  marca: {
    fontSize: 24,
    fontWeight: "800",
    color: CORES.texto,
    letterSpacing: -0.5,
  },
  marcaSub: {
    fontSize: 12,
    color: CORES.textoSuave,
    marginTop: 1,
  },
  botaoPerfil: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: CORES.cartao,
    borderWidth: 1,
    borderColor: CORES.borda,
    alignItems: "center",
    justifyContent: "center",
  },

  titulo: {
    fontSize: 28,
    fontWeight: "800",
    color: CORES.texto,
    lineHeight: 36,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitulo: {
    fontSize: 14,
    color: CORES.textoSuave,
    lineHeight: 20,
    marginBottom: 24,
  },

  sos: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CORES.primaria,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: CORES.primaria,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sosIcone: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  sosTextos: { flex: 1 },
  sosTitulo: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  sosSubtitulo: { color: "#bfdbfe", fontSize: 12, marginTop: 2 },

  buscaCaixa: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: CORES.cartao,
    borderWidth: 1,
    borderColor: CORES.borda,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 28,
  },
  buscaInput: {
    flex: 1,
    fontSize: 15,
    color: CORES.texto,
    ...Platform.select({ web: { outlineStyle: "none" } as any }),
  },

  secao: {
    fontSize: 13,
    fontWeight: "700",
    color: CORES.textoSuave,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 14,
  },

  lista: { gap: 12 },
  cartao: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CORES.cartao,
    borderWidth: 1,
    borderColor: CORES.borda,
    borderRadius: 16,
    padding: 16,
  },
  cartaoIcone: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: CORES.destaqueSuave,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  cartaoTextos: { flex: 1 },
  cartaoNome: { fontSize: 15, fontWeight: "600", color: CORES.texto },
  cartaoDescricao: { fontSize: 13, color: CORES.textoSuave, marginTop: 2 },

  carregando: { marginTop: 32 },
  cartaoErro: {
    backgroundColor: CORES.cartao,
    borderColor: CORES.borda,
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  textoErro: {
    color: CORES.textoSuave,
    fontSize: 14,
    textAlign: "center",
    marginTop: 10,
  },
  botaoRetry: {
    marginTop: 16,
    backgroundColor: CORES.primaria,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 22,
  },
  botaoRetryTexto: { color: "#FFF", fontWeight: "600", fontSize: 14 },
  vazio: {
    fontSize: 14,
    color: CORES.textoSuave,
    textAlign: "center",
    marginTop: 20,
  },
});