import { Stack, useRouter } from "expo-router";
import { CardField } from "@stripe/stripe-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { ApiError, register, UserType } from "../src/services/api";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  const formValido =
  nome.trim() !== "" &&
  EMAIL_PATTERN.test(email.trim()) &&
  (cleanDoc.length === 11 || cleanDoc.length === 14) &&
  /^\d{6}$/.test(password) &&
  password === confirmation &&
  (!isMecanico || nomeFantasia.trim() !== "");

  const submit = async () => {
    setErrorMessage(null);

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

      alert("Conta criada com sucesso!");
      router.replace("/");
    } catch (error) {
      const msg = error instanceof ApiError ? error.message : "Tente novamente.";
      setErrorMessage(msg);
      console.error("[ERRO NO CADASTRO]:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
    behavior={Platform.OS === "ios" ? "padding" : undefined}
    style={styles.container}
    >
    <Stack.Screen options={{ title: "Criar Conta" }} />

    <ScrollView contentContainerStyle={styles.scrollContent}>
    <View style={styles.formCard}>
    <Text style={styles.title}>Criar conta</Text>
    <Text style={styles.subtitle}>Selecione o tipo de conta e preencha os dados.</Text>

    {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

    {/* Seleção do Perfil */}
    <Text style={styles.label}>Você é:</Text>
    <View style={styles.roleContainer}>
    <TouchableOpacity
    style={[styles.roleButton, tipoUsuario === "CLIENTE" && styles.roleButtonActive]}
    onPress={() => setTipoUsuario("CLIENTE")}
    >
    <Text
    style={[styles.roleText, tipoUsuario === "CLIENTE" && styles.roleTextActive]}
    >
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
    <Text
    style={[styles.roleText, tipoUsuario === "EMPRESA" && styles.roleTextActive]}
    >
    Oficina / Empresa
    </Text>
    </TouchableOpacity>
    </View>

    {/* Dados Gerais */}
    <TextInput
    style={styles.input}
    placeholder={isMecanico ? "Nome do responsável" : "Nome completo"}
    value={nome}
    onChangeText={setNome}
    />

    <TextInput
    style={styles.input}
    placeholder="E-mail"
    value={email}
    onChangeText={setEmail}
    keyboardType="email-address"
    autoCapitalize="none"
    />

    <TextInput
    style={styles.input}
    placeholder="Telefone / WhatsApp (ex: 63999998888)"
    value={telefone}
    onChangeText={setTelefone}
    keyboardType="phone-pad"
    />

    <TextInput
    style={styles.input}
    placeholder={tipoUsuario === "EMPRESA" ? "CNPJ (14 dígitos)" : "CPF ou CNPJ"}
    value={documento}
    onChangeText={setDocumento}
    keyboardType="number-pad"
    maxLength={18}
    />

    {/* Campos Exclusivos para Prestadores e Empresas */}
    {isMecanico && (
      <View style={styles.prestadorSection}>
      <Text style={styles.sectionHeader}>Dados da Oficina / Mecânico</Text>

      <TextInput
      style={styles.input}
      placeholder="Nome Fantasia / Nome do Negócio"
      value={nomeFantasia}
      onChangeText={setNomeFantasia}
      />

      <TextInput
      style={[styles.input, styles.textArea]}
      placeholder="Descrição dos serviços / especialidade"
      value={descricaoEmpresa}
      onChangeText={setDescricaoEmpresa}
      multiline
      numberOfLines={3}
      />

      <TextInput
      style={styles.input}
      placeholder="Raio de atendimento (km) - Ex: 15"
      value={raioAtendimento}
      onChangeText={setRaioAtendimento}
      keyboardType="numeric"
      />

      <View style={styles.row}>
      <TextInput
      style={[styles.input, styles.halfInput]}
      placeholder="Latitude atual"
      value={latitude}
      onChangeText={setLatitude}
      keyboardType="numeric"
      />
      <TextInput
      style={[styles.input, styles.halfInput]}
      placeholder="Longitude atual"
      value={longitude}
      onChangeText={setLongitude}
      keyboardType="numeric"
      />
      </View>
      </View>
    )}

    <TextInput
    style={styles.input}
    placeholder="Senha (6 dígitos numéricos)"
    value={password}
    onChangeText={setPassword}
    keyboardType="number-pad"
    secureTextEntry
    maxLength={6}
    />

    <TextInput
    style={styles.input}
    placeholder="Confirmar senha"
    value={confirmation}
    onChangeText={setConfirmation}
    keyboardType="number-pad"
    secureTextEntry
    maxLength={6}
    />

    <TouchableOpacity
    style={[styles.button, (!formValido || submitting) && styles.disabled]}
    onPress={submit}
    disabled={!formValido || submitting}
    >
    {submitting ? (
      <ActivityIndicator color="#fff" />
    ) : (
      <Text style={styles.buttonText}>Finalizar Cadastro</Text>
    )}
    </TouchableOpacity>

    <TouchableOpacity onPress={() => router.back()}>
    <Text style={styles.link}>Voltar ao login</Text>
    </TouchableOpacity>
    </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  formCard: {
    width: "100%",
    maxWidth: 400,
  },
  title: { fontSize: 28, fontWeight: "bold", textAlign: "center", marginBottom: 8 },
  subtitle: { fontSize: 14, color: "#666", textAlign: "center", marginBottom: 24 },
  errorText: {
    color: "#dc2626",
    backgroundColor: "#fee2e2",
    padding: 10,
    borderRadius: 6,
    marginBottom: 16,
    textAlign: "center",
    fontSize: 14,
  },
  input: {
    height: 48,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  cardLabel: { fontSize: 14, color: "#666", marginBottom: 8 },
  cardInput: {
    width: "100%",
    height: 52,
    marginBottom: 16,
  },
  cardField: {
    backgroundColor: "#fff",
    color : "#111827",
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
  },
  button: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  disabled: { backgroundColor: "#9ca3af" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  link: { color: "#2563eb", fontSize: 15, textAlign: "center", marginTop: 20 },
});
