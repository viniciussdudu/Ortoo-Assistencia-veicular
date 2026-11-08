import { ShowAlert } from "@/components/alert";
import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
  criarSolicitacao,
  getUserProfile,
  listarCategorias,
} from "../src/services/api";
import { Cores, useEstilos, useTema } from "../src/tema";

export default function SolicitarAssistencia() {
  const { cores: CORES } = useTema();
  const styles = useEstilos(criarEstilos);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
    const params = useLocalSearchParams<{ categoriaId?: string }>();
  const [categoriaId, setCategoriaId] = useState<number | null>(
    params.categoriaId ? Number(params.categoriaId) : null,
  );
  const [descricao, setDescricao] = useState("");
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erroLocalizacao, setErroLocalizacao] = useState<string | null>(null);

  useEffect(() => {
    async function carregar() {
      try {
        setCategorias(await listarCategorias());
      } catch (erro) {
        Alert.alert("Erro", erro instanceof ApiError ? erro.message : "Falha ao carregar categorias.");
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErroLocalizacao("Permissão de localização negada. Habilite nas configurações para continuar.");
      } else {
        try {
          const posicao = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setCoords({
            latitude: posicao.coords.latitude,
            longitude: posicao.coords.longitude,
          });
        } catch {
          setErroLocalizacao("Não foi possível obter sua localização.");
        }
      }

      setCarregando(false);
    }

    carregar();
  }, []);

  async function enviar() {
    if (!categoriaId) {
      Alert.alert("Atenção", "Escolha o tipo de problema.");
      ShowAlert("Atenção", "Escolha o tipo de problema.");
      return;
    }
    if (!coords) {
      Alert.alert("Atenção", "Precisamos da sua localização para acionar um prestador.");
      ShowAlert("Atenção", "Precisamos da sua localização para acionar um prestador.");
      return;
    }

    setEnviando(true);
    try {
      // O atendimento é criado após o cliente escolher o prestador no mapa.
      router.push({
        pathname: "/mapa",
        params: { categoria_id: categoriaId },
      });
    } catch (erro) {
      Alert.alert("Erro", erro instanceof ApiError ? erro.message : "Falha ao enviar a solicitação.");
      ShowAlert("Erro", erro instanceof ApiError ? erro.message : "Falha ao enviar a solicitação.")
    } finally {
      setEnviando(false);
    }
  }

  if (carregando) {
    return (
      <View style={[styles.container, styles.centro]}>
        <ActivityIndicator size="large" color={CORES.destaque} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Solicitar assistência</Text>

      <Text style={styles.rotulo}>Qual é o problema?</Text>
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
          <Text style={styles.localErro}>{erroLocalizacao}</Text>
        )}
      </View>

      <Pressable
        onPress={enviar}
        disabled={enviando || !coords}
        style={[styles.botao, (enviando || !coords) && styles.botaoDesabilitado]}
      >
        <Text style={styles.botaoTexto}>{enviando ? "Enviando..." : "Pedir ajuda agora"}</Text>
      </Pressable>
    </ScrollView>
  );
}

const criarEstilos = (CORES: Cores) =>
  StyleSheet.create({
  container: { padding: 24, gap: 16 },
  centro: { flex: 1, justifyContent: "center" },
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
