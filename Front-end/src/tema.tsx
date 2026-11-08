import * as SecureStore from "expo-secure-store";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Platform, useColorScheme } from "react-native";

// Paletas do app. Todas as telas leem as cores daqui,
// então para ajustar o visual basta mexer neste arquivo.
const claro = {
  fundo: "#F3EBDA",
  cartao: "#FFFFFF",
  borda: "#EAE2D2",
  primaria: "#1F3140",
  sobrePrimaria: "#FFFFFF",
  destaque: "#C85A34",
  destaqueSuave: "#FBEDE6",
  texto: "#1F3140",
  textoSuave: "#7A7266",
  erro: "#B3261E",
  erroSuave: "#FBE9E7",
  sucesso: "#2E7D52",
  sucessoSuave: "#E6F2EB",
  atencao: "#B8860B",
  atencaoSuave: "#FBF3DF",
  sobreposicao: "rgba(31, 49, 64, 0.45)",
};

export type Cores = typeof claro;

const escuro: Cores = {
  fundo: "#0F1A23",
  cartao: "#1A2834",
  borda: "#2A3A48",
  primaria: "#C85A34",
  sobrePrimaria: "#FFFFFF",
  destaque: "#D96C43",
  destaqueSuave: "rgba(217, 108, 67, 0.16)",
  texto: "#F3EBDA",
  textoSuave: "#A39C8F",
  erro: "#F2867B",
  erroSuave: "rgba(242, 134, 123, 0.15)",
  sucesso: "#6BC896",
  sucessoSuave: "rgba(107, 200, 150, 0.15)",
  atencao: "#E5B84F",
  atencaoSuave: "rgba(229, 184, 79, 0.15)",
  sobreposicao: "rgba(0, 0, 0, 0.7)",
};

export const PALETAS = { claro, escuro };

export type PreferenciaTema = "sistema" | "claro" | "escuro";

type ValorTema = {
  cores: Cores;
  escuro: boolean;
  preferencia: PreferenciaTema;
  definirPreferencia: (p: PreferenciaTema) => void;
};

const CHAVE = "ortoo_tema";
// SecureStore não existe na web; lá a escolha vale só até recarregar a página.
const usaSecureStore = Platform.OS !== "web";

const TemaContexto = createContext<ValorTema | null>(null);

export function TemaProvider({ children }: { children: ReactNode }) {
  const esquemaReal = useColorScheme();
  const [preferencia, setPreferencia] = useState<PreferenciaTema>("sistema");

  // Na web a página vem pré-renderizada no tema claro; só depois de hidratar
  // dá para aplicar o esquema do navegador sem quebrar os estilos.
  const [hidratado, setHidratado] = useState(Platform.OS !== "web");
  useEffect(() => setHidratado(true), []);
  const esquemaSistema = hidratado ? esquemaReal : "light";

  useEffect(() => {
    if (!usaSecureStore) return;
    SecureStore.getItemAsync(CHAVE)
      .then((salvo) => {
        if (salvo === "claro" || salvo === "escuro" || salvo === "sistema") {
          setPreferencia(salvo);
        }
      })
      .catch(() => {});
  }, []);

  const definirPreferencia = useCallback((p: PreferenciaTema) => {
    setPreferencia(p);
    if (usaSecureStore) SecureStore.setItemAsync(CHAVE, p).catch(() => {});
  }, []);

  const valor = useMemo<ValorTema>(() => {
    const ehEscuro =
      preferencia === "sistema"
        ? esquemaSistema === "dark"
        : preferencia === "escuro";
    return {
      cores: ehEscuro ? escuro : claro,
      escuro: ehEscuro,
      preferencia,
      definirPreferencia,
    };
  }, [preferencia, esquemaSistema, definirPreferencia]);

  return <TemaContexto.Provider value={valor}>{children}</TemaContexto.Provider>;
}

export function useTema() {
  const ctx = useContext(TemaContexto);
  if (!ctx) throw new Error("useTema precisa estar dentro do TemaProvider");
  return ctx;
}

// Monta o StyleSheet da tela com as cores do tema atual.
// Uso: const styles = useEstilos(criarEstilos);
export function useEstilos<T>(fabrica: (cores: Cores) => T): T {
  const { cores } = useTema();
  return useMemo(() => fabrica(cores), [fabrica, cores]);
}
