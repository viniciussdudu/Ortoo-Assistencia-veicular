-- 1. Tabela de Usuários (Clientes, Autônomos e Empresas)
CREATE TABLE IF NOT EXISTS usuarios (
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
