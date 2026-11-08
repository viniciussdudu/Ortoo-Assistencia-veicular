import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
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
import {
    ApiError,
    enviarMensagemSuporte,
    listarMensagensSuporte,
    MensagemSuporte,
} from "../src/services/api";
import { useTema } from "../src/tema";

const OPCOES_TRIAGEM = [
    { id: "1", icone: "credit-card-outline", rotulo: "Problemas com Pagamento", textoEnvio: "Preciso de ajuda com pagamentos ou cartões" },
{ id: "2", icone: "wrench-clock", rotulo: "Atraso do Mecânico", textoEnvio: "Meu mecânico solicitado está atrasado" },
{ id: "3", icone: "cancel", rotulo: "Cancelar Chamado", textoEnvio: "Como faço para cancelar um chamado?" },
{ id: "4", icone: "help-circle-outline", rotulo: "Dúvidas sobre o App", textoEnvio: "Tenho dúvidas de como funciona o app" },
];

export default function SuporteScreen() {
    const router = useRouter();
    const { cores } = useTema();

    const [mensagens, setMensagens] = useState<MensagemSuporte[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [enviando, setEnviando] = useState(false);
    const [texto, setTexto] = useState("");
    const flatListRef = useRef<FlatList<MensagemSuporte>>(null);

    const carregarMensagens = async (silencioso = false) => {
        try {
            if (!silencioso) setCarregando(true);
            const data = await listarMensagensSuporte();
            setMensagens(data);
        } catch {
            // Ignora falhas em polling de segundo plano
        } finally {
            if (!silencioso) setCarregando(false);
        }
    };

    useEffect(() => {
        carregarMensagens();
        const intervalo = setInterval(() => {
            carregarMensagens(true);
        }, 4000);
        return () => clearInterval(intervalo);
    }, []);

    const dispararEnvio = async (mensagemTexto: string) => {
        const conteudo = mensagemTexto.trim();
        if (!conteudo || enviando) return;

        try {
            setEnviando(true);
            setTexto("");
            const novaMensagem = await enviarMensagemSuporte(conteudo);
            setMensagens((prev) => [...prev, novaMensagem]);

            setTimeout(() => {
                carregarMensagens(true);
            }, 700);
        } catch (err) {
            if (err instanceof ApiError) {
                alert(err.message);
            } else {
                alert("Não foi possível enviar a mensagem.");
            }
        } finally {
            setEnviando(false);
        }
    };

    const handleEnviar = () => {
        dispararEnvio(texto);
    };

    const handleOpcaoRapida = (textoOpcao: string) => {
        dispararEnvio(textoOpcao);
    };

    const renderItem = ({ item }: { item: MensagemSuporte }) => {
        const isMinha = item.remetente_tipo === "USUARIO";
        const hora = new Date(item.criado_em).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });

        return (
            <View
            style={[
                styles.balaoLinha,
                isMinha ? styles.balaoLinhaDireita : styles.balaoLinhaEsquerda,
            ]}
            >
            {!isMinha && (
                <View style={styles.iconeSuporte}>
                <MaterialCommunityIcons name="face-agent" size={18} color="#38bdf8" />
                </View>
            )}
            <View
            style={[
                styles.balao,
                isMinha ? styles.balaoUsuario : styles.balaoSuporte,
            ]}
            >
            <Text style={styles.mensagemTexto}>{item.conteudo}</Text>
            <Text
            style={[
                styles.horaTexto,
                isMinha ? styles.horaUsuario : styles.horaSuporte,
            ]}
            >
            {hora}
            </Text>
            </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: cores.fundo }]}>
        <Stack.Screen options={{ headerShown: false }} />

        {/* Cabeçalho */}
        <View style={styles.header}>
        <TouchableOpacity
        style={styles.botaoVoltar}
        onPress={() => router.back()}
        >
        <MaterialCommunityIcons name="arrow-left" size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
        <Text style={styles.tituloHeader}>Suporte Örtöö</Text>
        <View style={styles.onlineBadge}>
        <View style={styles.bolinhaVerde} />
        <Text style={styles.subtituloHeader}>Triagem e atendimento online</Text>
        </View>
        </View>
        </View>

        {/* Lista de Mensagens */}
        {carregando ? (
            <View style={styles.center}>
            <ActivityIndicator size="large" color="#38bdf8" />
            </View>
        ) : (
            <FlatList
            ref={flatListRef}
            data={mensagens}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            contentContainerStyle={styles.listaMensagens}
            onContentSizeChange={() =>
                flatListRef.current?.scrollToEnd({ animated: true })
            }
            ListEmptyComponent={
                <View style={styles.vazioContainer}>
                <MaterialCommunityIcons
                name="chat-processing-outline"
                size={48}
                color="#6b7280"
                />
                <Text style={styles.vazioTexto}>
                Selecione um tópico abaixo ou envie uma mensagem para iniciar o atendimento.
                </Text>
                </View>
            }
            />
        )}

        {/* Barra de Opções Rápidas (Chips) */}
        <View style={styles.containerOpcoes}>
        <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollOpcoes}
        >
        {OPCOES_TRIAGEM.map((opcao) => (
            <TouchableOpacity
            key={opcao.id}
            style={styles.chipOpcao}
            onPress={() => handleOpcaoRapida(opcao.textoEnvio)}
            disabled={enviando}
            activeOpacity={0.7}
            >
            <MaterialCommunityIcons
            name={opcao.icone as any}
            size={16}
            color="#38bdf8"
            />
            <Text style={styles.chipTexto}>{opcao.rotulo}</Text>
            </TouchableOpacity>
        ))}
        </ScrollView>
        </View>

        {/* Campo de Entrada e Botão Enviar */}
        <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
        <View style={styles.inputContainer}>
        <TextInput
        style={styles.input}
        placeholder="Digite sua dúvida ou mensagem..."
        placeholderTextColor="#6b7280"
        value={texto}
        onChangeText={setTexto}
        multiline
        maxLength={500}
        blurOnSubmit={false}
        onSubmitEditing={handleEnviar}
        {...(Platform.OS === "web"
            ? {
                onKeyDown: (e: any) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleEnviar();
                    }
                },
            }
            : {})}
            />
            <TouchableOpacity
            style={[
                styles.botaoEnviar,
                (!texto.trim() || enviando) && styles.botaoEnviarDesabilitado,
            ]}
            onPress={handleEnviar}
            disabled={!texto.trim() || enviando}
            >
            {enviando ? (
                <ActivityIndicator size="small" color="#ffffff" />
            ) : (
                <MaterialCommunityIcons name="send" size={20} color="#ffffff" />
            )}
            </TouchableOpacity>
            </View>
            </KeyboardAvoidingView>
            </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: "#1f2937",
        backgroundColor: "#111827",
    },
    botaoVoltar: {
        marginRight: 14,
        padding: 4,
    },
    headerInfo: {
        flex: 1,
    },
    tituloHeader: {
        fontSize: 18,
        fontWeight: "700",
        color: "#ffffff",
    },
    onlineBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginTop: 2,
    },
    bolinhaVerde: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#22c55e",
    },
    subtituloHeader: {
        fontSize: 12,
        color: "#9ca3af",
    },
    listaMensagens: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        gap: 12,
    },
    balaoLinha: {
        flexDirection: "row",
        alignItems: "flex-end",
        marginVertical: 4,
    },
    balaoLinhaDireita: {
        justifyContent: "flex-end",
    },
    balaoLinhaEsquerda: {
        justifyContent: "flex-start",
    },
    iconeSuporte: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: "#1e293b",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 8,
        marginBottom: 4,
    },
    balao: {
        maxWidth: "78%",
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    balaoUsuario: {
        backgroundColor: "#2563eb",
        borderBottomRightRadius: 4,
    },
    balaoSuporte: {
        backgroundColor: "#1f2937",
        borderBottomLeftRadius: 4,
    },
    mensagemTexto: {
        color: "#ffffff",
        fontSize: 15,
        lineHeight: 20,
    },
    horaTexto: {
        fontSize: 11,
        marginTop: 4,
        alignSelf: "flex-end",
    },
    horaUsuario: {
        color: "#bfdbfe",
    },
    horaSuporte: {
        color: "#9ca3af",
    },
    vazioContainer: {
        alignItems: "center",
        justifyContent: "center",
        marginTop: 60,
        paddingHorizontal: 32,
        gap: 12,
    },
    vazioTexto: {
        color: "#6b7280",
        fontSize: 14,
        textAlign: "center",
        lineHeight: 20,
    },
    containerOpcoes: {
        paddingVertical: 8,
        backgroundColor: "#0f172a",
        borderTopWidth: 1,
        borderTopColor: "#1e293b",
    },
    scrollOpcoes: {
        paddingHorizontal: 14,
        gap: 8,
    },
    chipOpcao: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: "#1e293b",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#334155",
    },
    chipTexto: {
        color: "#e2e8f0",
        fontSize: 13,
        fontWeight: "600",
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: "#111827",
        borderTopWidth: 1,
        borderTopColor: "#1f2937",
        gap: 10,
    },
    input: {
        flex: 1,
        backgroundColor: "#1f2937",
        color: "#ffffff",
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 15,
        maxHeight: 100,
    },
    botaoEnviar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "#2563eb",
        alignItems: "center",
        justifyContent: "center",
    },
    botaoEnviarDesabilitado: {
        backgroundColor: "#374151",
        opacity: 0.6,
    },
});
