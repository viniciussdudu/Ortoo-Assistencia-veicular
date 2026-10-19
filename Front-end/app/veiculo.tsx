import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import {
    ApiError,
    Manutencao,
    VeiculoDetalhado,
    atualizarQuilometragem,
    listarVeiculos,
    obterVeiculo,
} from "../src/services/api";

// TODO: trocar pelo id do usuario logado quando houver sessao real.
const CLIENTE_ID = 1;

const CORES = {
  fundo: "#F3EBDA",
  primaria: "#1F3140",
  destaque: "#C85A34",
  destaqueSuave: "#FBEDE6",
  cartao: "#FFFFFF",
  texto: "#1F3140",
  textoSuave: "#7A7266",
  borda: "#EAE2D2",
  ok: "#2E7D52",
  okSuave: "#E6F2EB",
  atencao: "#B8860B",
  atencaoSuave: "#FBF3DF",
  critico: "#B3261E",
  criticoSuave: "#FBE9E7",
};

// Intervalos de referência geral. Não substituem o manual do fabricante.
const PLANO = [
  { tipo: "Troca de óleo", km: 10000, meses: 12, faixa: "R$ 150 – 350" },
  { tipo: "Filtro de ar", km: 20000, meses: 24, faixa: "R$ 60 – 150" },
  { tipo: "Rodízio de pneus", km: 10000, meses: 12, faixa: "R$ 40 – 100" },
  { tipo: "Pastilhas de freio", km: 30000, meses: 36, faixa: "R$ 250 – 600" },
  { tipo: "Revisão geral", km: 20000, meses: 12, faixa: "R$ 400 – 900" },
];

const EMERGENCIAS = [
  {
    id: "superaquecimento",
    titulo: "Motor superaqueceu",
    icone: "thermometer-alert" as const,
    passos: [
      "Desligue o ar-condicionado e ligue o aquecedor no máximo — ajuda a puxar calor do motor.",
      "Pare em local seguro assim que possível e desligue o motor.",
      "Não abra o radiador quente: o vapor sob pressão causa queimaduras graves.",
      "Espere o motor esfriar por pelo menos 30 minutos antes de verificar o nível de água.",
    ],
    categoria: "Mecanica leve",
  },
  {
    id: "nao-liga",
    titulo: "O carro não liga",
    icone: "car-battery" as const,
    passos: [
      "Verifique se os faróis acendem com força: luz fraca indica bateria descarregada.",
      "Confirme se o câmbio está em P ou N (automático) ou o pedal da embreagem pressionado.",
      "Se ouvir estalos rápidos ao girar a chave, provavelmente é a bateria.",
      "Se o motor gira mas não pega, pode ser combustível ou ignição — peça ajuda.",
    ],
    categoria: "Bateria",
  },
  {
    id: "pneu",
    titulo: "Pneu furou na estrada",
    icone: "car-tire-alert" as const,
    passos: [
      "Segure o volante firme, tire o pé do acelerador e não freie bruscamente.",
      "Sinalize e pare o mais longe possível da pista, em terreno plano.",
      "Coloque o triângulo a cerca de 30 passos atrás do veículo.",
      "Saia do carro pelo lado oposto ao tráfego e aguarde atrás da proteção.",
    ],
    categoria: "Pneu",
  },
  {
    id: "colisao",
    titulo: "Me envolvi em uma colisão",
    icone: "car-emergency" as const,
    passos: [
      "Verifique se há feridos. Havendo, chame o SAMU (192) antes de qualquer coisa.",
      "Sinalize a via e ligue o pisca-alerta.",
      "Sem feridos e com os veículos em condições, retire-os da pista.",
      "Registre fotos, dados dos envolvidos e acione o seguro.",
    ],
    categoria: "Reboque",
  },
];

