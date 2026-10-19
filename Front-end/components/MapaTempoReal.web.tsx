import React from "react";
import { StyleSheet, View } from "react-native";

interface Coordenada {
  latitude: number;
  longitude: number;
}

interface Props {
  clienteLocation: Coordenada;
  mecanicoLocation: Coordenada & { heading?: number };
}

export default function MapaTempoReal({ clienteLocation, mecanicoLocation }: Props) {
  const minLat = Math.min(clienteLocation.latitude, mecanicoLocation.latitude);
  const maxLat = Math.max(clienteLocation.latitude, mecanicoLocation.latitude);
  const minLng = Math.min(clienteLocation.longitude, mecanicoLocation.longitude);
  const maxLng = Math.max(clienteLocation.longitude, mecanicoLocation.longitude);

  const PADDING = 0.005;

  const webMapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${
    minLng - PADDING
  }%2C${minLat - PADDING}%2C${maxLng + PADDING}%2C${
    maxLat + PADDING
  }&layer=mapnik&marker=${mecanicoLocation.latitude}%2C${mecanicoLocation.longitude}`;

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