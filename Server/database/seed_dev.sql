INSERT INTO categorias_servico (nome, descricao) VALUES
('Pane seca', 'Entrega de combustivel no local'),
('Bateria', 'Recarga ou troca de bateria'),
('Pneu', 'Troca de pneu ou reparo'),
('Chaveiro', 'Abertura de veiculo e chaves'),
('Reboque', 'Remocao do veiculo'),
('Mecanica leve', 'Reparo rapido no local');

INSERT INTO usuarios (nome, email, senha, telefone, documento, tipo_documento, tipo_usuario)
VALUES ('Cliente Teste', 'teste@ortoo.dev', 'placeholder', '63999990000', '00000000191', 'CPF', 'CLIENTE');

-- Usuários prestadores para teste
INSERT INTO usuarios (nome, email, senha, telefone, documento, tipo_documento, tipo_usuario) VALUES
('João Reboques Palmas', 'joao.reboque@ortoo.dev', 'placeholder', '63999001001', '11122233344', 'CPF', 'PRESTADOR_AUTONOMO'),
('Carlos Chaveiro 24h', 'carlos.chaveiro@ortoo.dev', 'placeholder', '63999001002', '22233344455', 'CPF', 'PRESTADOR_AUTONOMO'),
('Auto Socorro Capim Dourado LTDA', 'contato@autosocorrocd.dev', 'placeholder', '63999001003', '11222333000144', 'CNPJ', 'EMPRESA'),
('Marcos Borracharia Express', 'marcos.pneu@ortoo.dev', 'placeholder', '63999001004', '33344455566', 'CPF', 'PRESTADOR_AUTONOMO'),
('Bateria Já Palmas', 'contato@bateriaja.dev', 'placeholder', '63999001005', '44222333000155', 'CNPJ', 'EMPRESA');

-- Marcos Borracharia -> próximo à UFT (Universidade Federal do Tocantins)
INSERT INTO perfis_prestadores (usuario_id, nome_fantasia, raio_atendimento_km, descricao_empresa, disponivel, latitude_atual, longitude_atual)
SELECT id, 'Borracharia Express Marcos', 10, 'Troca de pneu no local em até 30 minutos', TRUE, -10.17250000, -48.36260000
FROM usuarios WHERE email = 'marcos.pneu@ortoo.dev';

INSERT INTO servicos_prestador (prestador_id, categoria_id, preco_base)
SELECT p.id, c.id, 60.00
FROM perfis_prestadores p
JOIN usuarios u ON p.usuario_id = u.id
JOIN categorias_servico c ON c.nome = 'Pneu'
WHERE u.email = 'marcos.pneu@ortoo.dev';
