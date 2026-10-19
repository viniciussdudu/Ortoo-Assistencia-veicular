import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { FontAwesome5 } from "@expo/vector-icons";

interface Coordenada {
  latitude: number;
  longitude: number;
}

interface Props {
  clienteLocation: Coordenada;
  mecanicoLocation: Coordenada & { heading?: number };
}

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
}: Props) {
  const mapRef = useRef<MapView | null>(null);
  const [rotaCoords, setRotaCoords] = useState<Coordenada[]>([]);

  // Estado para controlar a renderização dos marcadores
  const [shouldTrackChanges, setShouldTrackChanges] = useState(true);

  const buscarRotaNasRuas = async () => {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${mecanicoLocation.longitude},${mecanicoLocation.latitude};${clienteLocation.longitude},${clienteLocation.latitude}?overview=full&geometries=geojson`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const pontos: Coordenada[] = data.routes[0].geometry.coordinates.map(
          (pt: [number, number]) => ({
            latitude: pt[1],
            longitude: pt[0],
          })
        );
        setRotaCoords(pontos);
      }
    } catch (error) {
      console.error("Erro ao carregar rota:", error);
      setRotaCoords([mecanicoLocation, clienteLocation]);
    }
  };

  useEffect(() => {
    // Sempre que a localização mudar, permite que a view redesenhe por um breve momento
    setShouldTrackChanges(true);

    buscarRotaNasRuas();

    if (mapRef.current) {
      mapRef.current.fitToCoordinates(
        [
          {
            latitude: clienteLocation.latitude,
            longitude: clienteLocation.longitude,
          },
          {
            latitude: mecanicoLocation.latitude,
            longitude: mecanicoLocation.longitude,
          },
        ],
        {
          edgePadding: { top: 120, right: 60, bottom: 220, left: 60 },
          animated: true,
        }
      );
    }

    // Trava o re-render 800ms após carregar para colar no mapa e não flutuar no zoom
    const timer = setTimeout(() => {
      setShouldTrackChanges(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [clienteLocation, mecanicoLocation]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.mapa}
        provider={PROVIDER_GOOGLE}
        customMapStyle={UBER_DARK_STYLE}
        showsPointsOfInterest={false}
        showsCompass={false}
        showsBuildings={false}
      >
        {/* Linha azul pelas ruas */}
        {rotaCoords.length > 0 && (
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

        {/* Marcador do Mecânico / Guincho */}
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
    {/* Ícone de Chave/Ferramenta de Mecânico */}
    <FontAwesome5 name="wrench" size={16} color="#ffffff" />

    {/* Ou se preferir um ícone de Guincho/Carro: */}
    {/* <FontAwesome5 name="truck-pickup" size={16} color="#ffffff" /> */}
  </View>
</Marker>
      </MapView>
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
    justifyContent: "center",
    alignItems: "center",
  },
  marcadorMecanico: {
    width: 28,
    height: 28,
    backgroundColor: "#f59e0b",
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#ffffff",
  },
});