function statusDoItem(
  item: (typeof PLANO)[number],
  kmAtual: number,
  manutencoes: Manutencao[],
) {
  const ultima = manutencoes.find((m) => m.tipo === item.tipo);

  if (!ultima) {
    return { nivel: "desconhecido" as const, texto: "Sem registro" };
  }

  const kmRodados = kmAtual - (ultima.km_na_execucao ?? kmAtual);
  const restante = item.km - kmRodados;

  if (restante <= 0) {
    return {
      nivel: "critico" as const,
      texto: `Vencido há ${Math.abs(restante).toLocaleString("pt-BR")} km`,
    };
  }
  if (restante <= item.km * 0.15) {
    return {
      nivel: "atencao" as const,
      texto: `Faltam ${restante.toLocaleString("pt-BR")} km`,
    };
  }
  return {
    nivel: "ok" as const,
    texto: `Faltam ${restante.toLocaleString("pt-BR")} km`,
  };
}

const ESTILO_NIVEL = {
  ok: { fundo: CORES.okSuave, cor: CORES.ok, icone: "check-circle" as const },
  atencao: {
    fundo: CORES.atencaoSuave,
    cor: CORES.atencao,
    icone: "clock-alert" as const,
  },
  critico: {
    fundo: CORES.criticoSuave,
    cor: CORES.critico,
    icone: "alert-circle" as const,
  },
  desconhecido: {
    fundo: "#EFEDE8",
    cor: CORES.textoSuave,
    icone: "help-circle" as const,
  },
};

