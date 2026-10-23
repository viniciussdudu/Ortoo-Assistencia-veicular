import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import {
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { ApiError, TipoVeiculo, criarVeiculo, getUserProfile } from "../src/services/api";

const CORES = {
  fundo: "#F3EBDA",
  primaria: "#1F3140",
  destaque: "#C85A34",
  destaqueSuave: "#FBEDE6",
  cartao: "#FFFFFF",
  texto: "#1F3140",
  textoSuave: "#7A7266",
  borda: "#EAE2D2",
  critico: "#B3261E",
};

const TIPOS: { valor: TipoVeiculo; rotulo: string; icone: any }[] = [
  { valor: "CARRO", rotulo: "Carro", icone: "car" },
  { valor: "MOTO", rotulo: "Moto", icone: "motorbike" },
  { valor: "CAMINHAO", rotulo: "Caminhão", icone: "truck" },
  { valor: "BICICLETA", rotulo: "Bicicleta", icone: "bike" },
  { valor: "BIKE_ELETRICA", rotulo: "Bike elétrica", icone: "bike-fast" },
];

const PLACA_VALIDA = /^([A-Z]{3}\d{4}|[A-Z]{3}\d[A-Z]\d{2})$/;

export default function CadastrarVeiculo() {
  const router = useRouter();

  const [tipo, setTipo] = useState<TipoVeiculo>("CARRO");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [ano, setAno] = useState("");
  const [placa, setPlaca] = useState("");
  const [cor, setCor] = useState("");
  const [km, setKm] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const exigePlaca = tipo === "CARRO" || tipo === "MOTO" || tipo === "CAMINHAO";
  const anoAtual = new Date().getFullYear();

  function validar() {
    if (!modelo.trim()) return "Informe o modelo do veículo.";

    if (ano) {
      const n = Number(ano);
      if (!Number.isInteger(n) || n < 1900 || n > anoAtual + 1) {
        return `Informe um ano entre 1900 e ${anoAtual + 1}.`;
      }
    }

    if (exigePlaca && placa && !PLACA_VALIDA.test(placa)) {
      return "Placa inválida. Use ABC1234 ou ABC1D23.";
    }

    return null;
  }

  async function salvar() {
    const problema = validar();
    if (problema) {
      setErro(problema);
      return;
    }

    setSalvando(true);
    setErro(null);
    try {
      const usuario = await getUserProfile();
      const veiculo = await criarVeiculo({
        usuario_id: usuario.id,
        tipo,
        marca: marca.trim() || undefined,
        modelo: modelo.trim(),
        ano: ano ? Number(ano) : undefined,
        placa: placa || undefined,
        cor: cor.trim() || undefined,
        km_atual: km ? Number(km.replace(/\D/g, "")) : 0,
      });
      router.replace({ pathname: "/veiculo", params: { id: String(veiculo.id) } });
    } catch (e) {
      setErro(
        e instanceof ApiError ? e.message : "Não foi possível salvar o veículo.",
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <ScrollView
      style={styles.tela}
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
    >
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.conteudo}>
        <View style={styles.topo}>
          <TouchableOpacity onPress={() => router.back()} style={styles.voltar}>
            <MaterialCommunityIcons
              name="chevron-left"
              size={26}
              color={CORES.primaria}
            />
          </TouchableOpacity>
          <Text style={styles.topoTitulo}>Cadastrar veículo</Text>
          <View style={styles.voltar} />
        </View>

        <Text style={styles.rotulo}>Tipo de veículo</Text>
        <View style={styles.tipos}>
          {TIPOS.map((t) => {
            const ativo = tipo === t.valor;
            return (
              <TouchableOpacity
                key={t.valor}
                style={[styles.tipo, ativo && styles.tipoAtivo]}
                onPress={() => setTipo(t.valor)}
              >
                <MaterialCommunityIcons
                  name={t.icone}
                  size={22}
                  color={ativo ? "#FFF" : CORES.destaque}
                />
                <Text style={[styles.tipoTexto, ativo && styles.tipoTextoAtivo]}>
                  {t.rotulo}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.rotulo}>Marca</Text>
        <TextInput
          style={styles.campo}
          value={marca}
          onChangeText={setMarca}
          placeholder="Ex.: Volkswagen"
          placeholderTextColor={CORES.textoSuave}
        />

        <Text style={styles.rotulo}>
          Modelo <Text style={styles.obrigatorio}>*</Text>
        </Text>
        <TextInput
          style={styles.campo}
          value={modelo}
          onChangeText={setModelo}
          placeholder="Ex.: Gol"
          placeholderTextColor={CORES.textoSuave}
        />

        <View style={styles.linha}>
          <View style={styles.meio}>
            <Text style={styles.rotulo}>Ano</Text>
            <TextInput
              style={styles.campo}
              value={ano}
              onChangeText={(t) => setAno(t.replace(/\D/g, "").slice(0, 4))}
              keyboardType="numeric"
              placeholder={String(anoAtual)}
              placeholderTextColor={CORES.textoSuave}
            />
          </View>
          <View style={styles.meio}>
            <Text style={styles.rotulo}>Cor</Text>
            <TextInput
              style={styles.campo}
              value={cor}
              onChangeText={setCor}
              placeholder="Ex.: Prata"
              placeholderTextColor={CORES.textoSuave}
            />
          </View>
        </View>

        {exigePlaca && (
          <>
            <Text style={styles.rotulo}>Placa</Text>
            <TextInput
              style={[styles.campo, styles.campoPlaca]}
              value={placa}
              onChangeText={(t) =>
                setPlaca(t.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7))
              }
              autoCapitalize="characters"
              placeholder="ABC1D23"
              placeholderTextColor={CORES.textoSuave}
            />
          </>
        )}

        <Text style={styles.rotulo}>Quilometragem atual</Text>
        <TextInput
          style={styles.campo}
          value={km}
          onChangeText={(t) => setKm(t.replace(/\D/g, ""))}
          keyboardType="numeric"
          placeholder="Ex.: 78000"
          placeholderTextColor={CORES.textoSuave}
        />
        <Text style={styles.ajuda}>
          Usamos a quilometragem para avisar quando chega a hora de cada manutenção.
        </Text>

        {erro ? <Text style={styles.erro}>{erro}</Text> : null}

        <TouchableOpacity
          style={[styles.botao, salvando && { opacity: 0.6 }]}
          onPress={salvar}
          disabled={salvando}
        >
          <Text style={styles.botaoTexto}>
            {salvando ? "Salvando..." : "Salvar veículo"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const sombra = Platform.select({
  web: { boxShadow: "0 1px 3px rgba(31,49,64,0.08)" },
  default: {
    shadowColor: "#1F3140",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
}) as object;

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: CORES.fundo },
  scroll: { alignItems: "center", paddingVertical: 28 },
  conteudo: { width: "100%", maxWidth: 520, paddingHorizontal: 20 },

  topo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  voltar: { width: 32 },
  topoTitulo: { fontSize: 16, fontWeight: "700", color: CORES.primaria },

  rotulo: {
    fontSize: 13,
    fontWeight: "600",
    color: CORES.texto,
    marginBottom: 7,
  },
  obrigatorio: { color: CORES.destaque },
  campo: {
    backgroundColor: CORES.cartao,
    borderWidth: 1,
    borderColor: CORES.borda,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 15,
    color: CORES.texto,
    marginBottom: 16,
  },
  campoPlaca: { letterSpacing: 2, fontWeight: "600" },

  linha: { flexDirection: "row", gap: 12 },
  meio: { flex: 1 },

  tipos: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  tipo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: CORES.cartao,
    borderWidth: 1,
    borderColor: CORES.borda,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  tipoAtivo: { backgroundColor: CORES.destaque, borderColor: CORES.destaque },
  tipoTexto: { fontSize: 13.5, fontWeight: "500", color: CORES.texto },
  tipoTextoAtivo: { color: "#FFF" },

  ajuda: {
    fontSize: 12,
    color: CORES.textoSuave,
    marginTop: -8,
    marginBottom: 20,
    lineHeight: 17,
  },
  erro: {
    color: CORES.critico,
    fontSize: 13,
    marginBottom: 14,
    textAlign: "center",
  },

  botao: {
    backgroundColor: CORES.destaque,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    ...sombra,
  },
  botaoTexto: { color: "#FFF", fontWeight: "700", fontSize: 15 },
});
