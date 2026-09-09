type Account = { email: string; password: string };

// Estado somente em memória: é descartado ao encerrar ou reiniciar o app.
const accounts = new Map<string, Account>();
const normalizeEmail = (email: string) => email.trim().toLowerCase();

export function createAccount(email: string, password: string) {
  const normalizedEmail = normalizeEmail(email);
  if (accounts.has(normalizedEmail)) {
    return { ok: false as const, message: "Já existe uma conta com este e-mail." };
  }
  accounts.set(normalizedEmail, { email: email.trim(), password });
  return { ok: true as const };
}

export function authenticate(email: string, password: string) {
  const account = accounts.get(normalizeEmail(email));
  return Boolean(account && account.password === password);
}

export function resetPassword(email: string, newPassword: string) {
  const normalizedEmail = normalizeEmail(email);
  const account = accounts.get(normalizedEmail);
  if (!account) {
    return { ok: false as const, message: "Nenhuma conta foi encontrada com este e-mail." };
  }
  accounts.set(normalizedEmail, { ...account, password: newPassword });
  return { ok: true as const };
}
