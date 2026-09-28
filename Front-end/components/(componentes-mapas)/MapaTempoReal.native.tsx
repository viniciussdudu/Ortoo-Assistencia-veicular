import React, { useEffect, useRef, useState, useCallback } from "react";
import { StyleSheet, View, Text } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { FontAwesome5 } from "@expo/vector-icons";
import { MapaTempoRealProps, Coordenada } from "./types";

const UBER_DARK_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#212121" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
  {
    featureType: "administrative",
    elementType: "geometry",
    stylers: [{ color: "#757575" }],
  },
  {
    featureType: "administrative.country",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9e9e9e" }],
  },
  {
    featureType: "poi",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "road",
    elementType: "geometry.fill",
    stylers: [{ color: "#2c2c2c" }],
  },
  {
    featureType: "road",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#000000" }],
  },
];

export default function MapaTempoReal({
  clienteLocation,
  mecanicoLocation,
}: MapaTempoRealProps) {
  const mapRef = useRef<MapView | null>(null);
  const [rotaCoords, setRotaCoords] = useState<Coordenada[]>([]);
  const [shouldTrackChanges, setShouldTrackChanges] = useState(true);
  const [isMapReady, setIsMapReady] = useState(false);

  // Estados para a distância e tempo exatos pelas ruas
  const [distanciaRua, setDistanciaRua] = useState<string | null>(null);
  const [tempoEstimado, setTempoEstimado] = useState<string | null>(null);

  // 1. Memoiza a busca de rota para não ser recriada a cada re-render
  const buscarRotaNasRuas = useCallback(async () => {
    if (!mecanicoLocation) {
      setRotaCoords([]);
      setDistanciaRua(null);
      setTempoEstimado(null);
      return;
    }

    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${mecanicoLocation.longitude},${mecanicoLocation.latitude};${clienteLocation.longitude},${clienteLocation.latitude}?overview=full&geometries=geojson`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const rota = data.routes[0];

        const pontos: Coordenada[] = rota.geometry.coordinates.map(
          (pt: [number, number]) => ({
            latitude: pt[1],
            longitude: pt[0],
          })
        );
        setRotaCoords(pontos);

        const km = (rota.distance / 1000).toFixed(1);
        setDistanciaRua(`${km} km`);

        const minutos = Math.ceil(rota.duration / 60);
        setTempoEstimado(`${minutos} min`);
      }
    } catch (error) {
      console.error("Erro ao carregar rota pelas ruas:", error);
      if (mecanicoLocation) {
        setRotaCoords([mecanicoLocation, clienteLocation]);
      }
    }
  }, [
    clienteLocation.latitude,
    clienteLocation.longitude,
    mecanicoLocation?.latitude,
    mecanicoLocation?.longitude,
  ]);

  // 2. Efeito focado EXCLUSIVAMENTE em buscar a rota quando as posições mudam
  useEffect(() => {
    setShouldTrackChanges(true);
    buscarRotaNasRuas();

    const timer = setTimeout(() => {
      setShouldTrackChanges(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [buscarRotaNasRuas]);

  // 3. Efeito focado EXCLUSIVAMENTE no fitToCoordinates sem disparar rerenders infinitos
  useEffect(() => {
    if (mapRef.current && isMapReady) {
      const coordenadasAEnquadrar: Coordenada[] = [{ ...clienteLocation }];

      if (mecanicoLocation) {
        coordenadasAEnquadrar.push({
          latitude: mecanicoLocation.latitude,
          longitude: mecanicoLocation.longitude,
        });
      }

      if (rotaCoords.length > 0) {
        coordenadasAEnquadrar.push(...rotaCoords);
      }

      if (coordenadasAEnquadrar.length > 1) {
        mapRef.current.fitToCoordinates(coordenadasAEnquadrar, {
          edgePadding: { top: 140, right: 70, bottom: 240, left: 70 },
          animated: true,
        });
      }
    }
  }, [
    isMapReady,
    clienteLocation.latitude,
    clienteLocation.longitude,
    mecanicoLocation?.latitude,
    mecanicoLocation?.longitude,
    rotaCoords.length, // Dependência primitiva para evitar loops com a referência do array
  ]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.mapa}
        provider={PROVIDER_GOOGLE}
        customMapStyle={UBER_DARK_STYLE}
        showsPointsOfInterest={false}
        showsBuildings={false}
        showsCompass={false}
        onMapReady={() => {
          setIsMapReady(true);
        }}
      >
        {/* Linha da rota pelas ruas */}
        {mecanicoLocation && rotaCoords.length > 0 && (
          <Polyline
            coordinates={rotaCoords}
            strokeColor="#2563eb"
            strokeWidth={5}
          />
        )}

        {/* Marcador do Cliente */}
        <Marker
          coordinate={{
            latitude: clienteLocation.latitude,
            longitude: clienteLocation.longitude,
          }}
          title="Sua Localização"
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={shouldTrackChanges}
        >
          <View style={styles.marcadorClienteContainer}>
            <View style={styles.marcadorCliente} />
          </View>
        </Marker>

        {/* Marcador do Prestador / Mecânico */}
        {mecanicoLocation && (
          <Marker
            coordinate={{
              latitude: mecanicoLocation.latitude,
              longitude: mecanicoLocation.longitude,
            }}
            title="Mecânico a caminho"
            rotation={mecanicoLocation.heading || 0}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={shouldTrackChanges}
          >
            <View style={styles.marcadorMecanicoContainer}>
              <FontAwesome5 name="wrench" size={14} color="#ffffff" />
            </View>
          </Marker>
        )}
      </MapView>

      {/* Card Flutuante superior com Distância Real e Tempo */}
      {distanciaRua && (
        <View style={styles.cardInfoRota}>
          <View style={styles.infoBloco}>
            <FontAwesome5 name="route" size={14} color="#2563eb" />
            <Text style={styles.textoInfo}>{distanciaRua}</Text>
          </View>

          {tempoEstimado && (
            <>
              <View style={styles.divisor} />
              <View style={styles.infoBloco}>
                <FontAwesome5 name="clock" size={14} color="#10b981" />
                <Text style={styles.textoInfo}>{tempoEstimado}</Text>
              </View>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  mapa: {
    width: "100%",
    height: "100%",
  },
  marcadorClienteContainer: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  marcadorCliente: {
    width: 18,
    height: 18,
    backgroundColor: "#2563eb",
    borderRadius: 9,
    borderWidth: 3,
    borderColor: "#ffffff",
  },
  marcadorMecanicoContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f59e0b",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  cardInfoRota: {
    position: "absolute",
    top: 50,
    alignSelf: "center",
    backgroundColor: "#1e293b",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  infoBloco: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  divisor: {
    width: 1,
    height: 16,
    backgroundColor: "#475569",
    marginHorizontal: 12,
  },
  textoInfo: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 14,
  },
});