-- 1. Tabela de Usuários (Clientes, Autônomos e Empresas)
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    stripe_customer_id VARCHAR(255),
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    documento VARCHAR(18) NOT NULL UNIQUE, -- Guarda CPF ou cnpj
    tipo_documento ENUM('CPF', 'CNPJ') NOT NULL,
    tipo_usuario ENUM('CLIENTE', 'PRESTADOR_AUTONOMO', 'EMPRESA') NOT NULL DEFAULT 'CLIENTE',
    foto_url VARCHAR(255) DEFAULT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Categorias de Serviços Oferecidos no Ortoo
CREATE TABLE IF NOT EXISTS categorias_servico (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    descricao VARCHAR(255),
    icone_url VARCHAR(255)
);

-- 3. Perfil Detalhado do Prestador/Empresa
CREATE TABLE IF NOT EXISTS perfis_prestadores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL UNIQUE,
    nome_fantasia VARCHAR(100),
    raio_atendimento_km INT DEFAULT 15,
    descricao_empresa TEXT,
    disponivel BOOLEAN DEFAULT TRUE,
    latitude_atual DECIMAL(10, 8),
    longitude_atual DECIMAL(11, 8),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- 4. Serviços Oferecidos pelo Prestador/Empresa e Preços
CREATE TABLE IF NOT EXISTS servicos_prestador (
    id INT AUTO_INCREMENT PRIMARY KEY,
    prestador_id INT NOT NULL,
    categoria_id INT NOT NULL,
    preco_base DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (prestador_id) REFERENCES perfis_prestadores(id) ON DELETE CASCADE,
    FOREIGN KEY (categoria_id) REFERENCES categorias_servico(id) ON DELETE CASCADE
);

-- 5. Solicitações / Chamados do Ortoo
CREATE TABLE IF NOT EXISTS solicitacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    prestador_id INT,
    categoria_id INT NOT NULL,
    status ENUM('PENDENTE', 'ACEITO', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO') DEFAULT 'PENDENTE',
    descricao_problema TEXT,
    latitude_origem DECIMAL(10, 8) NOT NULL,
    longitude_origem DECIMAL(11, 8) NOT NULL,
    valor_estimado DECIMAL(10, 2),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES usuarios(id),
    FOREIGN KEY (prestador_id) REFERENCES perfis_prestadores(id),
    FOREIGN KEY (categoria_id) REFERENCES categorias_servico(id)
);

-- 6. Cartões do Usuário usando Stripe

CREATE TABLE IF NOT EXISTS cartoes_usuario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    gateway VARCHAR(30) NOT NULL DEFAULT 'stripe', 
    token_gateway VARCHAR(255) NOT NULL,
    ultimos_digitos VARCHAR(4) NOT NULL,
    bandeira VARCHAR(20), 
    validade_mes TINYINT,
    validade_ano SMALLINT,
    apelido VARCHAR(50),
    principal BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- 7. Transações

CREATE TABLE IF NOT EXISTS transacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    solicitacao_id INT NOT NULL,
    stripe_payment_intent_id VARCHAR(255),
    valor DECIMAL(10, 2) NOT NULL,
    status VARCHAR(30) NOT NULL, -- succeeded, failed, pending
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (solicitacao_id) REFERENCES solicitacoes(id)
);

-- 8. Veículos do cliente
CREATE TABLE IF NOT EXISTS veiculos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    tipo ENUM('CARRO','MOTO','BICICLETA','BIKE_ELETRICA','CAMINHAO') NOT NULL DEFAULT 'CARRO',
    marca VARCHAR(50),
    modelo VARCHAR(50) NOT NULL,
    ano INT,
    placa VARCHAR(10),
    cor VARCHAR(30),
    km_atual INT DEFAULT 0,
    km_atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- 9. Manutenções registradas no veículo
CREATE TABLE IF NOT EXISTS manutencoes_veiculo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    veiculo_id INT NOT NULL,
    solicitacao_id INT NULL,
    tipo VARCHAR(50) NOT NULL,
    descricao TEXT,
    km_na_execucao INT,
    custo DECIMAL(10,2),
    executado_em DATE NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (veiculo_id) REFERENCES veiculos(id) ON DELETE CASCADE,
    FOREIGN KEY (solicitacao_id) REFERENCES solicitacoes(id)
);
