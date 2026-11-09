-- Adiciona a etapa usada pelo mecânico ao atualizar o deslocamento.
ALTER TABLE solicitacoes
  MODIFY COLUMN status ENUM(
    'PENDENTE',
    'ACEITO',
    'A_CAMINHO',
    'EM_ANDAMENTO',
    'CONCLUIDO',
    'CANCELADO'
  ) DEFAULT 'PENDENTE';
