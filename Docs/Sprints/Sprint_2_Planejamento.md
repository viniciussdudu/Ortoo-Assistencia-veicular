# Planejamento da Sprint 2

## Informações Gerais
* **Prazo final:** 26/09/2026 às 23:59
* **Objetivo da Sprint:** Entregar o fluxo completo de atendimento, desde a triagem do problema e cadastro do prestador, passando pela geolocalização e comunicação em tempo real, até a liquidação do pagamento e refatoração visual das entregas anteriores.

---

## Quadro de Features e User Stories

### Feat 1: Geolocalização e Cálculo de Distância no Mapa
* **Responsável:** Vinicius
* **Reviewer:** Thiago
* **Prioridade:** Alta
* **Complexidade:** Alta

**Descrição:**
> **Como** cliente ou prestador de serviço,  
> **Quero** visualizar a localização no mapa e a distância exata em tempo real entre nós dois,  
> **Para** acompanhar o deslocamento e ter estimativas precisas do tempo de chegada.

**Tarefas Técnicas:**
- [ ] Integrar API de mapas (Google Maps, Leaflet ou Mapbox).
- [ ] Capturar e atualizar coordenadas de geolocalização via GPS/WebSockets.
- [ ] Exibir rota e cálculo dinâmico de distância e tempo.

---

### Feat 2: Chat em Tempo Real entre Cliente e Prestador
* **Responsável:** Klaus
* **Reviewer:** Samara
* **Prioridade:** Alta
* **Complexidade:** Média/Alta

**Descrição:**
> **Como** usuário (cliente ou prestador),  
> **Quero** trocar mensagens instantâneas através de um chat interno na plataforma,  
> **Para** alinhar detalhes do serviço e tirar dúvidas sem depender de aplicações externas.

**Tarefas Técnicas:**
- [ ] Configurar serviço de WebSockets para mensagens em tempo real.
- [ ] Desenvolver interface de chat (histórico, bolhas de mensagem e status de envio).
- [ ] Persistir o histórico de conversas vinculado à ordem de serviço no banco de dados.

---

### Feat 3: Cadastro Diferenciado (Cliente vs. Mecânico)
* **Responsável:** Samara
* **Reviewer:** Daniel
* **Prioridade:** Alta
* **Complexidade:** Média

**Descrição:**
> **Como** novo usuário,  
> **Quero** realizar meu cadastro com formulários e campos específicos para o meu perfil (Cliente ou Mecânico),  
> **Para** que a plataforma registre adequadamente minhas informações pessoais ou operacionais.

**Tarefas Técnicas:**
- [ ] Implementar formulário de Cliente coletando dados pessoais básicos e localização principal.
- [ ] Implementar formulário de Mecânico coletando Nome, Nome Fantasia, Descrição da empresa, Raio de atendimento (km) e Localização base.
- [ ] Validar dados de entrada e persistir nos esquemas do banco de dados.

---

### Feat 4: Tela de Pagamento e Checkout Multi-métodos
* **Responsável:** Thiago
* **Reviewer:** Vinicius
* **Prioridade:** Média/Alta
* **Complexidade:** Média

**Descrição:**
> **Como** cliente,  
> **Quero** uma interface de pagamento segura com suporte a múltiplos métodos,  
> **Para** quitar os serviços prestados com rapidez e flexibilidade.

**Tarefas Técnicas:**
- [ ] Criar interface de checkout com seleção de método (Cartão de Crédito/Débito, Pix, Boleto).
- [ ] Integrar com o gateway ou processador de pagamentos escolhido.
- [ ] Tratar e exibir retornos de status da transação (Aprovado, Pendente, Recusado).

---

### Feat 5: Tela Inicial do Usuário (Seleção de Problemas)
* **Responsável:** Bispo
* **Reviewer:** Klaus
* **Prioridade:** Média
* **Complexidade:** Baixa/Média

**Descrição:**
> **Como** cliente,  
> **Quero** acessar uma tela inicial clara apresentando as categorias de problemas mecânicos,  
> **Para** identificar e solicitar o auxílio correto de forma ágil durante uma emergência.

**Tarefas Técnicas:**
- [ ] Mapear e renderizar categorias de problemas mecânicos (Pneu furado, Bateria, Guincho, etc.).
- [ ] Implementar campo de busca e filtros de serviços.
- [ ] Direcionar a seleção do problema para o fluxo de busca de prestadores próximos.

---

### Feat 6: Tela Inicial e Painel do Mecânico
* **Responsável:** Daniel
* **Reviewer:** Bispo
* **Prioridade:** Alta
* **Complexidade:** Média/Alta

**Descrição:**
> **Como** mecânico/prestador de serviço,  
> **Quero** gerenciar meus serviços cadastrados, alterar minha disponibilidade e visualizar pedidos recebidos na tela inicial,  
> **Para** controlar minha operação diária e aceitar chamados em tempo real.

**Tarefas Técnicas:**
- [ ] Criar controle de estado de disponibilidade (Ativo / Inativo / Em atendimento).
- [ ] Implementar módulo CRUD de serviços oferecidos pelo prestador.
- [ ] Criar painel/feed para visualizar chamados abertos na região com opção de aceite ou recusa.

---

### Task Geral: Refatoração e Melhorias de UI/UX (Sprint 1)
* **Responsáveis:** Toda a equipe
* **Prioridade:** Média
* **Complexidade:** Média

**Descrição:**
> **Como** equipe de desenvolvimento,  
> **Queremos** refatorar as interfaces entregues na Sprint 1,  
> **Para** garantir padronização visual, correção de bugs e melhor usabilidade integrada.

**Tarefas Técnicas:**
- [ ] Padronizar componentes, tipografia e paleta de cores de acordo com o guia de estilo.
- [ ] Corrigir problemas de responsividade em dispositivos móveis.
- [ ] Ajustar validações e fluxos de telas legadas.

---

## Matriz de Code Review

| Desenvolvedor | Entrega Principal | Responsável por Revisar |
| :--- | :--- | :--- |
| **Vinicius** | Feat 1 (Mapa) | Thiago (Pagamento) |
| **Thiago** | Feat 4 (Pagamento) | Vinicius (Mapa) |
| **Klaus** | Feat 2 (Chat) | Bispo (Tela Usuário) |
| **Samara** | Feat 3 (Cadastros) | Klaus (Chat) |
| **Daniel** | Feat 6 (Painel Mecânico) | Samara (Cadastros) |
| **Bispo** | Feat 5 (Tela Usuário) | Daniel (Painel Mecânico) |