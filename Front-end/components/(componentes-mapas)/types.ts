export interface Coordenada {
  latitude: number;
  longitude: number;
}

export interface MapaTempoRealProps {
  clienteLocation: Coordenada;
  mecanicoLocation?: (Coordenada & { heading?: number }) | null;
}