# Front-end ÖRTÖÖ

Aplicativo mobile e web construído com Expo SDK 54, React Native e Expo Router.

## Estrutura

- `app/`: rotas e telas do Expo Router.
- `assets/`: ícones e imagens usados pelo app.
- `src/services/`: comunicação com a API.

## Executar

1. Instale as dependências: `npm install`.
2. Copie `.env.example` para `.env`.
3. Ajuste `EXPO_PUBLIC_API_URL` para o endereço alcançável do servidor. Em um dispositivo físico, `localhost` deve ser substituído pelo IP local da máquina do servidor.
4. Inicie o app com `npm start`.

## API disponível

- `POST /api/auth/cadastro`

O cliente HTTP em `src/services/api.ts` concentra o cadastro. A API valida nome, e-mail, CPF e uma senha numérica de exatamente seis dígitos antes de armazenar a conta no MySQL.
