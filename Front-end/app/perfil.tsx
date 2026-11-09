
  import { MaterialCommunityIcons } from "@expo/vector-icons";
  import { Stack, useRouter } from "expo-router";
  import React, { useEffect, useState } from "react";
  import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
  } from "react-native";
  import { SafeAreaView } from "react-native-safe-area-context";

  import {
    ApiError,
    getUserProfile,
    logout,
    updateUserProfile,
    UserProfile,
  } from "../src/services/api";
import { Cores, PreferenciaTema, useEstilos, useTema } from "../src/tema";
import { FotoPerfil } from "../components/FotoPerfil";

const OPCOES_TEMA: {
  valor: PreferenciaTema;
  rotulo: string;
  icone: keyof typeof MaterialCommunityIcons.glyphMap;
}[] = [
  { valor: "sistema", rotulo: "Sistema", icone: "theme-light-dark" },
  { valor: "claro", rotulo: "Claro", icone: "white-balance-sunny" },
  { valor: "escuro", rotulo: "Escuro", icone: "weather-night" },
];


  export default function Perfil() {
  const { cores: CORES, preferencia, definirPreferencia } = useTema();
  const styles = useEstilos(criarEstilos);
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [saindo, setSaindo] = useState(false);
    const [usuario, setUsuario] = useState<UserProfile | null>(null);

    // Estados do Modal de Edição
    const [modalVisivel, setModalVisivel] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [telefone, setTelefone] = useState("");
    const [senhaAtual, setSenhaAtual] = useState("");
    const [erroEdicao, setErroEdicao] = useState("");
    const [avisoPerfil, setAvisoPerfil] = useState("");
    const emailAlterado = !!usuario && email.trim().toLowerCase() !== usuario.email.toLowerCase();
    const [nomeFantasia, setNomeFantasia] = useState("");
    const [descricaoEmpresa, setDescricaoEmpresa] = useState("");
    const [raioAtendimento, setRaioAtendimento] = useState("");
    const [disponivel, setDisponivel] = useState(true);

    useEffect(() => {
      fetchPerfil();
    }, []);

    const fetchPerfil = async () => {
      try {
        setLoading(true);
        const data = await getUserProfile();
        setUsuario(data);
      } catch (error) {
        Alert.alert(
          "Erro ao carregar perfil",
          error instanceof ApiError
          ? error.message
          : "Verifique sua conexão e tente novamente."
        );
      } finally {
        setLoading(false);
      }
    };

    const abrirModalEdicao = () => {
      if (!usuario) return;
      setNome(usuario.nome || "");
      setEmail(usuario.email);
      setTelefone(usuario.telefone || "");
      setSenhaAtual("");
      setErroEdicao("");
      setAvisoPerfil("");
      setNomeFantasia(usuario.prestador?.nome_fantasia || "");
      setDescricaoEmpresa(usuario.prestador?.descricao_empresa || "");
      setRaioAtendimento(
        usuario.prestador?.raio_atendimento_km
        ? String(usuario.prestador.raio_atendimento_km)
        : "15"
      );
      setDisponivel(usuario.prestador?.disponivel ?? true);
      setModalVisivel(true);
    };

    const handleSalvarPerfil = async () => {
      if (!usuario || salvando) return;
      if (!nome.trim() || !email.trim() || !telefone.trim()) {
        setErroEdicao("Preencha nome, e-mail e telefone.");
        return;
      }
      if (emailAlterado && !/^\d{6}$/.test(senhaAtual)) {
        setErroEdicao("Informe a senha atual de seis dígitos para alterar o e-mail.");
        return;
      }

      try {
        setErroEdicao("");
        setSalvando(true);
        const isPrestador = usuario.tipo_usuario !== "CLIENTE";
        await updateUserProfile({
          nome: nome.trim(),
          email: email.trim().toLowerCase(),
          telefone: telefone.trim(),
          senha_atual: emailAlterado ? senhaAtual : undefined,
          nome_fantasia: isPrestador ? nomeFantasia.trim() : undefined,
          descricao_empresa: isPrestador ? descricaoEmpresa.trim() : undefined,
          raio_atendimento_km: isPrestador ? Number(raioAtendimento) || 15 : undefined,
          disponivel: isPrestador ? disponivel : undefined,
        });

        setSenhaAtual("");
        setUsuario({ ...usuario, nome: nome.trim(), email: email.trim().toLowerCase(), telefone: telefone.trim() });
        setAvisoPerfil(emailAlterado ? "Perfil atualizado. Use o novo e-mail no próximo login." : "Perfil atualizado com sucesso.");
        setModalVisivel(false);
        await fetchPerfil();
      } catch (error) {
        setErroEdicao(
          error instanceof ApiError ? error.message : "Tente novamente."
        );
      } finally {
        setSalvando(false);
      }
    };

    const handleLogout = async () => {
      setSaindo(true);
      try {
        await logout();
        router.replace("/");
      } catch (error) {
        Alert.alert(
          "Erro ao sair",
          error instanceof ApiError ? error.message : "Tente novamente."
        );
      } finally {
        setSaindo(false);
      }
    };

    const getStatusBadge = (status: string) => {
      const isConcluido = status === "Concluído" || status === "PAGO";
      const isCancelado = status === "Cancelado" || status === "CANCELADO";

      if (isConcluido) {
        return {
          style: styles.statusConcluido,
          textoStyle: styles.statusTextoConcluido,
        };
      }
      if (isCancelado) {
        return {
          style: styles.statusCancelado,
          textoStyle: styles.statusTextoCancelado,
        };
      }
      return {
        style: styles.statusPadrao,
        textoStyle: styles.statusTextoPadrao,
      };
    };

    if (loading) {
      return (
        <View style={[styles.container, styles.center]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={CORES.destaque} />
        </View>
      );
    }

    if (!usuario) {
      return (
        <View style={[styles.container, styles.center]}>
        <Stack.Screen options={{ headerShown: false }} />
        <MaterialCommunityIcons
        name="account-off-outline"
        size={48}
        color={CORES.textoSuave}
        />
        <Text style={styles.textoErro}>
        Não foi possível carregar os dados do perfil.
        </Text>
        <TouchableOpacity style={styles.botaoAcao} onPress={fetchPerfil}>
        <Text style={styles.botaoAcaoTexto}>Tentar novamente</Text>
        </TouchableOpacity>
        </View>
      );
    }

    const isPrestador = usuario.tipo_usuario !== "CLIENTE";

    return (
      <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      >
      {/* CABEÇALHO / VOLTAR */}
      <TouchableOpacity
      style={styles.botaoVoltar}
      onPress={() => router.back()}
      >
      <MaterialCommunityIcons name="arrow-left" size={20} color={CORES.texto} />
      <Text style={styles.voltarTexto}>Voltar</Text>
      </TouchableOpacity>

      {/* HEADER PERFIL */}
      <View style={styles.header}>
        <FotoPerfil nome={usuario.nome} foto={usuario.foto_url} onChange={(foto_url) => setUsuario((atual) => atual && { ...atual, foto_url })} />

        <Text style={styles.nome}>{usuario.nome}</Text>
        <Text style={styles.infoTexto}>{usuario.email}</Text>
        {usuario.telefone ? (
          <Text style={styles.infoTexto}>{usuario.telefone}</Text>
        ) : null}

        <View style={styles.tagPerfil}>
        <Text style={styles.tagPerfilTexto}>
        {usuario.tipo_usuario === "CLIENTE"
          ? "Cliente"
          : usuario.tipo_usuario === "PRESTADOR_AUTONOMO"
          ? "Mecânico Autônomo"
          : "Empresa / Oficina"}
          </Text>
          </View>

          <TouchableOpacity style={styles.botaoAcao} onPress={abrirModalEdicao}>
          <MaterialCommunityIcons
          name="account-edit-outline"
          size={18}
          color={CORES.destaque}
          />
          <Text style={styles.botaoAcaoTexto}>Editar perfil</Text>
          </TouchableOpacity>
          {!!avisoPerfil && <Text accessibilityLiveRegion="polite" style={[styles.infoTexto, { color: CORES.sucesso }]}>{avisoPerfil}</Text>}
          </View>

          {/* DADOS ESPECÍFICOS DO PRESTADOR */}
          {isPrestador && usuario.prestador && (
            <View style={styles.secaoContainer}>
            <Text style={styles.secaoTitulo}>Dados Profissionais</Text>
            <View style={styles.card}>
            <View style={styles.linhaDetalhe}>
            <Text style={styles.rotulo}>Nome Fantasia:</Text>
            <Text style={styles.valor}>
            {usuario.prestador.nome_fantasia || "Não informado"}
            </Text>
            </View>

            <View style={styles.linhaDetalhe}>
            <Text style={styles.rotulo}>Raio de Atendimento:</Text>
            <Text style={styles.valor}>
            {usuario.prestador.raio_atendimento_km} km
            </Text>
            </View>

            <View style={styles.linhaDetalhe}>
            <Text style={styles.rotulo}>Status Chamados:</Text>
            <Text
            style={[
              styles.valor,
              {
                color: usuario.prestador.disponivel
                ? CORES.sucesso
                : CORES.erro,
              },
            ]}
            >
            {usuario.prestador.disponivel ? "Disponível" : "Indisponível"}
            </Text>
            </View>

            {usuario.prestador.descricao_empresa ? (
              <View style={{ marginTop: 8 }}>
              <Text style={styles.rotulo}>Descrição / Serviços:</Text>
              <Text style={styles.descricaoCorpo}>
              {usuario.prestador.descricao_empresa}
              </Text>
              </View>
            ) : null}
            </View>
            </View>
          )}

          {/* MEU VEÍCULO (SE TIVER) */}
          {usuario.veiculo && (
            <View style={styles.secaoContainer}>
            <Text style={styles.secaoTitulo}>Meu veículo</Text>
            <View style={styles.card}>
            <View style={styles.cardHeader}>
            <MaterialCommunityIcons
            name="car-sports"
            size={24}
            color={CORES.destaque}
            />
            <Text style={styles.veiculoModelo}>
            {usuario.veiculo.modelo}
            </Text>
            </View>
            <Text style={styles.veiculoInfo}>
            Placa:{" "}
            <Text style={styles.destaqueTexto}>
            {usuario.veiculo.placa}
            </Text>{" "}
            • Cor: {usuario.veiculo.cor}
            </Text>
            </View>
            </View>
          )}

          <View style={styles.secaoContainer}>
            <Text style={styles.secaoTitulo}>Ajuda &amp; Atendimento</Text>
            <TouchableOpacity
              style={styles.cardBotao}
              onPress={() => router.push("/suporte")}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons name="headset" size={22} color={CORES.destaque} />
                <Text style={styles.cardBotaoTexto}>Falar com o Suporte</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color={CORES.textoSuave} />
            </TouchableOpacity>
          </View>

          {/* FORMAS DE PAGAMENTO */}
          <View style={styles.secaoContainer}>
          <Text style={styles.secaoTitulo}>Formas de Pagamento</Text>
          <TouchableOpacity
          style={styles.cardBotao}
          onPress={() => router.push("/adicionar-cartao")}
          activeOpacity={0.8}
          >
          <View style={styles.cardHeader}>
          <MaterialCommunityIcons
          name="credit-card-plus-outline"
          size={22}
          color={CORES.destaque}
          />
          <Text style={styles.cardBotaoTexto}>Adicionar novo cartão</Text>
          </View>
          <MaterialCommunityIcons
          name="chevron-right"
          size={22}
          color={CORES.textoSuave}
          />
          </TouchableOpacity>
          </View>

          {/* HISTÓRICO DE ATENDIMENTOS */}
          <View style={styles.secaoContainer}>
          <Text style={styles.secaoTitulo}>Histórico de atendimentos</Text>
          {usuario.historico && usuario.historico.length > 0 ? (
            usuario.historico.map((item) => {
              const badge = getStatusBadge(item.status);
              return (
                <View key={item.id} style={styles.card}>
                <View style={styles.historicoLinha}>
                <View style={styles.historicoInfo}>
                <Text style={styles.historicoProblema}>
                {item.problema || "Solicitação de Socorro"}
                </Text>
                <Text style={styles.historicoData}>{item.data}</Text>
                </View>
                <View style={[styles.statusBadge, badge.style]}>
                <Text style={badge.textoStyle}>{item.status}</Text>
                </View>
                </View>
                </View>
              );
            })
          ) : (
            <Text style={styles.textoVazio}>
            Nenhum histórico de atendimento encontrado.
            </Text>
          )}
          </View>

          {/* APARÊNCIA */}
          <View style={styles.secaoContainer}>
            <Text style={styles.secaoTitulo}>Aparência</Text>
            <View style={styles.temaOpcoes}>
              {OPCOES_TEMA.map((opcao) => {
                const ativo = preferencia === opcao.valor;
                return (
                  <TouchableOpacity
                    key={opcao.valor}
                    style={[styles.temaOpcao, ativo && styles.temaOpcaoAtiva]}
                    onPress={() => definirPreferencia(opcao.valor)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityState={{ selected: ativo }}
                  >
                    <MaterialCommunityIcons
                      name={opcao.icone}
                      size={20}
                      color={ativo ? CORES.sobrePrimaria : CORES.textoSuave}
                    />
                    <Text style={[styles.temaOpcaoTexto, ativo && styles.temaOpcaoTextoAtivo]}>
                      {opcao.rotulo}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* BOTÃO DE SAIR */}
          <TouchableOpacity
          style={[styles.botaoSair, saindo && styles.botaoSairDesabilitado]}
          onPress={handleLogout}
          disabled={saindo}
          activeOpacity={0.8}
          >
          {saindo ? (
            <ActivityIndicator color={CORES.erro} size="small" />
          ) : (
            <>
            <MaterialCommunityIcons
            name="logout"
            size={20}
            color={CORES.erro}
            />
            <Text style={styles.botaoSairTexto}>Sair da Conta</Text>
            </>
          )}
          </TouchableOpacity>
          </ScrollView>

          {/* MODAL DE EDIÇÃO DE PERFIL */}
          <Modal
          visible={modalVisivel}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalVisivel(false)}
          >
          <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalFundo}
          >
          <View style={styles.modalConteudo}>
          <View style={styles.modalCabecalho}>
          <Text style={styles.modalTitulo}>Editar Perfil</Text>
          <TouchableOpacity onPress={() => setModalVisivel(false)}>
          <MaterialCommunityIcons name="close" size={24} color={CORES.texto} />
          </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.modalLabel}>Nome</Text>
          <TextInput
          style={styles.modalInput}
          value={nome}
          onChangeText={setNome}
          accessibilityLabel="Nome"
          maxLength={100}
          placeholder="Seu nome"
          placeholderTextColor={CORES.textoSuave}
          />

          <Text style={styles.modalLabel}>E-mail</Text>
          <TextInput
            style={styles.modalInput}
            accessibilityLabel="E-mail"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            maxLength={100}
          />

          <Text style={styles.modalLabel}>Telefone / WhatsApp</Text>
          <TextInput
          style={styles.modalInput}
          accessibilityLabel="Telefone / WhatsApp"
          value={telefone}
          onChangeText={setTelefone}
          maxLength={20}
          placeholder="Ex: 63999998888"
          placeholderTextColor={CORES.textoSuave}
          keyboardType="phone-pad"
          />

          {emailAlterado && (
            <>
              <Text style={styles.modalLabel}>Senha atual para alterar o e-mail</Text>
              <TextInput
                style={styles.modalInput}
                accessibilityLabel="Senha atual"
                value={senhaAtual}
                onChangeText={setSenhaAtual}
                secureTextEntry
                keyboardType="number-pad"
                maxLength={6}
              />
            </>
          )}

          {isPrestador && (
            <>
            <Text style={styles.modalSubsecao}>Dados da Empresa</Text>

            <Text style={styles.modalLabel}>Nome Fantasia</Text>
            <TextInput
            style={styles.modalInput}
            value={nomeFantasia}
            onChangeText={setNomeFantasia}
            placeholder="Nome da oficina / mecânico"
            placeholderTextColor={CORES.textoSuave}
            />

            <Text style={styles.modalLabel}>Descrição / Especialidades</Text>
            <TextInput
            style={[styles.modalInput, styles.modalTextArea]}
            value={descricaoEmpresa}
            onChangeText={setDescricaoEmpresa}
            placeholder="Serviços oferecidos"
            placeholderTextColor={CORES.textoSuave}
            multiline
            numberOfLines={3}
            />

            <Text style={styles.modalLabel}>Raio de Atendimento (km)</Text>
            <TextInput
            style={styles.modalInput}
            value={raioAtendimento}
            onChangeText={setRaioAtendimento}
            placeholder="Ex: 15"
            placeholderTextColor={CORES.textoSuave}
            keyboardType="numeric"
            />

            <View style={styles.switchLinha}>
            <Text style={styles.modalLabel}>Disponível para chamados</Text>
            <Switch
            value={disponivel}
            onValueChange={setDisponivel}
            trackColor={{ false: CORES.borda, true: CORES.primaria }}
            thumbColor={disponivel ? CORES.destaque : CORES.textoSuave}
            />
            </View>
            </>
          )}

          {!!erroEdicao && <Text accessibilityRole="alert" style={{ color: CORES.erro, marginTop: 12 }}>{erroEdicao}</Text>}
          <TouchableOpacity
          style={[
            styles.botaoSalvarModal,
            salvando && styles.botaoSairDesabilitado,
          ]}
          onPress={handleSalvarPerfil}
          disabled={salvando}
          >
          {salvando ? (
            <ActivityIndicator color={CORES.sobrePrimaria} />
          ) : (
            <Text style={styles.botaoSalvarTexto}>Salvar Alterações</Text>
          )}
          </TouchableOpacity>
          </ScrollView>
          </View>
          </KeyboardAvoidingView>
          </Modal>
          </SafeAreaView>
    );
  }

  const criarEstilos = (CORES: Cores) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: CORES.fundo,
    },
    center: {
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 24,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 40,
    },
    botaoVoltar: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      gap: 6,
      marginBottom: 20,
      paddingVertical: 6,
    },
    voltarTexto: {
      color: CORES.texto,
      fontSize: 15,
      fontWeight: "600",
    },
    header: {
      alignItems: "center",
      marginBottom: 32,
    },
    nome: {
      fontSize: 22,
      fontWeight: "800",
      color: CORES.texto,
      marginBottom: 4,
    },
    infoTexto: {
      fontSize: 14,
      color: CORES.textoSuave,
      marginTop: 2,
    },
    tagPerfil: {
      backgroundColor: CORES.destaqueSuave,
                                   borderColor: CORES.primaria,
                                   borderWidth: 1,
                                   borderRadius: 12,
                                   paddingHorizontal: 10,
                                   paddingVertical: 4,
                                   marginTop: 8,
    },
    tagPerfilTexto: {
      color: CORES.destaque,
      fontSize: 12,
      fontWeight: "700",
    },
    botaoAcao: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 16,
      backgroundColor: CORES.cartao,
      borderWidth: 1,
      borderColor: CORES.borda,
      borderRadius: 20,
      paddingVertical: 8,
      paddingHorizontal: 18,
    },
    botaoAcaoTexto: {
      color: CORES.destaque,
      fontWeight: "600",
      fontSize: 14,
    },
    secaoContainer: {
      marginBottom: 24,
    },
    secaoTitulo: {
      fontSize: 13,
      fontWeight: "700",
      color: CORES.textoSuave,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: 12,
    },
    card: {
      backgroundColor: CORES.cartao,
      borderWidth: 1,
      borderColor: CORES.borda,
      borderRadius: 16,
      padding: 16,
      marginBottom: 10,
    },
    linhaDetalhe: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    rotulo: {
      color: CORES.textoSuave,
      fontSize: 14,
    },
    valor: {
      color: CORES.texto,
      fontWeight: "600",
      fontSize: 14,
    },
    descricaoCorpo: {
      color: CORES.texto,
      fontSize: 13,
      marginTop: 4,
      lineHeight: 18,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    veiculoModelo: {
      fontSize: 16,
      fontWeight: "700",
      color: CORES.texto,
    },
    veiculoInfo: {
      fontSize: 13,
      color: CORES.textoSuave,
      marginTop: 8,
    },
    destaqueTexto: {
      color: CORES.texto,
      fontWeight: "600",
    },
    cardBotao: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: CORES.cartao,
      borderWidth: 1,
      borderColor: CORES.borda,
      borderRadius: 16,
      padding: 16,
    },
    cardBotaoTexto: {
      fontSize: 15,
      fontWeight: "600",
      color: CORES.texto,
    },
    historicoLinha: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    historicoInfo: {
      flex: 1,
      marginRight: 10,
    },
    historicoProblema: {
      fontSize: 15,
      fontWeight: "600",
      color: CORES.texto,
    },
    historicoData: {
      fontSize: 13,
      color: CORES.textoSuave,
      marginTop: 4,
    },
    statusBadge: {
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    statusConcluido: {
      backgroundColor: CORES.sucessoSuave,
    },
    statusTextoConcluido: {
      color: CORES.sucesso,
      fontSize: 12,
      fontWeight: "700",
    },
    statusCancelado: {
      backgroundColor: CORES.erroSuave,
    },
    statusTextoCancelado: {
      color: CORES.erro,
      fontSize: 12,
      fontWeight: "700",
    },
    statusPadrao: {
      backgroundColor: CORES.borda,
    },
    statusTextoPadrao: {
      color: CORES.textoSuave,
      fontSize: 12,
      fontWeight: "700",
    },
    botaoSair: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: CORES.erroSuave,
                                   borderWidth: 1,
                                   borderColor: CORES.erro,
                                   borderRadius: 12,
                                   paddingVertical: 14,
                                   marginTop: 12,
    },
    botaoSairDesabilitado: {
      opacity: 0.5,
    },
    botaoSairTexto: {
      color: CORES.erro,
      fontWeight: "700",
      fontSize: 15,
    },
    textoErro: {
      fontSize: 15,
      color: CORES.textoSuave,
      marginTop: 12,
      marginBottom: 20,
      textAlign: "center",
    },
    textoVazio: {
      fontSize: 14,
      color: CORES.textoSuave,
      textAlign: "center",
      marginVertical: 16,
    },
    modalFundo: {
      flex: 1,
      backgroundColor: CORES.sobreposicao,
                                   justifyContent: "flex-end",
    },
    modalConteudo: {
      backgroundColor: CORES.cartao,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      maxHeight: "85%",
    },
    modalCabecalho: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    },
    modalTitulo: {
      color: CORES.texto,
      fontSize: 18,
      fontWeight: "700",
    },
    modalLabel: {
      color: CORES.textoSuave,
      fontSize: 13,
      marginBottom: 6,
    },
    modalSubsecao: {
      color: CORES.destaque,
      fontSize: 14,
      fontWeight: "700",
      marginTop: 12,
      marginBottom: 10,
      textTransform: "uppercase",
    },
    modalInput: {
      backgroundColor: CORES.fundo,
      color: CORES.texto,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 15,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: CORES.borda,
    },
    modalTextArea: {
      height: 70,
      textAlignVertical: "top",
    },
    switchLinha: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    temaOpcoes: {
      flexDirection: "row",
      gap: 8,
      backgroundColor: CORES.cartao,
      borderWidth: 1,
      borderColor: CORES.borda,
      borderRadius: 12,
      padding: 6,
    },
    temaOpcao: {
      flex: 1,
      alignItems: "center",
      gap: 4,
      paddingVertical: 10,
      borderRadius: 8,
    },
    temaOpcaoAtiva: {
      backgroundColor: CORES.primaria,
    },
    temaOpcaoTexto: {
      color: CORES.textoSuave,
      fontSize: 13,
      fontWeight: "600",
    },
    temaOpcaoTextoAtivo: {
      color: CORES.sobrePrimaria,
    },
    botaoSalvarModal: {
      backgroundColor: CORES.primaria,
      borderRadius: 10,
      paddingVertical: 14,
      alignItems: "center",
      marginTop: 10,
      marginBottom: 20,
    },
    botaoSalvarTexto: {
      color: CORES.sobrePrimaria,
      fontSize: 15,
      fontWeight: "700",
    },
  });
