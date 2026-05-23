import type { AppUser, AppRole } from "./types";

const BASE = "/api/profiles";

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Error de conexión" }));
    throw new Error(body.error || `Error ${res.status}`);
  }
  return res.json();
}

export const profileService = {
  async list(): Promise<AppUser[]> {
    return fetchJSON<AppUser[]>(BASE);
  },

  async getById(id: string): Promise<AppUser | null> {
    return fetchJSON<AppUser>(`${BASE}/${id}`);
  },

  async create(input: {
    email: string;
    password: string;
    nombres: string;
    telefono?: string;
    rol: AppRole;
  }): Promise<AppUser | null> {
    return fetchJSON<AppUser>(BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  },

  async update(id: string, input: Partial<AppUser>): Promise<AppUser | null> {
    return fetchJSON<AppUser>(`${BASE}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  },

  async delete(id: string): Promise<boolean> {
    await fetchJSON<void>(`${BASE}/${id}`, { method: "DELETE" });
    return true;
  },

  async exportCSV(): Promise<string> {
    const res = await fetch(`${BASE}?export=csv`);
    if (!res.ok) throw new Error("Error al exportar CSV");
    return res.text();
  },
};
