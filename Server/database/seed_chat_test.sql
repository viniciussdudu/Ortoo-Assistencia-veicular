-- Dados reproduzíveis para validar o chat de atendimento.
-- Execute depois de 20261019_chat_atendimento.sql.
-- Credenciais de ambas as contas: senha 123456

INSERT INTO categorias_servico (nome, descricao)
SELECT 'Pneu furado', 'Atendimento para validar a conversa entre cliente e prestador'
WHERE NOT EXISTS (
  SELECT 1 FROM categorias_servico WHERE nome = 'Pneu furado'
);
SET @categoria_chat_id = (
  SELECT id FROM categorias_servico WHERE nome = 'Pneu furado' ORDER BY id LIMIT 1
);

INSERT INTO usuarios (nome, email, senha, telefone, documento, tipo_documento, tipo_usuario)
VALUES ('Cliente Chat Teste', 'cliente.chat.teste@ortoo.test', '$2b$12$nEMciBvnST6Vp2GixLreT.wRb3erPMgoRMO6yWnHe6CUU5ZlDmb/K', '63999990011', '52998224725', 'CPF', 'CLIENTE')
ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id), senha = VALUES(senha);
SET @cliente_chat_id = LAST_INSERT_ID();

INSERT INTO usuarios (nome, email, senha, telefone, documento, tipo_documento, tipo_usuario)
VALUES ('Mecânico Chat Teste', 'mecanico.chat.teste@ortoo.test', '$2b$12$nEMciBvnST6Vp2GixLreT.wRb3erPMgoRMO6yWnHe6CUU5ZlDmb/K', '63999990012', '11144477735', 'CPF', 'PRESTADOR_AUTONOMO')
ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id), senha = VALUES(senha);
SET @mecanico_chat_usuario_id = LAST_INSERT_ID();

INSERT INTO perfis_prestadores (usuario_id, nome_fantasia, raio_atendimento_km, descricao_empresa, disponivel, latitude_atual, longitude_atual)
VALUES (@mecanico_chat_usuario_id, 'Oficina Chat Teste', 20, 'Prestador exclusivo para validar o chat', TRUE, -10.184, -48.333)
ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id), disponivel = TRUE;
SET @mecanico_chat_perfil_id = LAST_INSERT_ID();

INSERT INTO servicos_prestador (prestador_id, categoria_id, preco_base)
SELECT @mecanico_chat_perfil_id, @categoria_chat_id, 50.00
WHERE NOT EXISTS (
  SELECT 1 FROM servicos_prestador
  WHERE prestador_id = @mecanico_chat_perfil_id AND categoria_id = @categoria_chat_id
);

INSERT INTO solicitacoes (cliente_id, prestador_id, categoria_id, descricao_problema, latitude_origem, longitude_origem, status)
SELECT @cliente_chat_id, @mecanico_chat_perfil_id, @categoria_chat_id,
       'Atendimento de teste para o chat', -10.184, -48.333, 'PENDENTE'
WHERE NOT EXISTS (
  SELECT 1 FROM solicitacoes
  WHERE cliente_id = @cliente_chat_id
    AND descricao_problema = 'Atendimento de teste para o chat'
    AND status IN ('PENDENTE', 'ACEITO', 'A_CAMINHO', 'EM_ANDAMENTO')
);
SET @solicitacao_chat_id = (
  SELECT id FROM solicitacoes
  WHERE cliente_id = @cliente_chat_id
    AND descricao_problema = 'Atendimento de teste para o chat'
  ORDER BY id DESC LIMIT 1
);

INSERT INTO mensagens_chat (solicitacao_id, remetente_id, conteudo)
SELECT @solicitacao_chat_id, @mecanico_chat_usuario_id,
       'Olá! Esta é uma conversa de teste. Como posso ajudar?'
WHERE NOT EXISTS (
  SELECT 1 FROM mensagens_chat
  WHERE solicitacao_id = @solicitacao_chat_id
    AND conteudo = 'Olá! Esta é uma conversa de teste. Como posso ajudar?'
);
