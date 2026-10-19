import React, { useState, useEffect } from "react"; // 1. Adicionado useEffect
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import * as Location from "expo-location"; // 2. Adicionado import do Location
import MapaTempoReal from "../../components/MapaTempoReal";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LOJAS_PARCEIRAS } from "../../src/lojas-parceiras";

export default function TelaMapa() {
  const router = useRouter();
  const insets = useSafeAreaInsets(); // Obtém os recuos das bordas da tela (top, bottom, etc.)

  const [clienteCoords, setClienteCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [erroGps, setErroGps] = useState<string | null>(null);

  const [mecanicoCoords] = useState({
    latitude: -10.184610182715296,
    longitude: -48.3329819766015,
    heading: 45,
  });

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

  // Tela de carregamento enquanto obtém as coordenadas do GPS
  if (!clienteCoords && !erroGps) {
    return (
      <View style={styles.carregandoContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
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
            mecanicoLocation={mecanicoCoords}
          />
        )}
      </View>

      {/* CAMADA FLUTUANTE POR CIMA DO MAPA */}
      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        <TouchableOpacity
          style={[styles.botaoVoltar, { marginTop: insets.top + 10 }]} // Ajusta topo para o Notch/Câmera
          onPress={() => router.back()}
        >
          <Text style={styles.voltarTexto}>{"<"} Voltar</Text>
        </TouchableOpacity>

        {/* Adicionado o paddingBottom usando a margem segura dos botões do celular */}
        <View style={[styles.painelInferior, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Text style={styles.tituloPainel}>Mecânicos Próximos</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listaHorizontal}
          >
            {LOJAS_PARCEIRAS.map((loja) => (
              <View key={loja.nome} style={styles.cardMecanico}>
                <Text style={styles.nomeMecanico}>{loja.nome}</Text>
                <Text style={styles.infoMecanico}>{loja.info}</Text>
                <TouchableOpacity
                  style={styles.botaoChamar}
                  onPress={() => router.push({ pathname: "/chat", params: { loja: loja.nome } })}
                >
                  <Text style={styles.textoBotao}>Conversar</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  carregandoContainer: {
    flex: 1,
    backgroundColor: "#111827",
    justifyContent: "center",
    alignItems: "center",
  },
  textoCarregando: {
    color: "#fff",
    marginTop: 12,
    fontSize: 14,
  },
  overlay: {
    flex: 1,
    justifyContent: "space-between",
  },
  botaoVoltar: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(5, 5, 5, 0.9)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginLeft: 16,
    marginTop: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  voltarTexto: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 14,
  },
  painelInferior: {
    paddingVertical: 16,
  },
  tituloPainel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#444141",
    marginLeft: 16,
    marginBottom: 12,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  listaHorizontal: {
    paddingHorizontal: 16,
    gap: 12,
  },
  cardMecanico: {
    width: 220,
    backgroundColor: "#080808",
    borderRadius: 16,
    padding: 16,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  nomeMecanico: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#ffffff",
  },
  infoMecanico: {
    fontSize: 13,
    color: "#fdfdfd",
    marginTop: 4,
    marginBottom: 12,
  },
  botaoChamar: {
    backgroundColor: "#2563eb",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  textoBotao: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
});
