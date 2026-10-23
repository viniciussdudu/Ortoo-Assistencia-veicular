# Front-end ÖRTÖÖ

Aplicativo mobile e web construído com Expo SDK 54, React Native e Expo Router.

## Estrutura

- `app/`: rotas e telas do Expo Router.
- `assets/`: ícones e imagens usados pelo app.
- `src/services/`: comunicação com a API.

## Executar

Os comandos `npm run setup`, `npm run install:all`, `npm run server` e `npm run db:import` também podem ser executados nesta pasta: eles encaminham para os scripts da raiz. O nome correto é `setup` (um único `t`). Mantenha o terminal da API aberto enquanto usa o app; iniciar o Expo não inicia a API.

1. Instale as dependências: `npm ci` (Node.js 22 LTS).
2. Copie `.env.example` para `.env`.
3. Ajuste `EXPO_PUBLIC_API_URL` para o endereço alcançável do servidor. Em um dispositivo físico com Expo Go, `localhost` não funciona: use o IPv4 local da máquina, por exemplo `http://192.168.1.50:3001/api`.
4. Para o navegador, execute `npm run web` e abra a URL informada pelo Expo (normalmente `http://localhost:8081`). Para Android/iOS, execute `npm start` com um cliente compatível com SDK 54.

Se trocar de rede, atualize o IP em `EXPO_PUBLIC_API_URL` e reinicie o Expo (`npm run web -- --clear`). Verifique `http://IP_DA_API:3001/api/status`: deve responder com `bancoConectado: true`. Os avisos de propriedades de estilo obsoletas (`shadow*`, `pointerEvents`) não indicam falha de conexão com a API.

Cadastro e login exigem a API em `Server` e MySQL configurados. Veja o [guia completo na raiz](../README.md#como-executar-o-projeto). Para validação: `npm run typecheck`, `npm run lint` e `npm run build:web`. A exportação web fica em `dist`.

O cadastro de cartões usa um componente exclusivo para Android/iOS, pois `@stripe/stripe-react-native` não oferece suporte web. No navegador essa rota mostra a disponibilidade no aplicativo, sem importar módulos nativos.

## API disponível

- `POST /api/auth/cadastro`
- `GET /api/conversas`
- `POST /api/solicitacoes/:id/conversa`
- `GET /api/solicitacoes/:id/mensagens`
- `POST /api/solicitacoes/:id/mensagens`

## Chat com prestadores

No mapa, toque em **Conversar com prestador** no cartão da empresa. O atendimento continua ativo durante a conversa. O cliente também pode usar **Conversas com prestadores** na página inicial; o prestador encontra **Conversas com clientes** na sua área. As mensagens são atualizadas a cada três segundos enquanto a tela está aberta. Atendimentos encerrados mantêm o histórico para leitura.

A API exige login e permite consultar/enviar mensagens somente ao cliente e ao prestador vinculados ao atendimento. Depois de atualizar o código do servidor, reinicie a API; para instalar a tabela em outro banco, execute `npm run db:import`.

O cliente HTTP em `src/services/api.ts` concentra o cadastro. A API valida nome, e-mail, CPF e uma senha numérica de exatamente seis dígitos antes de armazenar a conta no MySQL.
