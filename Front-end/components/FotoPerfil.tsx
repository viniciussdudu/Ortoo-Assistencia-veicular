import * as ImagePicker from "expo-image-picker";
import { useRef, useState } from "react";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { enderecoFotoPerfil, salvarFotoPerfil } from "../src/services/api";
import { useTema } from "../src/tema";

type Props = { nome: string; foto?: string | null; onChange: (foto: string) => void };
const LIMITE_BYTES = 5 * 1024 * 1024;

export function FotoPerfil({ nome, foto, onChange }: Props) {
  const { cores } = useTema();
  const [erro, setErro] = useState("");
  const [fotoComErro, setFotoComErro] = useState<string>();
  const [salvando, setSalvando] = useState(false);
  const ocupado = useRef(false);
  const iniciais = nome.trim().split(/\s+/).slice(0, 2).map((parte) => parte[0]).join("").toUpperCase() || "?";

  async function escolherFoto() {
    if (ocupado.current) return;
    ocupado.current = true;
    setErro("");
    try {
      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.7, base64: true,
      });
      if (resultado.canceled) return;
      const imagem = resultado.assets[0];
      if (!imagem?.base64) throw new Error("Não foi possível ler a foto.");
      if (imagem.base64.length * 3 / 4 - (imagem.base64.endsWith("==") ? 2 : imagem.base64.endsWith("=") ? 1 : 0) > LIMITE_BYTES) {
        throw new Error("A foto deve ter até 5 MB.");
      }
      setSalvando(true);
      const { foto_url } = await salvarFotoPerfil(imagem.base64);
      setFotoComErro(undefined);
      onChange(foto_url);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível salvar a foto.");
    } finally {
      ocupado.current = false;
      setSalvando(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={[styles.avatar, { backgroundColor: cores.primaria, borderColor: cores.destaque }]}>
        {foto && foto !== fotoComErro ? (
          <Image accessibilityLabel="Foto de perfil" source={{ uri: enderecoFotoPerfil(foto) }} style={styles.foto} onError={() => setFotoComErro(foto)} />
        ) : <Text style={[styles.iniciais, { color: cores.sobrePrimaria }]}>{iniciais}</Text>}
      </View>
      <Pressable accessibilityRole="button" disabled={salvando} onPress={escolherFoto} style={styles.botao}>
        {salvando ? <ActivityIndicator accessibilityLabel="Salvando foto" color={cores.destaque} /> : (
          <Text style={[styles.rotulo, { color: cores.destaque }]}>{foto ? "Alterar foto de perfil" : "Adicionar foto de perfil"}</Text>
        )}
      </Pressable>
      {!!erro && <Text accessibilityRole="alert" style={[styles.erro, { color: cores.erro }]}>{erro}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", marginBottom: 12 },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", borderWidth: 2, overflow: "hidden" },
  foto: { width: "100%", height: "100%" },
  iniciais: { fontSize: 26, fontWeight: "800" },
  botao: { minHeight: 44, justifyContent: "center", paddingHorizontal: 12 },
  rotulo: { fontWeight: "700" },
  erro: { textAlign: "center", maxWidth: 300 },
});
