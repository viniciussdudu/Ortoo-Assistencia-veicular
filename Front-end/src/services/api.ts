export type RegisteredUser = {
  id: number;
  nome: string;
  email: string;
};

let usuarioAtual: RegisteredUser | null = null;

export function definirUsuarioAtual(usuario: RegisteredUser) {
  usuarioAtual = usuario;
}

export function obterUsuarioAtual() {
  return usuarioAtual;
}

export function limparUsuarioAtual() {
  usuarioAtual = null;
}

export type UserProfile = {
  usuario: RegisteredUser;
  veiculo: { modelo: string; placa: string; cor: string } | null;
  historico: { id: number; problema: string; data: string; status: string }[];
};

export type RegisterInput = {
  nome: string;
  email: string;
  password: string;
  documento: string;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// No Expo Go, "localhost" aponta para o próprio celular, e não para o computador
// que executa a API. A URL deve ser configurada em EXPO_PUBLIC_API_URL.
const apiUrl = (process.env.EXPO_PUBLIC_API_URL ?? "").trim().replace(/\/$/, "");

function getApiUrl() {
  if (!apiUrl) {
    throw new ApiError(
      "A API não foi configurada. Crie um arquivo .env a partir de .env.example.",
    );
  }

  return apiUrl;
}

type RequestOptions = {
  method?: "POST" | "PATCH";
  body?: unknown;
};

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${getApiUrl()}${path}`, {
      method: options.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
      },
      ...(options.body === undefined
        ? {}
        : { body: JSON.stringify(options.body) }),
    });
  } catch {
    throw new ApiError("Não foi possível conectar à API. Verifique se o servidor está em execução e se o celular está na mesma rede Wi-Fi.");
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      payload?.erro ?? "A API retornou um erro.",
      response.status,
    );
  }

  return payload as T;
}

export function register(input: RegisterInput) {
  return request<RegisteredUser>("/auth/cadastro", {
    method: "POST",
    body: input,
  });
}

export function login(input: Pick<RegisterInput, "email" | "password">) {
  return request<RegisteredUser>("/auth/login", {
    method: "POST",
    body: input,
  });
}
 
export type RecuperarSenhaInput = {
  email: string;
  novaSenha: string;
};

export type RecuperarSenhaResponse = {
  sucesso: boolean;
  mensagem: string;
};

// Adicione junto com export function register(...)
export function recuperarSenha(input: RecuperarSenhaInput) {
  return request<RecuperarSenhaResponse>("/auth/recuperar-senha", {
    method: "POST",
    body: input,
  });
}

export type Categoria = {
  id: number;
  nome: string;
  descricao: string | null;
  icone_url: string | null;
};

export type Solicitacao = {
  id: number;
  status: "PENDENTE" | "ACEITO" | "EM_ANDAMENTO" | "CONCLUIDO" | "CANCELADO";
  descricao_problema: string | null;
  latitude_origem: string;
  longitude_origem: string;
  criado_em: string;
  categoria_nome: string;
};

export type CriarSolicitacaoInput = {
  cliente_id: number;
  categoria_id: number;
  descricao_problema?: string;
  latitude_origem: number;
  longitude_origem: number;
};

export function listarCategorias() {
  return request<Categoria[]>("/categorias");
}

export function criarSolicitacao(input: CriarSolicitacaoInput) {
  return request<Solicitacao>("/solicitacoes", { method: "POST", body: input });
}

export function listarMinhasSolicitacoes(clienteId: number) {
  return request<Solicitacao[]>(`/solicitacoes?cliente_id=${encodeURIComponent(clienteId)}`);
}

export function cancelarSolicitacao(id: number) {
  return request<{ sucesso: boolean; mensagem: string }>(
    `/solicitacoes/${id}/cancelar`,
    {
      method: "PATCH",
    },
  );
}

export function getUserProfile(usuarioId: number) {
  return request<UserProfile>(`/usuario/perfil?usuario_id=${encodeURIComponent(usuarioId)}`);
}

export function logout() {
  return request<{ sucesso: boolean }>("/auth/logout", { method: "POST" }).finally(
    limparUsuarioAtual,
  );
}
