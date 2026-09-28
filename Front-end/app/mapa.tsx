import * as Location from "expo-location";
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MapaTempoReal from "../components/(componentes-mapas)/MapaTempoReal";
import { ShowAlert } from "@/components/alert";

interface Prestador {
  prestador_id: number;
  nome: string;
  telefone: string;
  nome_fantasia: string;
  latitude_atual: number | string | null;
  longitude_atual: number | string | null;
  preco_base: number;
}

interface Cartao {
  id: number;
  bandeira: string | null;
  ultimos_digitos: string;
  validade_mes: number | null;
  validade_ano: number | null;
  apelido: string | null;
  principal: boolean | number;
}

// TODO: substituir pelo ID do usuário logado na sessão real
const CLIENTE_ID = 1;
const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.100:3000/api"; // coloquei como global para todos acessarem

export default function TelaMapa() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { categoria_id } = useLocalSearchParams<{ categoria_id: string }>();

  const [clienteCoords, setClienteCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [erroGps, setErroGps] = useState<string | null>(null);

  const [solicitacaoId, setSolicitacaoId] = useState<number | null>(null);
  const [prestadores, setPrestadores] = useState<Prestador[]>([]);
  const [carregandoPrestadores, setCarregandoPrestadores] = useState(true);
  const [prestadorSelecionado, setPrestadorSelecionado] = useState<Prestador | null>(null);

  // CANCELAMENTO AUTOMÁTICO AO SAIR DO MAPA
  useFocusEffect(
    useCallback(() => {
      return () => {
        const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.100:3000/api";

        fetch(`${API_URL}/solicitacoes/cancelar`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ cliente_id: CLIENTE_ID }),
        }).catch((err) => console.error("Erro ao cancelar solicitação ao sair do mapa:", err));
      };
    }, [])
  );

  // 1. Monitoramento do GPS do Cliente
  useEffect(() => {
    let inscricaoGPS: Location.LocationSubscription | null = null;

    async function iniciarMonitoramentoGPS() {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setErroGps("Permissão de localização negada.");
        return;
      }

      inscricaoGPS = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 3000,
          distanceInterval: 5,
        },
        (location) => {
          setClienteCoords({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        }
      );
    }

    iniciarMonitoramentoGPS();

    return () => {
      if (inscricaoGPS) {
        inscricaoGPS.remove();
      }
    };
  }, []);

  // 2. Busca Prestadores no Backend
  useEffect(() => {
    async function buscarPrestadores() {
      if (!categoria_id) {
        setCarregandoPrestadores(false);
        return;
      }

      try {
        setCarregandoPrestadores(true);
        const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.100:3000/api";
        const response = await fetch(`${API_URL}/prestadores/categoria/${categoria_id}`);
        const data = await response.json();

        if (response.ok) {
          setPrestadores(data);
          if (data.length > 0) {
            setPrestadorSelecionado(data[0]);
          }
        } else {
          Alert.alert("Erro", data.erro || "Falha ao buscar prestadores disponíveis.");
        }
      } catch (error) {
        console.error("Erro ao buscar prestadores:", error);
      } finally {
        setCarregandoPrestadores(false);
      }
    }

    buscarPrestadores();
  }, [categoria_id]);

  // MEMOIZAÇÃO DA LOCALIZAÇÃO DO MECÂNICO
  const mecanicoLocation = useMemo(() => {
    if (!prestadorSelecionado) return null;

    const lat = Number(prestadorSelecionado.latitude_atual);
    const lng = Number(prestadorSelecionado.longitude_atual);

    if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
      return null;
    }

    return {
      latitude: lat,
      longitude: lng,
      heading: 0,
    };
  }, [prestadorSelecionado?.latitude_atual, prestadorSelecionado?.longitude_atual]);

  // Configurando a tela de pagamentos
  const [cartoes, setCartoes] = useState<Cartao[]>([]);
  const [carregandoCartoes, setCarregandoCartoes] = useState(false);
  const [mostrarPagamentos, setMostrarPagamentos] = useState(false);
  const [barraPagamento] = useState(() => new Animated.Value(260));
  const [processandoPagamento, setProcessandoPagamento] = useState(false);

  useEffect(() => {
    Animated.spring(barraPagamento, {
      toValue: mostrarPagamentos ? 0 : 260,
      damping: 18,
      stiffness: 160,
      mass: 0.8,
      useNativeDriver: true,
    }).start();
  }, [barraPagamento, mostrarPagamentos]);

  // Lógica para listar todos os cartões do usuário
  useEffect(() => {
    async function buscarCartoes() {
      try {
        setCarregandoCartoes(true);
        const response = await fetch(`${API_URL}/pagamento/${CLIENTE_ID}/cartoes`);
        const data = await response.json(); 

        if (!response.ok) {
          throw new Error(data.erro || "Falha ao buscar cartões salvos.");
        }

        setCartoes(data);
      } catch (error) {
        console.error("Erro ao buscar cartões:", error);
      } finally {
        setCarregandoCartoes(false);
      }
    }

    buscarCartoes();
  }, []);

  async function realizarPagamento(solicitacaoId: number) {
    const response = await fetch(`${API_URL}/pagamento/cobrar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transacao_id: solicitacaoId }),
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.erro || "Não foi possível realizar o pagamento.");
    }
  }

  async function processarPagamento() {
    if (!solicitacaoId) {
      ShowAlert("Erro", "Crie uma solicitação antes de pagar.");
      return;
    }

    setProcessandoPagamento(true);

    try {
      const response = await fetch(`${API_URL}/pagamento/transacoes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ solicitacao_id: solicitacaoId }),
      });
      const transacao = await response.json();

      if (!response.ok) {
        throw new Error(transacao.erro || "Não foi possível criar a transação.");
      }

      await realizarPagamento(transacao.id);
      setMostrarPagamentos(false);
      Alert.alert("Sucesso", "Pagamento realizado com sucesso!");
    } catch (error) {
      Alert.alert("Erro no pagamento", error instanceof Error ? error.message : "Tente novamente.");
    } finally {
      setProcessandoPagamento(false);
    }
  }

  if (!clienteCoords && !erroGps) {
    return (
      <View style={styles.carregandoContainer}>
        {/* Desativa o cabeçalho mesmo na tela de carregamento */}
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color="#fcf7f7" />
        <Text style={styles.textoCarregando}>Obtendo sua localização...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* DESATIVA COMPLETAMENTE O CABEÇALHO NATIVO */}
      <Stack.Screen options={{ headerShown: false }} />

      {/* MAPA EM SEGUNDO PLANO */}
      <View style={StyleSheet.absoluteFillObject}>
        {clienteCoords && (
          <MapaTempoReal
            clienteLocation={clienteCoords}
            mecanicoLocation={mecanicoLocation}
          />
        )}
      </View>

      {/* CAMADA FLUTUANTE */}
      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        <TouchableOpacity
          style={[styles.botaoVoltar, { marginTop: insets.top + 10 }]}
          onPress={() => router.back()}
        >
          <Text style={styles.voltarTexto}>{"<"} Voltar</Text>
        </TouchableOpacity>

        <View style={[styles.painelInferior, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Text style={styles.tituloPainel}>Empresas Disponíveis</Text>

          {carregandoPrestadores ? (
            <ActivityIndicator size="small" color="#ffffff" style={{ marginVertical: 20 }} />
          ) : prestadores.length === 0 ? (
            <Text style={styles.textoVazio}>Nenhuma empresa disponível para este serviço no momento.</Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.listaHorizontal}
            >
              {prestadores.map((item) => {
                const isSelected = prestadorSelecionado?.prestador_id === item.prestador_id;

                return (
                  <View
                    key={item.prestador_id}
                    style={[
                      styles.cardMecanico,
                      isSelected && styles.cardSelecionado,
                    ]}
                  >
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => setPrestadorSelecionado(item)}
                    >
                      <Text style={styles.nomeMecanico}>{item.nome_fantasia || item.nome}</Text>
                      <Text style={styles.infoMecanico}>
                        R$ {Number(item.preco_base).toFixed(2)}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.botaoChamar}
                      onPress={() => setPrestadorSelecionado(item)}
                      disabled={processandoPagamento}
                    >
                      <Text style={styles.textoBotao}>Chamar</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>
      </SafeAreaView>

      {mostrarPagamentos && (
        <Animated.View
          style={[styles.barraPagamento, { transform: [{ translateY: barraPagamento }] }]}
        >
          <View style={styles.cabecalhoPagamento}>
            <Text style={styles.tituloPagamento}>Escolha a forma de pagamento</Text>
            <TouchableOpacity
              accessibilityLabel="Fechar formas de pagamento"
              onPress={() => setMostrarPagamentos(false)}
              style={styles.botaoFechar}
            >
              <Text style={styles.textoFechar}>X</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.opcoesPagamento}>
            <TouchableOpacity
              style={styles.opcaoPagamento}
              onPress={processarPagamento}
              disabled={processandoPagamento}
            >
              {processandoPagamento ? (
                <ActivityIndicator size="small" color="#38bdf8" />
              ) : (
                <>
                  <Text style={styles.iconePagamento}>PIX</Text>
                  <Text style={styles.textoOpcaoPagamento}>Pix</Text>
                </>
              )}
            </TouchableOpacity>

            {carregandoCartoes ? (
              <View style={styles.opcaoPagamento}>
                <ActivityIndicator size="small" color="#38bdf8" />
                <Text style={styles.textoOpcaoPagamento}>Cartões</Text>
              </View>
            ) : (
              cartoes.map((cartao) => (
                <TouchableOpacity
                  key={cartao.id}
                  style={styles.opcaoPagamento}
                  onPress={processarPagamento}
                  disabled={processandoPagamento}
                >
                  <Text style={styles.textoOpcaoPagamento}>
                    {cartao.apelido || `•••• ${cartao.ultimos_digitos}`}
                  </Text>
                </TouchableOpacity>
              ))
            )}

            <TouchableOpacity
              style={styles.opcaoPagamento}
              onPress={processarPagamento}
              disabled={processandoPagamento}
            >
              <Text style={styles.iconePagamento}>R$</Text>
              <Text style={styles.textoOpcaoPagamento}>Dinheiro</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  carregandoContainer: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
  },
  textoCarregando: { color: "#fff", marginTop: 12, fontSize: 14 },
  overlay: { flex: 1, justifyContent: "space-between" },
  botaoVoltar: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(5, 5, 5, 0.9)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginLeft: 16,
    elevation: 4,
  },
  voltarTexto: { color: "#ffffff", fontWeight: "600", fontSize: 14 },
  painelInferior: { paddingVertical: 16 },
  tituloPainel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
    marginLeft: 16,
    marginBottom: 12,
  },
  textoVazio: {
    color: "#9ca3af",
    marginLeft: 16,
    fontSize: 14,
  },
  listaHorizontal: { paddingHorizontal: 16, gap: 12 },
  cardMecanico: {
    width: 220,
    backgroundColor: "#080808",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "transparent",
  },
  cardSelecionado: {
    borderColor: "#2563eb",
    backgroundColor: "#111827",
  },
  nomeMecanico: { fontSize: 15, fontWeight: "bold", color: "#ffffff" },
  infoMecanico: { fontSize: 13, color: "#38bdf8", marginTop: 4, marginBottom: 12 },
  botaoChamar: {
    backgroundColor: "#2563eb",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  textoBotao: { color: "#fff", fontWeight: "600", fontSize: 13 },
  barraPagamento: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#111827",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  cabecalhoPagamento: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  tituloPagamento: { color: "#fff", fontSize: 16, fontWeight: "700" },
  botaoFechar: { padding: 4 },
  textoFechar: { color: "#9ca3af", fontSize: 16, fontWeight: "700" },
  opcoesPagamento: { flexDirection: "row", gap: 10 },
  opcaoPagamento: {
    flex: 1,
    minHeight: 76,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1f2937",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#374151",
  },
  iconePagamento: { color: "#38bdf8", fontSize: 14, fontWeight: "800", marginBottom: 6 },
  textoOpcaoPagamento: { color: "#fff", fontSize: 13, fontWeight: "600" },
});