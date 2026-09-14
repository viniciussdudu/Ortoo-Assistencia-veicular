INSERT INTO categorias_servico (nome, descricao) VALUES
('Pane seca', 'Entrega de combustivel no local'),
('Bateria', 'Recarga ou troca de bateria'),
('Pneu', 'Troca de pneu ou reparo'),
('Chaveiro', 'Abertura de veiculo e chaves'),
('Reboque', 'Remocao do veiculo'),
('Mecanica leve', 'Reparo rapido no local');

INSERT INTO usuarios (nome, email, senha, telefone, documento, tipo_documento, tipo_usuario)
VALUES ('Cliente Teste', 'teste@ortoo.dev', 'placeholder', '63999990000', '00000000191', 'CPF', 'CLIENTE');