export type UserType = "CLIENTE" | "PRESTADOR_AUTONOMO" | "EMPRESA";
export type TipoDocumento = "CPF" | "CNPJ";

/* ==================== USUÁRIOS & PERFIL ==================== */

export type RegisteredUser = {
  id: number;
  nome: string;
  email: string;
  tipo_usuario: UserType;
  stripe_customer_id?: string | null;
  token?: string;
};

export type RegisterInput = {
  nome: string;
  email: string;
  password: string;
  documento: string;
  telefone: string;
  tipo_usuario: UserType;
  nome_fantasia?: string;
  descricao_empresa?: string;
  raio_atendimento_km?: number;
  latitude_atual?: number;
  longitude_atual?: number;
};

export type UserProfile = {
  id: number;
  stripe_customer_id?: string | null;
  nome: string;
  email: string;
  telefone: string;
  documento: string;
  tipo_documento: TipoDocumento;
  tipo_usuario: UserType;
  foto_url?: string | null;
  criado_em?: string;
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

const apiUrl = (
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api"
).replace(/\/$/, "");

function getApiUrl() {
  if (!apiUrl) {
    throw new ApiError(
      "A API não foi configurada. Crie um arquivo .env a partir de .env.example.",
    );
  }
  return apiUrl;
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
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
  } catch (erro) {
    console.log("URL chamada:", `${getApiUrl()}${path}`);
    console.log("Erro original:", erro);
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

/* ==================== AUTENTICAÇÃO ==================== */

export function register(input: RegisterInput) {
  return request<RegisteredUser>("/auth/cadastro", {
    method: "POST",
    body: input,
  });
}

export function login(input: Pick<RegisterInput, "email" | "password">): Promise<RegisteredUser> {
  return request<RegisteredUser>("/auth/login", {
    method: "POST",
    body: input,
  });
}

export type RecuperarSenhaInput = {
  email: string;
  novaSenha: string;
};

export function recuperarSenha(input: RecuperarSenhaInput) {
  return request<{ sucesso: boolean; mensagem: string }>("/auth/recuperar-senha", {
    method: "POST",
    body: input,
  });
}

export function getUserProfile() {
  return request<UserProfile>("/usuario/perfil");
}

export function logout() {
  return request<{ sucesso: boolean }>("/auth/logout", { method: "POST" });
}

/* ==================== CATEGORIAS & PRESTADORES ==================== */

export type Categoria = {
  id: number;
  nome: string;
  descricao?: string | null;
  icone_url?: string | null;
};

export function listarCategorias() {
  return request<Categoria[]>("/categorias");
}

export type ServicoOferecido = {
  id: number;
  prestador_id: number;
  categoria_id: number;
  categoria_nome?: string;
  preco_base: number | string;
};

export type Prestador = {
  id: number;
  usuario_id: number;
  nome_fantasia?: string | null;
  descricao_empresa?: string | null;
  raio_atendimento_km: number;
  disponivel: boolean;
  latitude_atual?: number | null;
  longitude_atual?: number | null;
  servicos?: ServicoOferecido[];
};

export function listarPrestadores() {
  return request<Prestador[]>("/prestadores");
}

/* ==================== SOLICITAÇÕES ==================== */

export type StatusSolicitacao =
  | "PENDENTE"
  | "ACEITO"
  | "EM_ANDAMENTO"
  | "CONCLUIDO"
  | "CANCELADO";

export type Solicitacao = {
  id: number;
  cliente_id: number;
  prestador_id?: number | null;
  categoria_id: number;
  status: StatusSolicitacao;
  descricao_problema?: string | null;
  latitude_origem: number | string;
  longitude_origem: number | string;
  valor_estimado?: number | string | null;
  criado_em: string;
  categoria_nome?: string;
};

export type CriarSolicitacaoInput = {
  cliente_id: number;
  categoria_id: number;
  descricao_problema?: string;
  latitude_origem: number;
  longitude_origem: number;
  valor_estimado?: number;
};

export function criarSolicitacao(input: CriarSolicitacaoInput) {
  return request<Solicitacao>("/solicitacoes", { method: "POST", body: input });
}

export function listarMinhasSolicitacoes(clienteId: number) {
  return request<Solicitacao[]>(`/solicitacoes?cliente_id=${clienteId}`);
}

export function cancelarSolicitacao(id: number) {
  // Ajustado para PATCH na rota individual por ID
  return request<{ sucesso: boolean; mensagem: string }>(
    `/solicitacoes/${id}/cancelar`,
    { method: "PATCH" }
  );
}

/* ==================== CARTÕES & STRIPE ==================== */

export type CartaoUsuario = {
  id: number;
  usuario_id: number;
  gateway: string;
  token_gateway: string;
  ultimos_digitos: string;
  bandeira?: string | null;
  validade_mes?: number | null;
  validade_ano?: number | null;
  apelido?: string | null;
  principal: boolean;
  criado_em?: string;
};

export type SalvarCartaoInput = {
  usuario_id: number;
  payment_method_id: string;
  ultimos_digitos?: string;
  bandeira?: string;
  validade_mes?: number;
  validade_ano?: number;
  apelido?: string;
  principal?: boolean;
};

export function criarSetupIntentCartao(usuarioId: number) {
  return request<{ client_secret: string }>("/pagamento/novo-cartao", {
    method: "POST",
    body: { usuario_id: usuarioId },
  });
}

export function salvarCartao(input: SalvarCartaoInput) {
  return request<{ sucesso: boolean; mensagem: string }>(
    "/pagamento/salvar-cartao",
    {
      method: "POST",
      body: input,
    },
  );
}

export function listarCartoes(usuarioId: number) {
  return request<CartaoUsuario[]>(`/pagamento/cartoes?usuario_id=${usuarioId}`);
}