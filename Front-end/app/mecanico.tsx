import { Stack } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { ApiError, listarPrestadores, Prestador } from "../src/services/api";

export default function PrestadoresScreen() {
  const [prestadores, setPrestadores] = useState<Prestador[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      setErro(null);
      const dados = await listarPrestadores();
      setPrestadores(dados);
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Nao foi possivel carregar os mecanicos.");
    }
  }, []);

  useEffect(() => {
    setCarregando(true);
    carregar().finally(() => setCarregando(false));
  }, [carregar]);

  async function aoAtualizar() {
    setAtualizando(true);
    await carregar();
    setAtualizando(false);
  }

  let conteudo;

  if (carregando) {
    conteudo = (
      <View style={styles.centro}>
        <ActivityIndicator size="large" />
      </View>
    );
  } else if (erro) {
    conteudo = (
      <View style={styles.centro}>
        <Text style={styles.erroTexto}>{erro}</Text>
      </View>
    );
  } else if (prestadores.length === 0) {
    conteudo = (
      <View style={styles.centro}>
        <Text style={styles.vazioTexto}>Nenhum prestador de serviços disponivel no momento.</Text>
      </View>
    );
  } else {
    conteudo = (
      <FlatList
        style={styles.lista}
        data={prestadores}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={atualizando} onRefresh={aoAtualizar} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cabecalho}>
              <Text style={styles.nome}>{item.nome}</Text>
              <View style={[styles.status, item.disponivel ? styles.statusAtivo : styles.statusInativo]}>
                <Text style={styles.statusTexto}>{item.disponivel ? "Disponivel" : "Indisponivel"}</Text>
              </View>
            </View>

            {item.raio_atendimento_km != null && (
              <Text style={styles.raio}>Atende num raio de {item.raio_atendimento_km} km</Text>
            )}

            {item.servicos.length === 0 ? (
              <Text style={styles.semServico}>Nenhum servico cadastrado.</Text>
            ) : (
              item.servicos.map((servico) => (
                <View key={servico.id} style={styles.servicoLinha}>
                  <Text style={styles.servicoNome}>{servico.categoria_nome}</Text>
                  <Text style={styles.servicoPreco}>
                    R$ {Number(servico.preco_base).toFixed(2)}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}
      />
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Prestadores de Serviços" }} />
      {conteudo}
    </>
  );
}

const styles = StyleSheet.create({
  lista: {
    flex: 1,
    padding: 16,
  },
  centro: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  erroTexto: {
    color: "#b91c1c",
    textAlign: "center",
  },
  vazioTexto: {
    color: "#6b7280",
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  cabecalho: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  nome: {
    fontSize: 16,
    fontWeight: "600",
  },
  status: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  statusAtivo: {
    backgroundColor: "#dcfce7",
  },
  statusInativo: {
    backgroundColor: "#fee2e2",
  },
  statusTexto: {
    fontSize: 12,
    fontWeight: "500",
  },
  raio: {
    color: "#6b7280",
    fontSize: 13,
    marginBottom: 8,
  },
  semServico: {
    color: "#9ca3af",
    fontStyle: "italic",
  },
  servicoLinha: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  servicoNome: {
    fontSize: 14,
  },
  servicoPreco: {
    fontSize: 14,
    fontWeight: "500",
  },
});