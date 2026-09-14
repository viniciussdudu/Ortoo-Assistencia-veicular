-- 1. Tabela de Usuários (Clientes, Autônomos e Empresas)
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    documento VARCHAR(18) NOT NULL UNIQUE, -- Guarda CPF ou cnpj
    tipo_documento ENUM('CPF', 'CNPJ') NOT NULL,
    tipo_usuario ENUM('CLIENTE', 'PRESTADOR_AUTONOMO', 'EMPRESA') NOT NULL DEFAULT 'CLIENTE',
    foto_url VARCHAR(255) DEFAULT NULL, -- URL ou caminho da foto de perfil / logo da empresa
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Categorias de Serviços Oferecidos no Ortoo
CREATE TABLE categorias_servico (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    descricao VARCHAR(255),
    icone_url VARCHAR(255)
);

-- 3. Perfil Detalhado do Prestador/Empresa
CREATE TABLE perfis_prestadores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL UNIQUE,
    nome_fantasia VARCHAR(100), -- Razão Social ou Nome Comercial para Empresas
    raio_atendimento_km INT DEFAULT 15, -- Raio em km que o prestador aceita chamados
    descricao_empresa TEXT,
    disponivel BOOLEAN DEFAULT TRUE,
    latitude_atual DECIMAL(10, 8),
    longitude_atual DECIMAL(11, 8),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- 4. Serviços Oferecidos pelo Prestador/Empresa e Preços
CREATE TABLE servicos_prestador (
    id INT AUTO_INCREMENT PRIMARY KEY,
    prestador_id INT NOT NULL,
    categoria_id INT NOT NULL,
    preco_base DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (prestador_id) REFERENCES perfis_prestadores(id) ON DELETE CASCADE,
    FOREIGN KEY (categoria_id) REFERENCES categorias_servico(id) ON DELETE CASCADE
);

-- 5. Solicitações / Chamados do Ortoo
CREATE TABLE solicitacoes (
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
