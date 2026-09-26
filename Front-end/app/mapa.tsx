import * as Location from "expo-location";
import { Stack, useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MapaTempoReal from "../components/(componentes-mapas)/MapaTempoReal";

interface Prestador {
  prestador_id: number;
  nome: string;
  telefone: string;
  nome_fantasia: string;
  latitude_atual: number | string | null;
  longitude_atual: number | string | null;
  preco_base: number;
}

// TODO: substituir pelo ID do usuário logado na sessão real
const CLIENTE_ID = 1;

export default function TelaMapa() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { categoria_id } = useLocalSearchParams<{ categoria_id: string }>();

  const [clienteCoords, setClienteCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [erroGps, setErroGps] = useState<string | null>(null);

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
                  <TouchableOpacity
                    key={item.prestador_id}
                    activeOpacity={0.8}
                    onPress={() => setPrestadorSelecionado(item)}
                    style={[
                      styles.cardMecanico,
                      isSelected && styles.cardSelecionado,
                    ]}
                  >
                    <Text style={styles.nomeMecanico}>{item.nome_fantasia || item.nome}</Text>
                    <Text style={styles.infoMecanico}>
                      R$ {Number(item.preco_base).toFixed(2)}
                    </Text>
                    <TouchableOpacity style={styles.botaoChamar}>
                      <Text style={styles.textoBotao}>Chamar</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>
      </SafeAreaView>
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
});