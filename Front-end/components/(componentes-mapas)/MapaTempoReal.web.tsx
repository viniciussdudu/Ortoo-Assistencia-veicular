import React from "react";
import { StyleSheet, View } from "react-native";
import { MapaTempoRealProps } from "./types";



interface Coordenada {
  latitude: number;
  longitude: number;
}

interface Props {
  clienteLocation: Coordenada;
  mecanicoLocation: Coordenada & { heading?: number };
}

export default function MapaTempoReal({
  clienteLocation,
  mecanicoLocation,
}: MapaTempoRealProps) { // 2. Usa a nova interface aqui
  const PADDING = 0.005;

  let minLat = clienteLocation.latitude;
  let maxLat = clienteLocation.latitude;
  let minLng = clienteLocation.longitude;
  let maxLng = clienteLocation.longitude;

  // 3. Só calcula os limites com o mecânico se ele existir
  if (mecanicoLocation) {
    minLat = Math.min(clienteLocation.latitude, mecanicoLocation.latitude);
    maxLat = Math.max(clienteLocation.latitude, mecanicoLocation.latitude);
    minLng = Math.min(clienteLocation.longitude, mecanicoLocation.longitude);
    maxLng = Math.max(clienteLocation.longitude, mecanicoLocation.longitude);
  }

  const latMarcador = mecanicoLocation ? mecanicoLocation.latitude : clienteLocation.latitude;
  const lngMarcador = mecanicoLocation ? mecanicoLocation.longitude : clienteLocation.longitude;

  const webMapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${
    minLng - PADDING
  }%2C${minLat - PADDING}%2C${maxLng + PADDING}%2C${
    maxLat + PADDING
  }&layer=mapnik&marker=${latMarcador}%2C${lngMarcador}`;

  return (
    <View style={styles.container}>
      <iframe
        title="Mapa Web"
        src={webMapUrl}
        style={{
          width: "100%",
          height: "calc(100% + 40px)",
          marginBottom: "-40px",
          border: "none",
          filter: "invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%)",
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    overflow: "hidden",
  },
});