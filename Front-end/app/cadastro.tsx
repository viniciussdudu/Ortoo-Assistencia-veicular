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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// VALIDAÇÃO MATEMÁTICA DE CPF
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

// VALIDAÇÃO MATEMÁTICA DE CNPJ
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
  const router = useRouter();

  const [tipoUsuario, setTipoUsuario] = useState<UserType>("CLIENTE");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [documento, setDocumento] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");

  // Campos específicos do prestador
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [descricaoEmpresa, setDescricaoEmpresa] = useState("");
  const [raioAtendimento, setRaioAtendimento] = useState("15");
  const [latitude, setLatitude] = useState("-10.184");
  const [longitude, setLongitude] = useState("-48.333");

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const cleanDoc = documento.replace(/\D/g, "");
  const isMecanico = tipoUsuario !== "CLIENTE";

  // Máscara dinâmica de CPF/CNPJ
  const handleDocumentoChange = (text: string) => {
    const raw = text.replace(/\D/g, "");
    if (raw.length <= 11) {
      // Máscara CPF: 000.000.000-00
      setDocumento(
        raw
          .replace(/(\d{3})(\d)/, "$1.$2")
          .replace(/(\d{3})(\d)/, "$1.$2")
          .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
      );
    } else {
      // Máscara CNPJ: 00.000.000/0001-00
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
    cleanDoc.length === 11 ? validarCPF(cleanDoc) : cleanDoc.length === 14 ? validarCNPJ(cleanDoc) : false;

  const formValido =
    nome.trim() !== "" &&
    EMAIL_PATTERN.test(email.trim()) &&
    isDocValid &&
    /^\d{6}$/.test(password) &&
    password === confirmation &&
    (!isMecanico || nomeFantasia.trim() !== "");

  const submit = async () => {
    setErrorMessage(null);

    if (!isDocValid) {
      setErrorMessage("Informe um CPF ou CNPJ válido.");
      return;
    }
    if (password !== confirmation) {
      setErrorMessage("Senhas diferentes. Digite a mesma senha nos dois campos.");
      return;
    }
    if (!EMAIL_PATTERN.test(email.trim())) {
      setErrorMessage("Informe um e-mail válido.");
      return;
    }
    if (!/^\d{6}$/.test(password)) {
      setErrorMessage("A senha deve ter exatamente 6 dígitos numéricos.");
      return;
    }
    if (isMecanico && !nomeFantasia.trim()) {
      setErrorMessage("Informe o nome fantasia ou razão social.");
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

      Alert.alert("Sucesso", "Conta criada com sucesso!", [
        { text: "OK", onPress: () => router.replace("/") },
      ]);
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
              <MaterialCommunityIcons name="arrow-left" size={20} color="#ffffff" />
              <Text style={styles.voltarTexto}>Voltar ao login</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Criar conta</Text>
            <Text style={styles.subtitle}>Selecione o tipo de conta e preencha os dados.</Text>

            {errorMessage && (
              <View style={styles.errorContainer}>
                <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#ef4444" />
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
                placeholderTextColor="#6b7280"
                value={nome}
                onChangeText={setNome}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>E-mail</Text>
              <TextInput
                style={styles.input}
                placeholder="seu.email@exemplo.com"
                placeholderTextColor="#6b7280"
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
                placeholderTextColor="#6b7280"
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
                placeholderTextColor="#6b7280"
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
                    placeholderTextColor="#6b7280"
                    value={nomeFantasia}
                    onChangeText={setNomeFantasia}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Descrição / Especialidades</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Serviços realizados (ex: Guincho, Elétrica, Troca de Óleo)"
                    placeholderTextColor="#6b7280"
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
                    placeholderTextColor="#6b7280"
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
                      placeholderTextColor="#6b7280"
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
                      placeholderTextColor="#6b7280"
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
                placeholderTextColor="#6b7280"
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
                placeholderTextColor="#6b7280"
                value={confirmation}
                onChangeText={setConfirmation}
                keyboardType="number-pad"
                secureTextEntry
                maxLength={6}
              />
            </View>

            {/* BOTÃO DE ENVIAR */}
            <TouchableOpacity
              style={[styles.button, (!formValido || submitting) && styles.disabled]}
              onPress={submit}
              disabled={!formValido || submitting}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
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

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000" },
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
  voltarTexto: { color: "#ffffff", fontSize: 14, fontWeight: "600" },
  title: { fontSize: 32, fontWeight: "800", color: "#ffffff", marginBottom: 6 },
  subtitle: { fontSize: 14, color: "#9ca3af", marginBottom: 24 },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderColor: "rgba(239, 68, 68, 0.3)",
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  errorText: { color: "#f87171", fontSize: 13, flex: 1 },
  inputGroup: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: "600", color: "#d1d5db", marginBottom: 6 },
  roleContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111827",
  },
  roleButtonActive: {
    borderColor: "#2563eb",
    backgroundColor: "rgba(37, 99, 235, 0.15)",
  },
  roleText: { fontSize: 12, fontWeight: "600", color: "#9ca3af", textAlign: "center" },
  roleTextActive: { color: "#38bdf8", fontWeight: "700" },
  input: {
    height: 50,
    backgroundColor: "#111827",
    borderColor: "#1f2937",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    color: "#ffffff",
    fontSize: 15,
  },
  textArea: { height: 80, textAlignVertical: "top", paddingTop: 12 },
  prestadorSection: {
    backgroundColor: "#0d1117",
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: "700",
    color: "#38bdf8",
    marginBottom: 14,
  },
  row: { flexDirection: "row", gap: 10 },
  halfInput: { flex: 1 },
  button: {
    height: 52,
    backgroundColor: "#2563eb",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabled: { backgroundColor: "#1f2937", shadowOpacity: 0, elevation: 0 },
  buttonText: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
});