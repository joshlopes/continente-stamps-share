import type { LoginRequest, LoginResponse, MeResponse, LogoutResponse } from '@stamps-share/shared';
import { apiClient } from './client';

export async function login(data: LoginRequest): Promise<LoginResponse> {
  return apiClient<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getMe(): Promise<MeResponse> {
  return apiClient<MeResponse>('/auth/me');
}

export async function logout(): Promise<LogoutResponse> {
  return apiClient<LogoutResponse>('/auth/logout', {
    method: 'POST',
  });
}
