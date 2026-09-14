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

// --- NOVAS TIPAGENS PARA O PERFIL ---
export type Veiculo = {
  modelo: string;
  placa: string;
  cor: string;
};

export type HistoricoAtendimento = {
  id: string;
  data: string;
  problema: string;
  status: string;
};

export type UserProfile = {
  usuario: {
    nome: string;
    email: string;
    telefone: string;
  };
  veiculo: Veiculo | null;
  historico: HistoricoAtendimento[];
};
// -------------------------------------

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// FALLBACK: Garante a URL local caso a variável de ambiente não esteja definida
const apiUrl = (process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api").replace(/\/$/, "");

function getApiUrl() {
  return apiUrl;
}


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
    throw new ApiError("Não foi possível conectar à API.");
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

export function getUserProfile() {
  // Nota: Altere "/usuario/perfil" se o seu backend usar outro caminho (ex: "/perfil" ou "/me")
  return request<UserProfile>("/usuario/perfil");
}

export function logout() {
  // Nota: Altere "/auth/logout" se o seu backend usar outro caminho
  return request<{ sucesso: boolean }>("/auth/logout", { method: "POST" });
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