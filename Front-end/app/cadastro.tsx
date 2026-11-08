import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ApiError, register, UserType } from "../src/services/api";
import { Cores, useEstilos, useTema } from "../src/tema";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validarCPF(cpf: string): boolean {
  const clean = cpf.replace(/\D/g, "");
  if (clean.length !== 11 || /^(\d)\1{10}$/.test(clean)) return false;

  let soma = 0;
  for (let i = 1; i <= 9; i++) {
    soma += parseInt(clean.substring(i - 1, i)) * (11 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(clean.substring(9, 10))) return false;

  soma = 0;
  for (let i = 1; i <= 10; i++) {
    soma += parseInt(clean.substring(i - 1, i)) * (12 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(clean.substring(10, 11))) return false;

  return true;
}

function validarCNPJ(cnpj: string): boolean {
  const clean = cnpj.replace(/\D/g, "");
  if (clean.length !== 14 || /^(\d)\1{13}$/.test(clean)) return false;

  let tamanho = clean.length - 2;
  let numeros = clean.substring(0, tamanho);
  const digitos = clean.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(0))) return false;

  tamanho = tamanho + 1;
  numeros = clean.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(1))) return false;

  return true;
}

export default function Cadastro() {
  const { cores: CORES } = useTema();
  const styles = useEstilos(criarEstilos);
  const router = useRouter();

  const [tipoUsuario, setTipoUsuario] = useState<UserType>("CLIENTE");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [documento, setDocumento] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");

  const [nomeFantasia, setNomeFantasia] = useState("");
  const [descricaoEmpresa, setDescricaoEmpresa] = useState("");
  const [raioAtendimento, setRaioAtendimento] = useState("15");
  const [latitude, setLatitude] = useState("-10.184");
  const [longitude, setLongitude] = useState("-48.333");

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const cleanDoc = documento.replace(/\D/g, "");
  const isMecanico = tipoUsuario !== "CLIENTE";

  const handleDocumentoChange = (text: string) => {
    const raw = text.replace(/\D/g, "");
    if (raw.length <= 11) {
      setDocumento(
        raw
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
      );
    } else {
      setDocumento(
        raw
        .replace(/^(\d{2})(\d)/, "$1.$2")
        .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1/$2")
        .replace(/(\d{4})(\d)/, "$1-$2")
        .slice(0, 18)
      );
    }
  };

  const isDocValid =
  cleanDoc.length === 11
  ? validarCPF(cleanDoc)
  : cleanDoc.length === 14
  ? validarCNPJ(cleanDoc)
  : false;

  const exibirAlerta = (titulo: string, mensagem: string, onOk?: () => void) => {
    if (Platform.OS === "web") {
      window.alert(`${titulo}: ${mensagem}`);
      if (onOk) onOk();
    } else {
      Alert.alert(titulo, mensagem, [{ text: "OK", onPress: onOk }]);
    }
  };

  const submit = async () => {
    setErrorMessage(null);

    if (!nome.trim()) {
      setErrorMessage("Por favor, preencha o seu nome completo.");
      return;
    }

    if (!email.trim() || !EMAIL_PATTERN.test(email.trim())) {
      setErrorMessage("Informe um endereço de e-mail válido.");
      return;
    }

    if (!isDocValid) {
      setErrorMessage(
        cleanDoc.length <= 11
        ? "Informe um CPF válido (11 dígitos)."
        : "Informe um CNPJ válido (14 dígitos)."
      );
      return;
    }

    if (isMecanico && !nomeFantasia.trim()) {
      setErrorMessage("Informe o nome fantasia ou razão social da sua oficina.");
      return;
    }

    if (!/^\d{6}$/.test(password)) {
      setErrorMessage("A senha deve ter exatamente 6 dígitos numéricos.");
      return;
    }

    if (password !== confirmation) {
      setErrorMessage("Senhas diferentes. Digite a mesma senha nos dois campos.");
      return;
    }

    setSubmitting(true);
    try {
      await register({
        nome: nome.trim(),
                     email: email.trim(),
                     telefone: telefone.trim(),
                     documento: cleanDoc,
                     password,
                     tipo_usuario: tipoUsuario,
                     nome_fantasia: isMecanico ? nomeFantasia.trim() : undefined,
                     descricao_empresa: isMecanico ? descricaoEmpresa.trim() : undefined,
                     raio_atendimento_km: isMecanico ? Number(raioAtendimento) || 15 : undefined,
                     latitude_atual: isMecanico && latitude ? Number(latitude) : undefined,
                     longitude_atual: isMecanico && longitude ? Number(longitude) : undefined,
      });

      exibirAlerta("Sucesso", "Conta criada com sucesso!", () => {
        router.replace("/");
      });
    } catch (error) {
      const msg = error instanceof ApiError ? error.message : "Tente novamente.";
      setErrorMessage(msg);
      console.error("[ERRO NO CADASTRO]:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
    <Stack.Screen options={{ headerShown: false }} />

    <KeyboardAvoidingView
    behavior={Platform.OS === "ios" ? "padding" : undefined}
    style={{ flex: 1 }}
    >
    <ScrollView contentContainerStyle={styles.scrollContent}>
    <View style={styles.formCard}>
    <TouchableOpacity style={styles.botaoVoltar} onPress={() => router.back()}>
    <MaterialCommunityIcons name="arrow-left" size={20} color={CORES.texto} />
    <Text style={styles.voltarTexto}>Voltar ao login</Text>
    </TouchableOpacity>

    <Text style={styles.title}>Criar conta</Text>
    <Text style={styles.subtitle}>Selecione o tipo de conta e preencha os dados.</Text>

    {errorMessage && (
      <View style={styles.errorContainer}>
      <MaterialCommunityIcons name="alert-circle-outline" size={18} color={CORES.erro} />
      <Text style={styles.errorText}>{errorMessage}</Text>
      </View>
    )}

    {/* SELEÇÃO DO PERFIL */}
    <Text style={styles.label}>Você é:</Text>
    <View style={styles.roleContainer}>
    <TouchableOpacity
    style={[styles.roleButton, tipoUsuario === "CLIENTE" && styles.roleButtonActive]}
    onPress={() => setTipoUsuario("CLIENTE")}
    >
    <Text style={[styles.roleText, tipoUsuario === "CLIENTE" && styles.roleTextActive]}>
    Cliente
    </Text>
    </TouchableOpacity>

    <TouchableOpacity
    style={[
      styles.roleButton,
      tipoUsuario === "PRESTADOR_AUTONOMO" && styles.roleButtonActive,
    ]}
    onPress={() => setTipoUsuario("PRESTADOR_AUTONOMO")}
    >
    <Text
    style={[
      styles.roleText,
      tipoUsuario === "PRESTADOR_AUTONOMO" && styles.roleTextActive,
    ]}
    >
    Mecânico Autônomo
    </Text>
    </TouchableOpacity>

    <TouchableOpacity
    style={[styles.roleButton, tipoUsuario === "EMPRESA" && styles.roleButtonActive]}
    onPress={() => setTipoUsuario("EMPRESA")}
    >
    <Text style={[styles.roleText, tipoUsuario === "EMPRESA" && styles.roleTextActive]}>
    Oficina / Empresa
    </Text>
    </TouchableOpacity>
    </View>

    {/* DADOS GERAIS */}
    <View style={styles.inputGroup}>
    <Text style={styles.label}>Nome Completo</Text>
    <TextInput
    style={styles.input}
    placeholder={isMecanico ? "Nome do responsável" : "Seu nome completo"}
    placeholderTextColor={CORES.textoSuave}
    value={nome}
    onChangeText={setNome}
    />
    </View>

    <View style={styles.inputGroup}>
    <Text style={styles.label}>E-mail</Text>
    <TextInput
    style={styles.input}
    placeholder="seu.email@exemplo.com"
    placeholderTextColor={CORES.textoSuave}
    value={email}
    onChangeText={setEmail}
    keyboardType="email-address"
    autoCapitalize="none"
    />
    </View>

    <View style={styles.inputGroup}>
    <Text style={styles.label}>Telefone / WhatsApp</Text>
    <TextInput
    style={styles.input}
    placeholder="(63) 99999-8888"
    placeholderTextColor={CORES.textoSuave}
    value={telefone}
    onChangeText={setTelefone}
    keyboardType="phone-pad"
    />
    </View>

    <View style={styles.inputGroup}>
    <Text style={styles.label}>
    {tipoUsuario === "EMPRESA" ? "CNPJ" : "CPF ou CNPJ"}
    </Text>
    <TextInput
    style={styles.input}
    placeholder={tipoUsuario === "EMPRESA" ? "00.000.000/0001-00" : "000.000.000-00"}
    placeholderTextColor={CORES.textoSuave}
    value={documento}
    onChangeText={handleDocumentoChange}
    keyboardType="number-pad"
    maxLength={18}
    />
    </View>

    {/* CAMPOS EXCLUSIVOS PARA PRESTADORES E EMPRESAS */}
    {isMecanico && (
      <View style={styles.prestadorSection}>
      <Text style={styles.sectionHeader}>Dados da Oficina / Mecânico</Text>

      <View style={styles.inputGroup}>
      <Text style={styles.label}>Nome Fantasia</Text>
      <TextInput
      style={styles.input}
      placeholder="Nome da sua Oficina / Marca"
      placeholderTextColor={CORES.textoSuave}
      value={nomeFantasia}
      onChangeText={setNomeFantasia}
      />
      </View>

      <View style={styles.inputGroup}>
      <Text style={styles.label}>Descrição / Especialidades</Text>
      <TextInput
      style={[styles.input, styles.textArea]}
      placeholder="Serviços realizados (ex: Guincho, Elétrica, Troca de Óleo)"
      placeholderTextColor={CORES.textoSuave}
      value={descricaoEmpresa}
      onChangeText={setDescricaoEmpresa}
      multiline
      numberOfLines={3}
      />
      </View>

      <View style={styles.inputGroup}>
      <Text style={styles.label}>Raio de Atendimento (km)</Text>
      <TextInput
      style={styles.input}
      placeholder="15"
      placeholderTextColor={CORES.textoSuave}
      value={raioAtendimento}
      onChangeText={setRaioAtendimento}
      keyboardType="numeric"
      />
      </View>

      <View style={styles.row}>
      <View style={[styles.inputGroup, styles.halfInput]}>
      <Text style={styles.label}>Latitude</Text>
      <TextInput
      style={styles.input}
      placeholder="-10.184"
      placeholderTextColor={CORES.textoSuave}
      value={latitude}
      onChangeText={setLatitude}
      keyboardType="numeric"
      />
      </View>
      <View style={[styles.inputGroup, styles.halfInput]}>
      <Text style={styles.label}>Longitude</Text>
      <TextInput
      style={styles.input}
      placeholder="-48.333"
      placeholderTextColor={CORES.textoSuave}
      value={longitude}
      onChangeText={setLongitude}
      keyboardType="numeric"
      />
      </View>
      </View>
      </View>
    )}

    {/* SENHAS */}
    <View style={styles.inputGroup}>
    <Text style={styles.label}>Senha (6 dígitos numéricos)</Text>
    <TextInput
    style={styles.input}
    placeholder="••••••"
    placeholderTextColor={CORES.textoSuave}
    value={password}
    onChangeText={setPassword}
    keyboardType="number-pad"
    secureTextEntry
    maxLength={6}
    />
    </View>

    <View style={styles.inputGroup}>
    <Text style={styles.label}>Confirmar Senha</Text>
    <TextInput
    style={styles.input}
    placeholder="••••••"
    placeholderTextColor={CORES.textoSuave}
    value={confirmation}
    onChangeText={setConfirmation}
    keyboardType="number-pad"
    secureTextEntry
    maxLength={6}
    />
    </View>

    {/* BOTÃO DE ENVIAR */}
    <TouchableOpacity
    style={[styles.button, submitting && styles.disabled]}
    onPress={submit}
    disabled={submitting}
    activeOpacity={0.8}
    >
    {submitting ? (
      <ActivityIndicator color={CORES.sobrePrimaria} size="small" />
    ) : (
      <Text style={styles.buttonText}>Finalizar Cadastro</Text>
    )}
    </TouchableOpacity>
    </View>
    </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export const criarEstilos = (CORES: Cores) =>
  StyleSheet.create({
  container: { flex: 1, backgroundColor: CORES.fundo },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  formCard: { width: "100%", maxWidth: 440 },
  botaoVoltar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 20,
  },
  voltarTexto: { color: CORES.texto, fontSize: 14, fontWeight: "600" },
  title: { fontSize: 32, fontWeight: "800", color: CORES.texto, marginBottom: 6 },
  subtitle: { fontSize: 14, color: CORES.textoSuave, marginBottom: 24 },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: CORES.erroSuave,
    borderColor: CORES.erro,
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  errorText: { color: CORES.erro, fontSize: 13, flex: 1 },
  inputGroup: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: "600", color: CORES.textoSuave, marginBottom: 6 },
  roleContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: CORES.borda,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: CORES.cartao,
  },
  roleButtonActive: {
    borderColor: CORES.primaria,
    backgroundColor: CORES.destaqueSuave,
  },
  roleText: { fontSize: 12, fontWeight: "600", color: CORES.textoSuave, textAlign: "center" },
  roleTextActive: { color: CORES.destaque, fontWeight: "700" },
  input: {
    height: 50,
    backgroundColor: CORES.cartao,
    borderColor: CORES.borda,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    color: CORES.texto,
    fontSize: 15,
  },
  textArea: { height: 80, textAlignVertical: "top", paddingTop: 12 },
  prestadorSection: {
    backgroundColor: CORES.fundo,
    borderWidth: 1,
    borderColor: CORES.borda,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: "700",
    color: CORES.destaque,
    marginBottom: 14,
  },
  row: { flexDirection: "row", gap: 10 },
  halfInput: { flex: 1 },
  button: {
    height: 52,
    backgroundColor: CORES.primaria,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    shadowColor: CORES.primaria,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabled: { backgroundColor: CORES.fundo, shadowOpacity: 0, elevation: 0 },
  buttonText: { color: CORES.sobrePrimaria, fontSize: 16, fontWeight: "700" },
});
