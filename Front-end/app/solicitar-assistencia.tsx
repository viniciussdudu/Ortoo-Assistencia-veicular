import { ShowAlert } from "@/components/alert";
import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  ApiError,
  Categoria,
  listarCategorias,
} from "../src/services/api";
import { Cores, useEstilos, useTema } from "../src/tema";

const TEMPO_LIMITE_MS = 15000;
type Coordenadas = { latitude: number; longitude: number };

async function obterLocalizacao(estaAtivo: () => boolean): Promise<Coordenadas> {
  if (Platform.OS === "web") {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      throw new Error("Localização indisponível. Abra o app em localhost ou HTTPS.");
    }
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => resolve(coords),
        (erro) => reject(new Error(erro.code === 1
          ? "Permissão de localização negada. Habilite-a no navegador e tente novamente."
          : "Não foi possível obter sua localização. Verifique o GPS e tente novamente.")),
        { timeout: TEMPO_LIMITE_MS, maximumAge: 0 },
      );
    });
  }
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (!estaAtivo()) throw new Error("Busca encerrada.");
  if (status !== "granted") {
    throw new Error("Permissão de localização negada. Habilite-a nas configurações e tente novamente.");
  }
  const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  return coords;
}

export default function SolicitarAssistencia() {
  const { cores: CORES } = useTema();
  const styles = useEstilos(criarEstilos);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const params = useLocalSearchParams<{ categoriaId?: string }>();
  const [categoriaId, setCategoriaId] = useState<number | null>(
    params.categoriaId ? Number(params.categoriaId) : null,
  );
  const [descricao, setDescricao] = useState("");
  const [coords, setCoords] = useState<Coordenadas | null>(null);
  const [carregandoCategorias, setCarregandoCategorias] = useState(true);
  const [erroCategorias, setErroCategorias] = useState<string | null>(null);
  const [tentativaCategorias, setTentativaCategorias] = useState(0);
  const [buscandoLocalizacao, setBuscandoLocalizacao] = useState(false);
  const [tentativaLocalizacao, setTentativaLocalizacao] = useState(0);
  const [erroLocalizacao, setErroLocalizacao] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setCarregandoCategorias(true);
    setErroCategorias(null);
    const timer = setTimeout(() => {
      controller.abort();
      setErroCategorias("A lista de serviços demorou para responder. Tente novamente.");
      setCarregandoCategorias(false);
    }, TEMPO_LIMITE_MS);
    void listarCategorias(controller.signal)
      .then((lista) => {
        if (controller.signal.aborted) return;
        if (!Array.isArray(lista)) throw new Error("Resposta inválida.");
        setCategorias(lista);
      })
      .catch((erro) => {
        if (!controller.signal.aborted) {
          setErroCategorias(erro instanceof ApiError ? erro.message : "Não foi possível carregar os serviços.");
        }
      })
      .finally(() => {
        clearTimeout(timer);
        if (!controller.signal.aborted) setCarregandoCategorias(false);
      });
    return () => { clearTimeout(timer); controller.abort(); };
  }, [tentativaCategorias]);

  useEffect(() => {
    if (!tentativaLocalizacao) return;
    let ativo = true;
    setBuscandoLocalizacao(true);
    setErroLocalizacao(null);
    const timer = setTimeout(() => {
      ativo = false;
      setErroLocalizacao("Não foi possível localizar você a tempo. Verifique a permissão de localização e tente novamente.");
      setBuscandoLocalizacao(false);
    }, TEMPO_LIMITE_MS);
    void obterLocalizacao(() => ativo)
      .then((posicao) => { if (ativo) setCoords(posicao); })
      .catch((erro) => {
        if (ativo) setErroLocalizacao(erro instanceof Error ? erro.message : "Não foi possível obter sua localização.");
      })
      .finally(() => {
        clearTimeout(timer);
        if (ativo) setBuscandoLocalizacao(false);
      });
    return () => { ativo = false; clearTimeout(timer); };
  }, [tentativaLocalizacao]);

  const podeContinuar = !!coords && !erroCategorias && categorias.some((categoria) => categoria.id === categoriaId);

  function enviar() {
    if (!podeContinuar || !categoriaId) return;
    try {
      // O atendimento é criado após o cliente escolher o prestador no mapa.
      router.push({
        pathname: "/mapa",
        params: { categoria_id: categoriaId },
      });
    } catch (erro) {
      ShowAlert("Erro", erro instanceof ApiError ? erro.message : "Não foi possível abrir o mapa.");
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Solicitar assistência</Text>
      <Pressable accessibilityRole="button" onPress={() => router.canGoBack() ? router.back() : router.replace("/home")}>
        <Text style={styles.acao}>Voltar</Text>
      </Pressable>

      <Text style={styles.rotulo}>Qual é o problema?</Text>
      {carregandoCategorias ? <ActivityIndicator accessibilityLabel="Carregando serviços" color={CORES.destaque} /> : erroCategorias ? (
        <View>
          <Text accessibilityRole="alert" style={styles.localErro}>{erroCategorias}</Text>
          <Pressable accessibilityRole="button" onPress={() => setTentativaCategorias((n) => n + 1)}>
            <Text style={styles.acao}>Recarregar serviços</Text>
          </Pressable>
        </View>
      ) : !categorias.length && <Text style={styles.localTexto}>Nenhum serviço disponível.</Text>}
      <View style={styles.grade}>
        {categorias.map((categoria) => (
          <Pressable
            key={categoria.id}
            onPress={() => setCategoriaId(categoria.id)}
            style={[styles.chip, categoriaId === categoria.id && styles.chipAtivo]}
          >
            <Text style={[styles.chipTexto, categoriaId === categoria.id && styles.chipTextoAtivo]}>
              {categoria.nome}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.rotulo}>Descreva o que aconteceu (opcional)</Text>
      <TextInput
        style={styles.campo}
        multiline
        numberOfLines={4}
        value={descricao}
        onChangeText={setDescricao}
        placeholderTextColor={CORES.textoSuave}
        placeholder="Ex.: carro não liga, luz da bateria acesa"
      />

      <View style={styles.local}>
        {coords ? (
          <Text style={styles.localTexto}>
            Localização capturada: {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
          </Text>
        ) : (
          <>
            <Text accessibilityLiveRegion="polite" style={erroLocalizacao ? styles.localErro : styles.localTexto}>
              {erroLocalizacao ?? (buscandoLocalizacao ? "Buscando sua localização…" : "Precisamos da sua localização para encontrar prestadores próximos.")}
            </Text>
            {!buscandoLocalizacao && (
              <Pressable accessibilityRole="button" onPress={() => setTentativaLocalizacao((n) => n + 1)}>
                <Text style={styles.acao}>{erroLocalizacao ? "Tentar localização novamente" : "Usar minha localização"}</Text>
              </Pressable>
            )}
          </>
        )}
      </View>

      <Pressable
        onPress={enviar}
        disabled={!podeContinuar}
        style={[styles.botao, !podeContinuar && styles.botaoDesabilitado]}
      >
        <Text style={styles.botaoTexto}>Pedir ajuda agora</Text>
      </Pressable>
    </ScrollView>
  );
}

const criarEstilos = (CORES: Cores) =>
  StyleSheet.create({
  container: { padding: 24, gap: 16 },
  acao: { color: CORES.destaque, fontWeight: "700", paddingVertical: 8 },
  titulo: { fontSize: 24, fontWeight: "700", color: CORES.texto },
  rotulo: { fontSize: 15, fontWeight: "600", color: CORES.texto, marginTop: 8 },
  grade: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: CORES.borda, backgroundColor: CORES.cartao,
  },
  chipAtivo: { backgroundColor: CORES.destaque, borderColor: CORES.destaque },
  chipTexto: { color: CORES.texto, fontWeight: "500" },
  chipTextoAtivo: { color: CORES.sobrePrimaria },
  campo: {
    borderWidth: 1,
    borderColor: CORES.borda,
    backgroundColor: CORES.cartao,
    color: CORES.texto,
    borderRadius: 8,
    padding: 12,
    minHeight: 96,
    textAlignVertical: "top",
  },
  local: { padding: 12, backgroundColor: CORES.cartao, borderRadius: 8 },
  localTexto: { color: CORES.texto, fontSize: 13 },
  localErro: { color: CORES.erro, fontSize: 13 },
  botao: {
    backgroundColor: CORES.destaque,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  botaoDesabilitado: { opacity: 0.5 },
  botaoTexto: { color: CORES.sobrePrimaria, fontWeight: "700", fontSize: 16 },
});
