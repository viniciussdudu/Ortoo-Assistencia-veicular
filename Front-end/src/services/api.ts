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

const apiUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");

function getApiUrl() {
  if (!apiUrl) {
    throw new ApiError(
      "A API não foi configurada. Crie um arquivo .env a partir de .env.example.",
    );
  }

  return apiUrl;
}

type RequestOptions = {
  method?: "POST" | "GET" | "PUT" | "DELETE";
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
