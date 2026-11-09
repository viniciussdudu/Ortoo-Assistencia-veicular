# Front-end ÖRTÖÖ

Aplicativo mobile e web construído com Expo SDK 54, React Native e Expo Router.

## Estrutura

- `app/`: rotas e telas do Expo Router.
- `assets/`: ícones e imagens usados pelo app.
- `src/services/`: comunicação com a API.

## Executar

1. Instale as dependências: `npm install`.
2. Copie `.env.example` para `.env`.
3. Ajuste `EXPO_PUBLIC_API_URL` para o endereço alcançável do servidor. Em um dispositivo físico com Expo Go, `localhost` não funciona: use o IPv4 local da máquina, por exemplo `http://192.168.1.50:3001/api`.
4. Inicie o app com `npm start`.

## API disponível

- `POST /api/auth/cadastro`
- `PUT /api/usuario/perfil/foto` (autenticado): envia a imagem em Base64 como `text/plain`.

Clientes e mecânicos podem selecionar ou trocar a foto no topo do próprio perfil. A imagem é salva na hora. Use JPG, PNG ou WebP com até 5 MB. O servidor armazena os arquivos em `Server/uploads/perfis` e mantém a referência no campo `usuarios.foto_url`; preserve essa pasta ao mover ou restaurar a API.

O cliente HTTP em `src/services/api.ts` concentra o cadastro. A API valida nome, e-mail, CPF e uma senha numérica de exatamente seis dígitos antes de armazenar a conta no MySQL.
