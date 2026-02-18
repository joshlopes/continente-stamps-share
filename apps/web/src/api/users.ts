import type { User } from '@stamps-share/shared';
import { apiClient } from './client';

interface UsersResponse {
  users: User[];
}

export async function getUsers(): Promise<UsersResponse> {
  return apiClient<UsersResponse>('/users');
}
