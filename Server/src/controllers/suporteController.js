const db = require("../config/db");

// Lista o histórico de mensagens do usuário autenticado
async function listarMensagens(req, res, next) {
    try {
        const usuarioId = req.userId;

        const [mensagens] = await db.query(
            `SELECT
            id,
            usuario_id,
            remetente_tipo,
            conteudo,
            criado_em
            FROM suporte_mensagens
            WHERE usuario_id = ?
            ORDER BY criado_em ASC`,
            [usuarioId]
        );

        return res.status(200).json(mensagens);
    } catch (error) {
        return next(error);
    }
}

// Respostas prontas para a triagem rápida
const RESPOSTAS_TRIAGEM = {
    pagamento:
    "Sobre pagamentos: aceitamos cartões de crédito via Stripe. Você pode cadastrar ou alterar seus cartões diretamente no menu Perfil > Formas de Pagamento. Teve alguma cobrança indevida?",
    mecanico:
    "Sobre o socorro mecânico: você pode acompanhar a rota e localização do prestador em tempo real na tela do chamado. Caso ele esteja atrasado, você também pode ligar diretamente pelo número informado no card do prestador.",
    chamado:
    "Sobre chamados: se precisar cancelar uma solicitação pendente, use o botão 'Cancelar' na tela do pedido. Se o status já for 'A Caminho', o cancelamento pode requerer contato com a central.",
    duvidas:
    "O Örtöö conecta você ao socorro mecânico mais próximo em minutos. Em que mais podemos te ajudar com sua conta ou veículos?",
};

// Envia a mensagem do usuário e dispara a resposta correspondente
async function enviarMensagem(req, res, next) {
    try {
        const usuarioId = req.userId;
        const { conteudo } = req.body;

        if (!conteudo || !conteudo.trim()) {
            return res.status(400).json({ erro: "O conteúdo da mensagem é obrigatório." });
        }

        const textoFormatado = conteudo.trim();

        // 1. Salva a mensagem do usuário
        const [result] = await db.query(
            `INSERT INTO suporte_mensagens (usuario_id, remetente_tipo, conteudo)
            VALUES (?, 'USUARIO', ?)`,
                                        [usuarioId, textoFormatado]
        );

        const mensagemCriada = {
            id: result.insertId,
            usuario_id: usuarioId,
            remetente_tipo: "USUARIO",
            conteudo: textoFormatado,
            criado_em: new Date().toISOString(),
        };

        // 2. Lógica de resposta automática baseada no tema clicado ou digitado
        const textoMinusculo = textoFormatado.toLowerCase();
        let respostaAutomatica = null;

        if (textoMinusculo.includes("pagamento") || textoMinusculo.includes("cartão")) {
            respostaAutomatica = RESPOSTAS_TRIAGEM.pagamento;
        } else if (textoMinusculo.includes("mecânico") || textoMinusculo.includes("atraso") || textoMinusculo.includes("guincho")) {
            respostaAutomatica = RESPOSTAS_TRIAGEM.mecanico;
        } else if (textoMinusculo.includes("cancelar") || textoMinusculo.includes("chamado") || textoMinusculo.includes("solicitação")) {
            respostaAutomatica = RESPOSTAS_TRIAGEM.chamado;
        } else if (textoMinusculo.includes("dúvida") || textoMinusculo.includes("como funciona")) {
            respostaAutomatica = RESPOSTAS_TRIAGEM.duvidas;
        }

        // Se identificou um tema ou se é a 1ª mensagem do usuário
        if (respostaAutomatica) {
            await db.query(
                `INSERT INTO suporte_mensagens (usuario_id, remetente_tipo, conteudo)
                VALUES (?, 'SUPORTE', ?)`,
                           [usuarioId, respostaAutomatica]
            );
        } else {
            const [historicoCount] = await db.query(
                `SELECT COUNT(*) AS total FROM suporte_mensagens WHERE usuario_id = ?`,
                                                    [usuarioId]
            );

            if (historicoCount[0].total === 1) {
                await db.query(
                    `INSERT INTO suporte_mensagens (usuario_id, remetente_tipo, conteudo)
                    VALUES (?, 'SUPORTE', ?)`,
                               [
                                   usuarioId,
                               "Olá! Sou o assistente virtual do Örtöö. Selecione uma das opções acima ou descreva detalhadamente sua dúvida para nossa equipe.",
                               ]
                );
            }
        }

        return res.status(201).json(mensagemCriada);
    } catch (error) {
        return next(error);
    }
}

module.exports = {
    listarMensagens,
    enviarMensagem,
};
