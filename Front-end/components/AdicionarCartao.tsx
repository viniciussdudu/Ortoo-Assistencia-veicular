import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function AdicionarCartao() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Novo cartão</Text>
      <Text style={styles.text}>
        O cadastro de cartões está disponível no aplicativo Android e iOS.
      </Text>
      <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace("/home")} style={styles.button}>
        <Text style={styles.title}>Voltar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 24, justifyContent: "center", gap: 20 },
  title: { color: "#fff", fontSize: 20, fontWeight: "700" },
  text: { color: "#9ca3af", fontSize: 16 },
  button: { backgroundColor: "#2563eb", padding: 16, borderRadius: 12, alignItems: "center" },
});
