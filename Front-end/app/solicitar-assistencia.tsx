import * as Location from "expo-location";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import {
  ApiError, Categoria, criarSolicitacao, listarCategorias,
} from "../src/services/api";

// TODO: substituir pelo id do usuario logado quando houver sessao real.
const CLIENTE_ID = 1;

export default function SolicitarAssistencia() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaId, setCategoriaId] = useState<number | null>(null);
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
        setErroLocalizacao("Permissao de localizacao negada. Habilite nas configuracoes para continuar.");
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
          setErroLocalizacao("Nao foi possivel obter sua localizacao.");
        }
      }

      setCarregando(false);
    }

    carregar();
  }, []);

  async function enviar() {
    if (!categoriaId) {
      Alert.alert("Atencao", "Escolha o tipo de problema.");
      return;
    }
    if (!coords) {
      Alert.alert("Atencao", "Precisamos da sua localizacao para acionar um prestador.");
      return;
    }

    setEnviando(true);
    try {
      await criarSolicitacao({
        cliente_id: CLIENTE_ID,
        categoria_id: categoriaId,
        descricao_problema: descricao.trim() || undefined,
        latitude_origem: coords.latitude,
        longitude_origem: coords.longitude,
      });
      Alert.alert("Pronto", "Sua solicitacao foi enviada. Procurando prestadores proximos.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (erro) {
      Alert.alert("Erro", erro instanceof ApiError ? erro.message : "Falha ao enviar a solicitacao.");
    } finally {
      setEnviando(false);
    }
  }

  if (carregando) {
    return (
      <View style={[styles.container, styles.centro]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Solicitar assistencia</Text>

      <Text style={styles.rotulo}>Qual e o problema?</Text>
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
        placeholder="Ex.: carro nao liga, luz da bateria acesa"
      />

      <View style={styles.local}>
        {coords ? (
          <Text style={styles.localTexto}>
            Localizacao capturada: {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
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

const styles = StyleSheet.create({
  container: { padding: 24, gap: 16 },
  centro: { flex: 1, justifyContent: "center" },
  titulo: { fontSize: 24, fontWeight: "700", color: "#1F3140" },
  rotulo: { fontSize: 15, fontWeight: "600", color: "#1F3140", marginTop: 8 },
  grade: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20,
    borderWidth: 1, borderColor: "#1F3140",
  },
  chipAtivo: { backgroundColor: "#C85A34", borderColor: "#C85A34" },
  chipTexto: { color: "#1F3140", fontWeight: "500" },
  chipTextoAtivo: { color: "#F3EBDA" },
  campo: {
    borderWidth: 1, borderColor: "#CCC", borderRadius: 8,
    padding: 12, minHeight: 96, textAlignVertical: "top",
  },
  local: { padding: 12, backgroundColor: "#F3EBDA", borderRadius: 8 },
  localTexto: { color: "#1F3140", fontSize: 13 },
  localErro: { color: "#B00020", fontSize: 13 },
  botao: {
    backgroundColor: "#C85A34", paddingVertical: 16,
    borderRadius: 10, alignItems: "center", marginTop: 8,
  },
  botaoDesabilitado: { opacity: 0.5 },
  botaoTexto: { color: "#F3EBDA", fontWeight: "700", fontSize: 16 },
});