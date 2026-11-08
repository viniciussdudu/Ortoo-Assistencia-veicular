import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Cores, useEstilos } from "../src/tema";

export default function AdicionarCartaoForm() {
  const styles = useEstilos(criarEstilos);
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

const criarEstilos = (CORES: Cores) =>
  StyleSheet.create({
  tela: { flex: 1, backgroundColor: CORES.fundo },
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
    backgroundColor: CORES.cartao,
    borderWidth: 1,
    borderColor: CORES.borda,
    marginBottom: 20,
  },
  iconeTexto: { color: CORES.destaque, fontSize: 20, fontWeight: "800" },
  titulo: { color: CORES.texto, fontSize: 24, fontWeight: "800", textAlign: "center" },
  mensagem: {
    color: CORES.textoSuave,
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
    backgroundColor: CORES.primaria,
    marginTop: 28,
  },
  textoBotao: { color: CORES.sobrePrimaria, fontSize: 15, fontWeight: "700" },
});
