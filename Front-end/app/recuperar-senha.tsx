import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ApiError, recuperarSenha } from "../src/services/api";
import { Cores, useEstilos, useTema } from "../src/tema";

export default function RecuperarSenha() {
  const { cores: CORES } = useTema();
  const styles = useEstilos(criarEstilos);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmaSenha, setConfirmaSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleRedefinir() {
    setErro(null);

    if (!email.trim() || !novaSenha || !confirmaSenha) {
      setErro("Preencha todos os campos.");
      return;
    }

    if (!/^\d{6}$/.test(novaSenha)) {
      setErro("A senha deve conter exatamente 6 dígitos numéricos.");
      return;
    }

    if (novaSenha !== confirmaSenha) {
      setErro("As senhas não coincidem.");
      return;
    }

    try {
      setCarregando(true);
      const res = await recuperarSenha({ email: email.trim(), novaSenha });
      Alert.alert("Sucesso", res.mensagem || "Senha alterada com sucesso!", [
        { text: "Ir para Login", onPress: () => router.replace("/") },
      ]);
    } catch (err) {
      if (err instanceof ApiError) {
        setErro(err.message);
      } else {
        setErro("Ocorreu um erro ao redefinir a senha.");
      }
    } finally {
      setCarregando(false);
    }
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Recuperar Senha" }} />
      <View style={styles.formCard}>
        <Text style={styles.title}>Redefinir Senha</Text>
        <Text style={styles.subtitle}>
          Digite o e-mail da sua conta e cadastre sua nova senha de 6 dígitos.
        </Text>

        {erro ? <Text style={styles.erroText}>{erro}</Text> : null}

        <TextInput
          style={styles.input}
          placeholderTextColor={CORES.textoSuave}
          placeholder="Seu e-mail cadastrado"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholderTextColor={CORES.textoSuave}
          placeholder="Nova senha (6 dígitos numéricos)"
          keyboardType="numeric"
          secureTextEntry
          maxLength={6}
          value={novaSenha}
          onChangeText={setNovaSenha}
        />

        <TextInput
          style={styles.input}
          placeholderTextColor={CORES.textoSuave}
          placeholder="Confirme a nova senha"
          keyboardType="numeric"
          secureTextEntry
          maxLength={6}
          value={confirmaSenha}
          onChangeText={setConfirmaSenha}
        />

        <TouchableOpacity
          style={[styles.button, carregando && styles.buttonDisabled]}
          onPress={handleRedefinir}
          disabled={carregando}
        >
          {carregando ? (
            <ActivityIndicator color={CORES.sobrePrimaria} />
          ) : (
            <Text style={styles.buttonText}>Atualizar Senha</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const criarEstilos = (CORES: Cores) =>
  StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    backgroundColor: CORES.fundo,
  },
  formCard: {
    width: "100%",
    maxWidth: 400,
  },
  title: {
    color: CORES.texto,
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    color: CORES.textoSuave,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: CORES.borda,
    backgroundColor: CORES.cartao,
    color: CORES.texto,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  button: {
    backgroundColor: CORES.primaria,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: CORES.primaria,
    opacity: 0.5,
  },
  buttonText: {
    color: CORES.sobrePrimaria,
    fontSize: 16,
    fontWeight: "600",
  },
  backButton: {
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  backButtonText: {
    color: CORES.textoSuave,
    fontSize: 15,
  },
  erroText: {
    color: CORES.erro,
    backgroundColor: CORES.erroSuave,
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
    textAlign: "center",
  },
});
