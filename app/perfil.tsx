import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

const USUARIO_MOCK = {
  nome: "Arthur Souza",
  email: "arthur.souza@email.com",
  telefone: "(63) 99999-0000",
};

const VEICULO_MOCK = {
  modelo: "Chevrolet Onix 2021",
  placa: "ABC1D23",
  cor: "Prata",
};

const HISTORICO_MOCK = [
  { id: "1", data: "28/08/2026", problema: "Pneu furado", status: "Concluído" },
  { id: "2", data: "15/08/2026", problema: "Bateria descarregada", status: "Concluído" },
  { id: "3", data: "02/08/2026", problema: "Sem combustível", status: "Cancelado" },
];

export default function Perfil() {
  const router = useRouter();

  const getStatusStyle = (status: string) => {
    if (status === "Concluído") return styles.statusConcluido;
    if (status === "Cancelado") return styles.statusCancelado;
    return styles.statusPadrao;
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarTexto}>
            {USUARIO_MOCK.nome
              .split(" ")
              .map((parte) => parte[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </Text>
        </View>
        <Text style={styles.nome}>{USUARIO_MOCK.nome}</Text>
        <Text style={styles.email}>{USUARIO_MOCK.email}</Text>
        <Text style={styles.telefone}>{USUARIO_MOCK.telefone}</Text>

        <TouchableOpacity style={styles.botaoSecundario}>
          <Text style={styles.botaoSecundarioTexto}>Editar perfil</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.secaoTitulo}>Meu veículo</Text>
      <View style={styles.card}>
        <Text style={styles.veiculoModelo}>{VEICULO_MOCK.modelo}</Text>
        <Text style={styles.veiculoInfo}>
          Placa: {VEICULO_MOCK.placa} • Cor: {VEICULO_MOCK.cor}
        </Text>
      </View>

      <Text style={styles.secaoTitulo}>Histórico de atendimentos</Text>
      {HISTORICO_MOCK.map((item) => (
        <View key={item.id} style={styles.card}>
          <View style={styles.historicoLinha}>
            <View>
              <Text style={styles.historicoProblema}>{item.problema}</Text>
              <Text style={styles.historicoData}>{item.data}</Text>
            </View>
            <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
              <Text style={styles.statusTexto}>{item.status}</Text>
            </View>
          </View>
        </View>
      ))}

      <TouchableOpacity style={styles.botaoSair} onPress={() => router.replace("/")}>
        <Text style={styles.botaoSairTexto}>Sair</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 40,
    backgroundColor: "#fff",
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarTexto: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  nome: {
    fontSize: 20,
    fontWeight: "bold",
  },
  email: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  telefone: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  botaoSecundario: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#2563eb",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  botaoSecundarioTexto: {
    color: "#2563eb",
    fontWeight: "600",
  },
  secaoTitulo: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    marginTop: 8,
  },
  card: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  veiculoModelo: {
    fontSize: 15,
    fontWeight: "600",
  },
  veiculoInfo: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
  },
  historicoLinha: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historicoProblema: {
    fontSize: 15,
    fontWeight: "600",
  },
  historicoData: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  statusBadge: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusConcluido: {
    backgroundColor: "#dcfce7",
  },
  statusCancelado: {
    backgroundColor: "#fee2e2",
  },
  statusPadrao: {
    backgroundColor: "#e5e7eb",
  },
  statusTexto: {
    fontSize: 12,
    fontWeight: "600",
  },
  botaoSair: {
    marginTop: 16,
    alignItems: "center",
    paddingVertical: 12,
  },
  botaoSairTexto: {
    color: "#dc2626",
    fontWeight: "600",
    fontSize: 15,
  },
});
