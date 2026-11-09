import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const CHAVE_TOKEN = "ortoo_auth_token";

// cache em memória: para que evite ler o armazenamento seguro a cada requisição.
// na web o SecureStore não existe; lá a sessão fica só em memória
// (some ao recarregar a página), o que é mais seguro que localStorage.
let tokenEmMemoria: string | null = null;
const usaSecureStore = Platform.OS !== "web";

export async function salvarToken(token: string) {
  tokenEmMemoria = token;
  if (usaSecureStore) {
    await SecureStore.setItemAsync(CHAVE_TOKEN, token);
  }
}

export async function obterToken(): Promise<string | null> {
  if (tokenEmMemoria) return tokenEmMemoria;
  if (!usaSecureStore) return null;
  tokenEmMemoria = await SecureStore.getItemAsync(CHAVE_TOKEN);
  return tokenEmMemoria;
}

export async function limparToken() {
  tokenEmMemoria = null;
  if (usaSecureStore) {
    await SecureStore.deleteItemAsync(CHAVE_TOKEN);
  }
}