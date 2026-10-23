# Como executar o projeto

Requisitos: Git, Node.js 22 LTS com npm e MySQL 8 em execução. Use o repositório completo; a interface fica em `Front-end` e a API em `Server`.

Na raiz do repositório, execute:

```sh
npm run setup
npm run install:all
```

O setup cria `Server/.env` e `Front-end/.env` sem sobrescrever arquivos existentes e gera um `JWT_SECRET` aleatório para uma instalação nova. Se seu `.env` já existia, confira se contém um `JWT_SECRET` com pelo menos 32 caracteres. Para gerar um segredo: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

Edite `Server/.env` com o host, porta, usuário, senha e nome do banco MySQL (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`). O usuário precisa de permissão para criar o banco e as tabelas. Depois:

```sh
npm run db:import
```

A importação cria as tabelas e seis categorias básicas. Pode ser repetida sem duplicar categorias nem apagar contas. Não é um sistema de migrações: bancos antigos com estrutura diferente precisam ser atualizados separadamente. O arquivo `seed_dev.sql` contém exemplos com senhas placeholder; não é necessário importá-lo. Cadastre uma conta pela interface.

Abra dois terminais na raiz:

```sh
# Terminal 1: API
npm run server
```

```sh
# Terminal 2: interface web
npm run web
```

Abra o endereço informado pelo Expo, normalmente [http://localhost:8081](http://localhost:8081). Confira a conexão com o banco em [http://localhost:3001/api/status](http://localhost:3001/api/status). Para abrir só a tela de login, basta executar a interface; cadastro, login e demais dados exigem API e MySQL.

Em `Front-end/.env`, `EXPO_PUBLIC_API_URL=http://localhost:3001/api` funciona no navegador da máquina que executa a API. Para outro computador ou celular na mesma rede, use o IPv4 da máquina da API (por exemplo, `http://192.168.1.50:3001/api`), libere as portas necessárias no firewall e reinicie o Expo após mudar o `.env`. `localhost` sempre aponta para o próprio dispositivo. Para o celular, execute `npm --prefix Front-end start` e utilize um cliente compatível com Expo SDK 54 ou uma development build. A geolocalização web precisa de permissão e de HTTPS ou localhost; acesso por IP via HTTP pode bloquear o GPS.

Pagamentos são opcionais para iniciar o projeto. Para cadastrar cartões no Android/iOS, configure `STRIPE_SECRET_KEY` no servidor e `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` no frontend com chaves de teste da mesma conta Stripe. O SDK React Native do Stripe atende Android/iOS; o cadastro de cartões pelo navegador ainda precisa de uma integração Stripe para web. Sem as chaves, as outras telas continuam disponíveis.

Para validação e geração da versão web:

```sh
npm run typecheck
npm run lint
npm test
npm run build:web
```

Os arquivos estáticos são gerados em `Front-end/dist`. Para acesso público, hospede esses arquivos com HTTPS e disponibilize a API com HTTPS e banco acessível somente pelo servidor. Configure a URL pública da API antes de gerar o build; variáveis `EXPO_PUBLIC_*` ficam visíveis no navegador e nunca devem conter segredos. A publicação exige também revisar os fluxos ainda provisórios de identificação do cliente e recuperação de senha.

Referência do projeto: [documentação do Expo SDK 54](https://docs.expo.dev/versions/v54.0.0/).

---

# Projeto de Sistemas - 2026.2 | Universidade Federal do Tocantins - Palmas

### Curso: Bacharelado em Ciência da Computação

### Professor: Edeilson Milhomem da Silva

### Time: Vinicius Eduardo De Sousa Silveira, Arthur Pereira Bispo, Klaus Henrique Otaviano Souza, Daniel Vinicius Da Silva, Samara Coelho da Silva, Thiago Soares Ribeiro Nunes De Carvalho

#  ÖRTÖÖ — Assistência Veicular Sob Demanda

> **Mobilidade, segurança e resposta rápida na palma da sua mão.**

O **ÖRTÖÖ** é uma plataforma de assistência veicular sob demanda que conecta, por meio da geolocalização em tempo real, motoristas em situações de emergência a prestadores de serviços automotivos próximos, de forma rápida, transparente e totalmente sem a necessidade de mensalidades ou contratos engessados.

---

##  O Problema

Imprevistos no trânsito — como pneu furado, falta de combustível (pane seca), bateria descarregada ou falhas mecânicas — geram alto estresse e vulnerabilidade para os condutores. O modelo tradicional de assistência veicular enfrenta sérios gargalos:

* ** Demora no atendimento:** Longos períodos de espera por guinchos ou mecânicos sem estimativa precisa.
* ** Burocracia e Custos Fixos:** Obrigatoriedade de assinaturas mensais ou anuais em seguros e associações, mesmo para quem raramente utiliza o serviço.
* ** Falta de Transparência:** Dificuldade em rastrear a localização do prestador em tempo real e incerteza sobre os prazos de chegada.

O **ÖRTÖÖ** resolve essa dor ao transformar a assistência veicular em um serviço moderno **sob demanda (*pay-per-use*)**, acionado diretamente pelo smartphone.

---

##  Quem Nós Somos

Somos uma solução tecnológica focada em **mobilidade, segurança e eficiência**. Atuamos como a ponte inteligente entre quem precisa de socorro imediato nas ruas e os profissionais capacitados para resolver o problema, utilizando geolocalização precisa para otimizar o tempo de resposta e reduzir custos operacionais.

---

##  Origem do Nome

A palavra **ÖRTÖÖ** (pronuncia-se *Ortô*) tem origem no antigo Império Mongol. O *Örtöö* era um eficiente sistema postal de postos de rota e mensageiros criado para cobrir grandes distâncias, garantindo socorro, suprimentos e comunicação rápida aos viajantes ao longo do caminho.

Resgatamos essa essência histórica de **suporte, conexão e prontidão em rotas** para dar vida à nossa plataforma.

---

##  Público-Alvo

Nossa plataforma atende de forma integrada às duas pontas do ecossistema:

###  Usuários & Condutores
* **Condutores sem seguro:** Donos de carros e motos que não possuem apólice tradicional.
* **Motoristas de aplicativo e entregadores:** Profissionais que dependem do veículo e não podem perder tempo de trabalho parados.
* **Viajantes e motoristas casuais:** Pessoas que buscam previsibilidade, segurança e ajuda rápida em viagens ou deslocamentos diários.

###  Prestadores de Serviço
* Guinchos autônomos, chaveiros, mecânicos móveis, borracharias e socorristas de bateria que desejam expandir sua cartela de clientes e rentabilizar horários ociosos.

---

## 👥 Equipe de Desenvolvimento

| Integrante | GitHub |
| :--- | :--- |
| **Vinicius Silveira** | [@viniciussdudu](https://github.com/viniciussdudu) |
| **Arthur Bispo** | [@bispo047](https://github.com/bispo047) |
| **Klaus** | [@Klaus1215](https://github.com/Klaus1215) |
| **Thiago Soares** | [@Soares314](https://github.com/Soares314) |
| **Daniel Vinicius** | [@DrEggman00](https://github.com/DrEggman00) |
| **Samara Coelho** | [@SamaraCdS-UFT](https://github.com/SamaraCdS-UFT) |

---

## Sprints

[sprint 1](docs/Sprints/sprint%201_%20criação%20de%20contas%20e%20etc.pdf) : [Release]()

[sprint 2](docs/Sprints/Sprint_2_Planejamento.md) : [Release]()
