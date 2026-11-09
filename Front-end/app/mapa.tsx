import * as Location from "expo-location";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  BackHandler,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { ShowAlert } from "@/components/alert";
import MapaTempoReal from "../components/(componentes-mapas)/MapaTempoReal";

// Importações centralizadas do arquivo de serviços
import {
  cancelarSolicitacao,
  CartaoUsuario,
  criarSolicitacao,
  listarCartoes,
  Prestador,
} from "../src/services/api";
import { Cores, useEstilos, useTema } from "../src/tema";

// TODO: substituir pelo ID do usuário logado na sessão real
const CLIENTE_ID = 1;
const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.100:3000/api";

export default function TelaMapa() {
  const { cores: CORES } = useTema();
  const styles = useEstilos(criarEstilos);
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

  // 1. TRATAMENTO DO BOTÃO VOLTAR FÍSICO / GESTOS DO DISPOSITIVO
  useEffect(() => {
    const onBackPress = () => {
      if (solicitacaoId) {
        cancelarSolicitacao(solicitacaoId)
          .then(() => console.log("✅ Solicitação cancelada via botão voltar físico/gesto."))
          .catch((err) => console.error("Erro ao cancelar via botão físico:", err));
      }
      return false; // Permite que a navegação do sistema continue normalmente
    };

    const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => subscription.remove();
  }, [solicitacaoId]);

  // Função para ação do botão Voltar da interface (UI)
  const handleVoltar = async () => {
    if (solicitacaoId) {
      try {
        await cancelarSolicitacao(solicitacaoId);
        console.log("✅ Solicitação cancelada com sucesso antes de sair.");
      } catch (err) {
        console.error("Erro ao cancelar solicitação ao voltar:", err);
      } finally {
        setSolicitacaoId(null);
      }
    }
    router.back();
  };

  // 2. Monitoramento do GPS do Cliente
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

  // 4. Busca Prestadores no Backend
  useEffect(() => {
    async function buscarPrestadores() {
      if (!categoria_id) {
        setCarregandoPrestadores(false);
        return;
      }

      try {
        setCarregandoPrestadores(true);
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
      headin: 0,
    };
  }, [prestadorSelecionado?.latitude_atual, prestadorSelecionado?.longitude_atual]);

  // Configurando a tela de pagamentos
  const [cartoes, setCartoes] = useState<CartaoUsuario[]>([]);
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

  // Lógica para listar todos os cartões do usuário usando o api.ts
  useEffect(() => {
    async function buscarCartoes() {
      try {
        setCarregandoCartoes(true);
        const data = await listarCartoes(CLIENTE_ID);
        setCartoes(data);
      } catch (error) {
        console.error("Erro ao buscar cartões:", error);
      } finally {
        setCarregandoCartoes(false);
      }
    }

    buscarCartoes();
  }, []);

  // Envia a cobrança incluindo o método de pagamento selecionado
  async function realizarPagamento(transacaoId: number, metodo: string) {
    const response = await fetch(`${API_URL}/pagamento/cobrar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transacao_id: transacaoId,
        metodo_pagamento: metodo,
      }),
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.erro || "Não foi possível realizar o pagamento.");
    }
  }

  // Função disparada ao clicar no botão 'Chamar'
async function handleChamarPrestador(item: Prestador) {
  const prestadorId = item.id || (item as any).prestador_id;
  console.log("👉 Botão Chamar clicado para o prestador:", prestadorId);

  setPrestadorSelecionado(item);

  if (!clienteCoords) {
    ShowAlert("Atenção", "Obtendo localização do GPS...");
    return;
  }

  try {
    // 1. Tenta criar uma nova solicitação no backend
    const novaSolicitacao = await criarSolicitacao({
      prestador_id: Number(prestadorId),
      categoria_id: Number(categoria_id) || 1,
      latitude_origem: clienteCoords.latitude,
      longitude_origem: clienteCoords.longitude,
      descricao_problema: "Solicitação via Mapa",
    });

    if (novaSolicitacao?.id) {
      console.log("✅ Nova solicitação criada com sucesso! ID:", novaSolicitacao.id);
      
      // Atualiza o estado React
      setSolicitacaoId(novaSolicitacao.id);
      
      // Abre a barra de pagamentos
      setMostrarPagamentos(true);
    } else {
      Alert.alert("Erro", "O servidor criou o chamado mas não retornou a ID da solicitação.");
    }
  } catch (error: any) {
    Alert.alert(
      "Erro",
      error?.message || "Não foi possível processar a solicitação."
    );
  }
}

async function processarPagamento(metodo: "PIX" | "DINHEIRO" | "CARTAO" = "PIX") {
  const idParaPagar = solicitacaoId;

  if (!idParaPagar) {
    Alert.alert("Atenção", "Solicitação não encontrada. Por favor, clique em 'Chamar' novamente.");
    return;
  }

  setProcessandoPagamento(true);

  try {
    console.log(`💳 Enviando transação para a solicitação ID: ${idParaPagar} via ${metodo}`);

    const response = await fetch(`${API_URL}/pagamento/transacoes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        solicitacao_id: idParaPagar,
        usuario_id: CLIENTE_ID,
      }),
    });

    const transacao = await response.json();

    if (!response.ok) {
      throw new Error(transacao.erro || "Não foi possível criar a transação no servidor.");
    }

    // Processa a cobrança
    await realizarPagamento(transacao.id, metodo);

    // Salva os dados do prestador antes de resetar o estado local
    const nomeVendedor =
      prestadorSelecionado?.nome_fantasia ||
      (prestadorSelecionado as any)?.nome ||
      `Prestador #${prestadorSelecionado?.id}`;

    setMostrarPagamentos(false);
    setSolicitacaoId(null);

    // Exibe o alerta de sucesso e redireciona para o status do atendimento
    Alert.alert("Sucesso", "Pagamento realizado com sucesso!", [
      {
        text: "Acompanhar Atendimento",
        onPress: () => {
          router.push({
            pathname: "/status-atendimento",
            params: {
              solicitacaoId: String(idParaPagar),
              vendedor: nomeVendedor,
            },
          });
        },
      },
    ]);
  } catch (error) {
    Alert.alert(
      "Erro no pagamento",
      error instanceof Error ? error.message : "Tente novamente."
    );
  } finally {
    setProcessandoPagamento(false);
  }
}
  

  if (!clienteCoords && !erroGps) {
    return (
      <View style={styles.carregandoContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={CORES.destaque} />
        <Text style={styles.textoCarregando}>Obtendo sua localização...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
          onPress={handleVoltar}
        >
          <Text style={styles.voltarTexto}>{"<"} Voltar</Text>
        </TouchableOpacity>

        <View style={[styles.painelInferior, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Text style={styles.tituloPainel}>Empresas Disponíveis</Text>

          {carregandoPrestadores ? (
            <ActivityIndicator size="small" color={CORES.destaque} style={{ marginVertical: 20 }} />
          ) : prestadores.length === 0 ? (
            <Text style={styles.textoVazio}>Nenhuma empresa disponível para este serviço no momento.</Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.listaHorizontal}
            >
              {prestadores.map((item, index) => {
                const itemId = item.id || (item as any).prestador_id || index;
                const isSelected =
                  prestadorSelecionado?.id === item.id ||
                  (prestadorSelecionado as any)?.prestador_id === itemId;

                return (
                  <View
                    key={`prestador-${itemId}`}
                    style={[
                      styles.cardMecanico,
                      isSelected && styles.cardSelecionado,
                    ]}
                  >
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => setPrestadorSelecionado(item)}
                    >
                      <Text style={styles.nomeMecanico}>
                        {item.nome_fantasia || (item as any).nome || `Prestador #${itemId}`}
                      </Text>
                      <Text style={styles.infoMecanico}>
                        {item.raio_atendimento_km
                          ? `Raio: ${item.raio_atendimento_km} km`
                          : `R$ ${Number((item as any).preco_base || 0).toFixed(2)}`}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.botaoChamar}
                      onPress={() => handleChamarPrestador(item)}
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

      {/* BARRA DE PAGAMENTO */}
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
            {/* Opção PIX */}
            <TouchableOpacity
              style={styles.opcaoPagamento}
              onPress={() => processarPagamento("PIX")}
              disabled={processandoPagamento}
            >
              {processandoPagamento ? (
                <ActivityIndicator size="small" color={CORES.destaque} />
              ) : (
                <>
                  <Text style={styles.iconePagamento}>PIX</Text>
                  <Text style={styles.textoOpcaoPagamento}>Pix</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Opção Cartões de Crédito */}
            {carregandoCartoes ? (
              <View style={styles.opcaoPagamento}>
                <ActivityIndicator size="small" color={CORES.destaque} />
                <Text style={styles.textoOpcaoPagamento}>Cartões</Text>
              </View>
            ) : (
              cartoes.map((cartao, index) => (
                <TouchableOpacity
                  key={`cartao-${cartao.id || index}`}
                  style={styles.opcaoPagamento}
                  onPress={() => processarPagamento("CARTAO")}
                  disabled={processandoPagamento}
                >
                  <Text style={styles.textoOpcaoPagamento}>
                    {cartao.apelido || `•••• ${cartao.ultimos_digitos}`}
                  </Text>
                </TouchableOpacity>
              ))
            )}

            {/* Opção Dinheiro */}
            <TouchableOpacity
              style={styles.opcaoPagamento}
              onPress={() => processarPagamento("DINHEIRO")}
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

const criarEstilos = (CORES: Cores) =>
  StyleSheet.create({
  container: { flex: 1, backgroundColor: CORES.fundo },
  carregandoContainer: {
    flex: 1,
    backgroundColor: CORES.fundo,
    justifyContent: "center",
    alignItems: "center",
  },
  textoCarregando: { color: CORES.texto, marginTop: 12, fontSize: 14 },
  overlay: { flex: 1, justifyContent: "space-between" },
  botaoVoltar: {
    alignSelf: "flex-start",
    backgroundColor: CORES.cartao,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginLeft: 16,
    elevation: 4,
  },
  voltarTexto: { color: CORES.texto, fontWeight: "600", fontSize: 14 },
  painelInferior: { paddingVertical: 16 },
  tituloPainel: {
    fontSize: 16,
    fontWeight: "bold",
    color: CORES.texto,
    marginLeft: 16,
    marginBottom: 12,
  },
  textoVazio: {
    color: CORES.textoSuave,
    marginLeft: 16,
    fontSize: 14,
  },
  listaHorizontal: { paddingHorizontal: 16, gap: 12 },
  cardMecanico: {
    width: 220,
    backgroundColor: CORES.cartao,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "transparent",
  },
  cardSelecionado: {
    borderColor: CORES.primaria,
    backgroundColor: CORES.cartao,
  },
  nomeMecanico: { fontSize: 15, fontWeight: "bold", color: CORES.texto },
  infoMecanico: { fontSize: 13, color: CORES.destaque, marginTop: 4, marginBottom: 12 },
  botaoChamar: {
    backgroundColor: CORES.primaria,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  textoBotao: { color: CORES.sobrePrimaria, fontWeight: "600", fontSize: 13 },
  botaoChat: {
    borderWidth: 1,
    borderColor: CORES.primaria,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  textoBotaoChat: { color: CORES.destaque, fontWeight: "600", fontSize: 13 },
  barraPagamento: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: CORES.cartao,
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
  tituloPagamento: { color: CORES.texto, fontSize: 16, fontWeight: "700" },
  botaoFechar: { padding: 4 },
  textoFechar: { color: CORES.textoSuave, fontSize: 16, fontWeight: "700" },
  opcoesPagamento: { flexDirection: "row", gap: 10 },
  opcaoPagamento: {
    flex: 1,
    minHeight: 76,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: CORES.fundo,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CORES.borda,
  },
  iconePagamento: { color: CORES.destaque, fontSize: 14, fontWeight: "800", marginBottom: 6 },
  textoOpcaoPagamento: { color: CORES.texto, fontSize: 13, fontWeight: "600" },
});
