import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AdicionarCartaoForm() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.tela}>
      <View style={styles.conteudo}>
        <View style={styles.icone}>
          <Text style={styles.iconeTexto}>R$</Text>
        </View>
        <Text style={styles.titulo}>Cadastro de cartão</Text>
        <Text style={styles.mensagem}>
          Para manter os dados de pagamento protegidos, o cadastro de cartão
          está disponível no aplicativo para celular.
        </Text>
        <TouchableOpacity style={styles.botao} onPress={() => router.back()}>
          <Text style={styles.textoBotao}>Voltar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: "#000000" },
  conteudo: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  icone: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1f2937",
    marginBottom: 20,
  },
  iconeTexto: { color: "#38bdf8", fontSize: 20, fontWeight: "800" },
  titulo: { color: "#ffffff", fontSize: 24, fontWeight: "800", textAlign: "center" },
  mensagem: {
    color: "#9ca3af",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 10,
    maxWidth: 360,
  },
  botao: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 160,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#2563eb",
    marginTop: 28,
  },
  textoBotao: { color: "#ffffff", fontSize: 15, fontWeight: "700" },
});
