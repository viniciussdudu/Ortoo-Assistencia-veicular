export type RegisteredUser = {
  id: number;
  nome: string;
  email: string;
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

const apiUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");

function getApiUrl() {
  if (!apiUrl) {
    throw new ApiError(
      "A API nÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£o foi configurada. Crie um arquivo .env a partir de .env.example.",
    );
  }

  return apiUrl;
}

type RequestOptions = {
  method?: "POST" | "PATCH";
  body?: unknown;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${getApiUrl()}${path}`, {
      method: options.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
      },
      ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
    });
  } catch {
    throw new ApiError("NÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£o foi possÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­vel conectar ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  API.");
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(payload?.erro ?? "A API retornou um erro.", response.status);
  }

  return payload as T;
}

export function register(input: RegisterInput) {
  return request<RegisteredUser>("/auth/cadastro", { method: "POST", body: input });
}

export function login(input: Pick<RegisterInput, "email" | "password">) {
  return request<RegisteredUser>("/auth/login", { method: "POST", body: input });
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
  return request<Solicitacao[]>(`/solicitacoes?cliente_id=${clienteId}`);
}

export function cancelarSolicitacao(id: number) {
  return request<{ sucesso: boolean; mensagem: string }>(`/solicitacoes/${id}/cancelar`, {
    method: "PATCH",
  });
}