export default function PerfilVeiculo() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();

  const [veiculo, setVeiculo] = useState<VeiculoDetalhado | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [modalKm, setModalKm] = useState(false);
  const [novoKm, setNovoKm] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erroKm, setErroKm] = useState<string | null>(null);
  const [aberto, setAberto] = useState<string | null>(null);

  useEffect(() => {
    carregar();
  }, [params.id]);

  async function carregar() {
    try {
      setCarregando(true);
      setErro(null);

      let id = params.id ? Number(params.id) : null;
      if (!id) {
        const lista = await listarVeiculos(CLIENTE_ID);
        if (lista.length === 0) {
          setVeiculo(null);
          setCarregando(false);
          return;
        }
        id = lista[0].id;
      }

      setVeiculo(await obterVeiculo(id));
    } catch (e) {
      setErro(
        e instanceof ApiError ? e.message : "Não foi possível carregar o veículo.",
      );
    } finally {
      setCarregando(false);
    }
  }

  async function salvarKm() {
    const km = Number(novoKm.replace(/\D/g, ""));
    if (!km) {
      setErroKm("Informe a quilometragem.");
      return;
    }

    setSalvando(true);
    setErroKm(null);
    try {
      await atualizarQuilometragem(veiculo!.id, km);
      setModalKm(false);
      setNovoKm("");
      await carregar();
    } catch (e) {
      setErroKm(
        e instanceof ApiError ? e.message : "Não foi possível atualizar.",
      );
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" color={CORES.destaque} />
      </View>
    );
  }

  if (erro) {
    return (
      <View style={styles.centro}>
        <MaterialCommunityIcons
          name="wifi-off"
          size={32}
          color={CORES.textoSuave}
        />
        <Text style={styles.textoVazio}>{erro}</Text>
        <TouchableOpacity style={styles.botaoPrimario} onPress={carregar}>
          <Text style={styles.botaoPrimarioTexto}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!veiculo) {
    return (
      <View style={styles.centro}>
        <MaterialCommunityIcons
          name="car-off"
          size={36}
          color={CORES.textoSuave}
        />
        <Text style={styles.tituloVazio}>Nenhum veículo cadastrado</Text>
        <Text style={styles.textoVazio}>
          Cadastre seu veículo para acompanhar manutenções e histórico.
        </Text>
        <TouchableOpacity
          style={styles.botaoPrimario}
          onPress={() => router.push("/cadastrar-veiculo")}
        >
          <Text style={styles.botaoPrimarioTexto}>Cadastrar veículo</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const kmFormatado = veiculo.km_atual.toLocaleString("pt-BR");
  const proximos = PLANO.map((item) => ({
    item,
    status: statusDoItem(item, veiculo.km_atual, veiculo.manutencoes),
  }));
  const pendentes = proximos.filter(
    (p) => p.status.nivel === "critico" || p.status.nivel === "atencao",
  );

  return (
    <ScrollView style={styles.tela} contentContainerStyle={styles.scroll}>
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
          <Text style={styles.topoTitulo}>Meu veículo</Text>
          <View style={styles.voltar} />
        </View>

        <View style={styles.cartaoVeiculo}>
          <View style={styles.veiculoIcone}>
            <MaterialCommunityIcons name="car" size={30} color={CORES.destaque} />
          </View>
          <Text style={styles.veiculoModelo}>
            {veiculo.marca ? `${veiculo.marca} ` : ""}
            {veiculo.modelo}
          </Text>
          <Text style={styles.veiculoInfo}>
            {[veiculo.ano, veiculo.cor].filter(Boolean).join(" • ")}
          </Text>
          {veiculo.placa ? (
            <View style={styles.placa}>
              <Text style={styles.placaTexto}>{veiculo.placa}</Text>
            </View>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.cartaoKm}
          onPress={() => {
            setNovoKm(String(veiculo.km_atual));
            setErroKm(null);
            setModalKm(true);
          }}
        >
          <View style={styles.kmEsquerda}>
            <Text style={styles.kmRotulo}>Quilometragem atual</Text>
            <Text style={styles.kmValor}>{kmFormatado} km</Text>
          </View>
          <View style={styles.kmBotao}>
            <MaterialCommunityIcons name="pencil" size={18} color="#FFF" />
          </View>
        </TouchableOpacity>

        {pendentes.length > 0 && (
          <View style={styles.avisoCaixa}>
            <MaterialCommunityIcons
              name="wrench-clock"
              size={20}
              color={CORES.destaque}
            />
            <Text style={styles.avisoTexto}>
              {pendentes.length === 1
                ? "1 item precisa de atenção"
                : `${pendentes.length} itens precisam de atenção`}
            </Text>
          </View>
        )}

        <Text style={styles.secao}>Plano de manutenção</Text>
        <View style={styles.lista}>
          {proximos.map(({ item, status }) => {
            const estilo = ESTILO_NIVEL[status.nivel];
            return (
              <View key={item.tipo} style={styles.linhaManutencao}>
                <View
                  style={[styles.linhaIcone, { backgroundColor: estilo.fundo }]}
                >
                  <MaterialCommunityIcons
                    name={estilo.icone}
                    size={20}
                    color={estilo.cor}
                  />
                </View>
                <View style={styles.linhaTextos}>
                  <Text style={styles.linhaTitulo}>{item.tipo}</Text>
                  <Text style={[styles.linhaStatus, { color: estilo.cor }]}>
                    {status.texto}
                  </Text>
                </View>
                <Text style={styles.linhaFaixa}>{item.faixa}</Text>
              </View>
            );
          })}
        </View>
        <Text style={styles.nota}>
          Intervalos e valores são referência geral. Confirme no manual do seu
          veículo e com o prestador.
        </Text>

        <Text style={styles.secao}>Histórico de serviços</Text>
        {veiculo.manutencoes.length === 0 ? (
          <View style={styles.cartaoSimples}>
            <Text style={styles.textoVazio}>
              Nenhum serviço registrado ainda. Os atendimentos feitos pelo Örtöö
              aparecem aqui automaticamente.
            </Text>
          </View>
        ) : (
          <View style={styles.lista}>
            {veiculo.manutencoes.map((m) => (
              <View key={m.id} style={styles.linhaHistorico}>
                <View style={styles.linhaTextos}>
                  <Text style={styles.linhaTitulo}>{m.tipo}</Text>
                  <Text style={styles.linhaSub}>
                    {new Date(m.executado_em).toLocaleDateString("pt-BR")}
                    {m.km_na_execucao
                      ? ` • ${m.km_na_execucao.toLocaleString("pt-BR")} km`
                      : ""}
                  </Text>
                </View>
                {m.custo ? (
                  <Text style={styles.custo}>
                    R$ {Number(m.custo).toFixed(2).replace(".", ",")}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        )}

        <Text style={styles.secao}>O que fazer se…</Text>
        <View style={styles.lista}>
          {EMERGENCIAS.map((emergencia) => {
            const expandido = aberto === emergencia.id;
            return (
              <View key={emergencia.id} style={styles.cartaoEmergencia}>
                <TouchableOpacity
                  style={styles.emergenciaTopo}
                  onPress={() => setAberto(expandido ? null : emergencia.id)}
                >
                  <View style={styles.emergenciaIcone}>
                    <MaterialCommunityIcons
                      name={emergencia.icone}
                      size={20}
                      color={CORES.destaque}
                    />
                  </View>
                  <Text style={styles.emergenciaTitulo}>
                    {emergencia.titulo}
                  </Text>
                  <MaterialCommunityIcons
                    name={expandido ? "chevron-up" : "chevron-down"}
                    size={22}
                    color={CORES.textoSuave}
                  />
                </TouchableOpacity>

                {expandido && (
                  <View style={styles.emergenciaCorpo}>
                    {emergencia.passos.map((passo, i) => (
                      <View key={i} style={styles.passo}>
                        <Text style={styles.passoNumero}>{i + 1}</Text>
                        <Text style={styles.passoTexto}>{passo}</Text>
                      </View>
                    ))}
                    <TouchableOpacity
                      style={styles.botaoAjuda}
                      onPress={() =>
                        router.push({
                          pathname: "/solicitar-assistencia",
                          params: { categoriaNome: emergencia.categoria },
                        })
                      }
                    >
                      <Text style={styles.botaoAjudaTexto}>
                        Pedir ajuda para isso
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>

      <Modal visible={modalKm} transparent animationType="fade">
        <View style={styles.modalFundo}>
          <View style={styles.modalCaixa}>
            <Text style={styles.modalTitulo}>Atualizar quilometragem</Text>
            <TextInput
              style={styles.modalInput}
              value={novoKm}
              onChangeText={setNovoKm}
              keyboardType="numeric"
              placeholder="Ex.: 78500"
              placeholderTextColor={CORES.textoSuave}
            />
            {erroKm ? <Text style={styles.modalErro}>{erroKm}</Text> : null}
            <View style={styles.modalBotoes}>
              <TouchableOpacity
                style={styles.modalCancelar}
                onPress={() => setModalKm(false)}
              >
                <Text style={styles.modalCancelarTexto}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.botaoPrimario, salvando && { opacity: 0.6 }]}
                onPress={salvarKm}
                disabled={salvando}
              >
                <Text style={styles.botaoPrimarioTexto}>
                  {salvando ? "Salvando..." : "Salvar"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  centro: {
    flex: 1,
    backgroundColor: CORES.fundo,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 10,
  },

  topo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  voltar: { width: 32 },
  topoTitulo: { fontSize: 16, fontWeight: "700", color: CORES.primaria },

  cartaoVeiculo: {
    backgroundColor: CORES.cartao,
    borderRadius: 16,
    padding: 22,
    alignItems: "center",
    marginBottom: 14,
    ...sombra,
  },
  veiculoIcone: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: CORES.destaqueSuave,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  veiculoModelo: { fontSize: 19, fontWeight: "700", color: CORES.texto },
  veiculoInfo: { fontSize: 13, color: CORES.textoSuave, marginTop: 3 },
  placa: {
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: CORES.primaria,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  placaTexto: {
    fontSize: 15,
    fontWeight: "700",
    color: CORES.primaria,
    letterSpacing: 2,
  },

  cartaoKm: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CORES.cartao,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    ...sombra,
  },
  kmEsquerda: { flex: 1 },
  kmRotulo: { fontSize: 12, color: CORES.textoSuave },
  kmValor: {
    fontSize: 22,
    fontWeight: "700",
    color: CORES.texto,
    marginTop: 2,
  },
  kmBotao: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: CORES.destaque,
    alignItems: "center",
    justifyContent: "center",
  },

  avisoCaixa: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: CORES.destaqueSuave,
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
  },
  avisoTexto: { fontSize: 13.5, color: CORES.destaque, fontWeight: "600" },

  secao: {
    fontSize: 13,
    fontWeight: "700",
    color: CORES.textoSuave,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 12,
    marginBottom: 12,
  },

  lista: { gap: 10 },
  linhaManutencao: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CORES.cartao,
    borderRadius: 12,
    padding: 13,
    ...sombra,
  },
  linhaIcone: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  linhaTextos: { flex: 1 },
  linhaTitulo: { fontSize: 14.5, fontWeight: "600", color: CORES.texto },
  linhaStatus: { fontSize: 12.5, marginTop: 2, fontWeight: "500" },
  linhaSub: { fontSize: 12.5, color: CORES.textoSuave, marginTop: 2 },
  linhaFaixa: { fontSize: 12, color: CORES.textoSuave },

  linhaHistorico: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CORES.cartao,
    borderRadius: 12,
    padding: 13,
    ...sombra,
  },
  custo: { fontSize: 14, fontWeight: "600", color: CORES.texto },

  nota: {
    fontSize: 11.5,
    color: CORES.textoSuave,
    marginTop: 10,
    lineHeight: 16,
    fontStyle: "italic",
  },

  cartaoSimples: {
    backgroundColor: CORES.cartao,
    borderRadius: 12,
    padding: 18,
    ...sombra,
  },

  cartaoEmergencia: {
    backgroundColor: CORES.cartao,
    borderRadius: 12,
    overflow: "hidden",
    ...sombra,
  },
  emergenciaTopo: {
    flexDirection: "row",
    alignItems: "center",
    padding: 13,
  },
  emergenciaIcone: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: CORES.destaqueSuave,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  emergenciaTitulo: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: "600",
    color: CORES.texto,
  },
  emergenciaCorpo: {
    paddingHorizontal: 13,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: CORES.borda,
    paddingTop: 12,
    gap: 10,
  },
  passo: { flexDirection: "row", gap: 10 },
  passoNumero: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: CORES.destaqueSuave,
    color: CORES.destaque,
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 20,
  },
  passoTexto: {
    flex: 1,
    fontSize: 13,
    color: CORES.texto,
    lineHeight: 19,
  },
  botaoAjuda: {
    marginTop: 4,
    backgroundColor: CORES.destaque,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
  },
  botaoAjudaTexto: { color: "#FFF", fontWeight: "600", fontSize: 13.5 },

  tituloVazio: { fontSize: 17, fontWeight: "700", color: CORES.texto },
  textoVazio: {
    fontSize: 13.5,
    color: CORES.textoSuave,
    textAlign: "center",
    lineHeight: 20,
  },
  botaoPrimario: {
    backgroundColor: CORES.destaque,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 8,
  },
  botaoPrimarioTexto: { color: "#FFF", fontWeight: "600", fontSize: 14 },

  modalFundo: {
    flex: 1,
    backgroundColor: "rgba(31,49,64,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCaixa: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: CORES.cartao,
    borderRadius: 16,
    padding: 22,
  },
  modalTitulo: {
    fontSize: 17,
    fontWeight: "700",
    color: CORES.texto,
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: CORES.borda,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 16,
    color: CORES.texto,
  },
  modalErro: { color: CORES.critico, fontSize: 12.5, marginTop: 8 },
  modalBotoes: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 10,
    marginTop: 18,
  },
  modalCancelar: { paddingVertical: 12, paddingHorizontal: 16 },
  modalCancelarTexto: { color: CORES.textoSuave, fontWeight: "600" },
});
