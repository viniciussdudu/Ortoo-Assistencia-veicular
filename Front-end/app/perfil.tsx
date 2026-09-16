import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { ApiError, getUserProfile, logout } from "../src/services/api";

export default function Perfil() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saindo, setSaindo] = useState(false);
  const [usuario, setUsuario] = useState<any>(null);
  const [veiculo, setVeiculo] = useState<any>(null);
  const [historico, setHistorico] = useState<any[]>([]);

  useEffect(() => {
    fetchPerfil();
  }, []);

  const fetchPerfil = async () => {
    try {
      setLoading(true);
      const data = await getUserProfile();
      setUsuario(data.usuario);
      setVeiculo(data.veiculo);
      setHistorico(data.historico || []);
    } catch (error) {
      Alert.alert(
        "Erro ao carregar perfil",
        error instanceof ApiError
          ? error.message
          : "Verifique sua conexão e tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setSaindo(true);
    try {
      await logout(); // Comunica com a API para invalidar a sessão, se necessário
      router.replace("/");
    } catch (error) {
      Alert.alert(
        "Erro ao sair",
        error instanceof ApiError ? error.message : "Tente novamente.",
      );
    } finally {
      setSaindo(false);
    }
  };

  const getStatusStyle = (status: string) => {
    if (status === "Concluído") return styles.statusConcluido;
    if (status === "Cancelado") return styles.statusCancelado;
    return styles.statusPadrao;
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!usuario) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.textoErro}>
          Não foi possível carregar os dados.
        </Text>
        <TouchableOpacity style={styles.botaoSecundario} onPress={fetchPerfil}>
          <Text style={styles.botaoSecundarioTexto}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarTexto}>
            {usuario.nome
              ? usuario.nome
                  .split(" ")
                  .map((parte: string) => parte[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()
              : "??"}
          </Text>
        </View>
        <Text style={styles.nome}>{usuario.nome}</Text>
        <Text style={styles.email}>{usuario.email}</Text>
        <Text style={styles.telefone}>{usuario.telefone}</Text>

        <TouchableOpacity style={styles.botaoSecundario}>
          <Text style={styles.botaoSecundarioTexto}>Editar perfil</Text>
        </TouchableOpacity>
      </View>

      {veiculo && (
        <>
          <Text style={styles.secaoTitulo}>Meu veículo</Text>
          <View style={styles.card}>
            <Text style={styles.veiculoModelo}>{veiculo.modelo}</Text>
            <Text style={styles.veiculoInfo}>
              Placa: {veiculo.placa} • Cor: {veiculo.cor}
            </Text>
          </View>
        </>
      )}

      <Text style={styles.secaoTitulo}>Histórico de atendimentos</Text>
      {historico.length > 0 ? (
        historico.map((item) => (
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
        ))
      ) : (
        <Text style={styles.textoVazio}>Nenhum histórico encontrado.</Text>
      )}

      <TouchableOpacity
        style={[styles.botaoSair, saindo && styles.botaoSairDesabilitado]}
        onPress={handleLogout}
        disabled={saindo}
      >
        <Text style={styles.botaoSairTexto}>
          {saindo ? "Saindo..." : "Sair"}
        </Text>
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
  center: {
    justifyContent: "center",
    alignItems: "center",
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
  botaoSairDesabilitado: {
    opacity: 0.5,
  },
  botaoSairTexto: {
    color: "#dc2626",
    fontWeight: "600",
    fontSize: 15,
  },
  textoErro: {
    fontSize: 16,
    color: "#666",
    marginBottom: 16,
  },
  textoVazio: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginVertical: 16,
  },
});
