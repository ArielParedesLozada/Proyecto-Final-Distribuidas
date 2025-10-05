// src/types/auth.ts
export interface AuthUser {
    id: string;
    email: string;
    roles: string[];
    name?: string; // <- añadimos name
  }
  
  export interface AuthState {
    token: string;
    user: AuthUser | null;
  }
  
  export interface MeResponse {
    id: string;
    email: string;
    roles: string | string[]; // a veces viene como string
    name: string;
  }
  