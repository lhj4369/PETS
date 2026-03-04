import API_BASE_URL from "../config/api";

export async function login(email: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? "로그인에 실패했습니다.");
  return data;
}

export async function register(name: string, email: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? "회원가입에 실패했습니다.");
  return data;
}

export async function findId(name: string) {
  const res = await fetch(`${API_BASE_URL}/api/auth/find-id`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? "조회에 실패했습니다.");
  return data as { email: string };
}

export async function findPassword(name: string, email: string) {
  const res = await fetch(`${API_BASE_URL}/api/auth/find-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? "본인 확인에 실패했습니다.");
  return data;
}

export async function resetPassword(name: string, email: string, newPassword: string) {
  const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, newPassword }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? "비밀번호 변경에 실패했습니다.");
  return data;
}

export async function googleAuth(googleUserInfo: {
  googleId: string;
  email: string;
  name: string;
  picture?: string;
}) {
  const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(googleUserInfo),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? "구글 로그인에 실패했습니다.");
  return data;
}

export async function deleteAccount(headers: HeadersInit) {
  const res = await fetch(`${API_BASE_URL}/api/auth/account`, {
    method: "DELETE",
    headers,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? "회원 탈퇴에 실패했습니다.");
  return data;
}
