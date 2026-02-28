// In production, use relative URLs (same origin via nginx proxy)
// In development, use localhost:4587
const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:4587';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(body.error || `HTTP ${res.status}`);
    }

    return res.json();
  }

  // Health
  async getHealth() {
    return this.request<{ status: string; version: string; timestamp: string }>('/api/health');
  }

  // Auth
  async sendOtp(phone: string) {
    return this.request<{ success: boolean; phone: string; devCode?: string }>('/api/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  }

  async verifyOtp(phone: string, code: string) {
    return this.request<{
      success: boolean;
      isNewUser: boolean;
      token: string;
      expiresAt: string;
      profile: import('@stamps-share/shared').Profile;
    }>('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
    });
  }

  async getMe() {
    return this.request<{ profile: import('@stamps-share/shared').Profile }>('/api/auth/me');
  }

  async logout() {
    return this.request<{ success: boolean }>('/api/auth/logout', { method: 'POST' });
  }

  // Profile
  async updateProfile(data: import('@stamps-share/shared').UpdateProfileRequest) {
    return this.request<{ profile: import('@stamps-share/shared').Profile }>('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Listings
  async getListings(params?: { type?: string; status?: string; userId?: string }) {
    const search = new URLSearchParams();
    if (params?.type) search.set('type', params.type);
    if (params?.status) search.set('status', params.status);
    if (params?.userId) search.set('userId', params.userId);
    const qs = search.toString();
    return this.request<{ listings: import('@stamps-share/shared').StampListingWithProfile[] }>(
      `/api/listings${qs ? `?${qs}` : ''}`
    );
  }

  async createListing(data: import('@stamps-share/shared').CreateListingRequest) {
    return this.request<{ listing: import('@stamps-share/shared').StampListingWithProfile }>('/api/listings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async cancelListing(id: string) {
    return this.request<{ listing: import('@stamps-share/shared').StampListingWithProfile }>(`/api/listings/${id}/cancel`, {
      method: 'PUT',
    });
  }

  async fulfillListing(id: string) {
    return this.request<{ listing: import('@stamps-share/shared').StampListingWithProfile }>(`/api/listings/${id}/fulfill`, {
      method: 'PUT',
    });
  }

  async confirmSent(id: string) {
    return this.request<{ listing: import('@stamps-share/shared').StampListingWithProfile }>(`/api/listings/${id}/confirm-sent`, {
      method: 'PUT',
    });
  }

  // Collections
  async getCollections() {
    return this.request<{ collections: import('@stamps-share/shared').StampCollectionWithItems[] }>('/api/collections');
  }

  // Leaderboard
  async getLeaderboard() {
    return this.request<{ leaderboard: Array<{
      id: string;
      displayName: string | null;
      district: string;
      points: number;
      level: number;
      tier: number;
      totalOffered: number;
      totalRequested: number;
    }> }>('/api/leaderboard');
  }

  // Admin
  async getPendingOffers() {
    return this.request<{ offers: import('@stamps-share/shared').StampListingWithProfile[] }>('/api/admin/pending-offers');
  }

  async approveOffer(id: string, quantity?: number) {
    return this.request<{ offer: import('@stamps-share/shared').StampListingWithProfile; quantityAdjusted?: boolean; originalQuantity?: number }>(`/api/admin/offers/${id}/approve`, {
      method: 'PUT',
      body: quantity !== undefined ? JSON.stringify({ quantity }) : undefined,
    });
  }

  async rejectOffer(id: string, reason?: string) {
    return this.request<{ offer: import('@stamps-share/shared').StampListingWithProfile }>(`/api/admin/offers/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
  }

  async getActiveRequests() {
    return this.request<{ requests: (import('@stamps-share/shared').StampListingWithProfile & { user: { phone: string } })[] }>('/api/admin/active-requests');
  }

  async fulfillRequest(id: string) {
    return this.request<{ request: import('@stamps-share/shared').StampListingWithProfile }>(`/api/admin/requests/${id}/fulfill`, {
      method: 'PUT',
    });
  }

  async getCompletedOffers() {
    return this.request<{ offers: import('@stamps-share/shared').StampListingWithProfile[] }>('/api/admin/completed-offers');
  }

  async revertOffer(id: string) {
    return this.request<{ offer: import('@stamps-share/shared').StampListingWithProfile }>(`/api/admin/offers/${id}/revert`, {
      method: 'PUT',
    });
  }

  async getCompletedRequests() {
    return this.request<{ requests: (import('@stamps-share/shared').StampListingWithProfile & { user: { phone: string } })[] }>('/api/admin/completed-requests');
  }

  async revertRequest(id: string) {
    return this.request<{ request: import('@stamps-share/shared').StampListingWithProfile }>(`/api/admin/requests/${id}/revert`, {
      method: 'PUT',
    });
  }

  async getAdminCollections() {
    return this.request<{ collections: import('@stamps-share/shared').StampCollectionWithItems[] }>('/api/admin/collections');
  }

  async createCollection(data: import('@stamps-share/shared').CreateCollectionRequest) {
    return this.request<{ collection: import('@stamps-share/shared').StampCollectionWithItems }>('/api/admin/collections', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCollection(id: string, data: Partial<import('@stamps-share/shared').CreateCollectionRequest>) {
    return this.request<{ collection: import('@stamps-share/shared').StampCollectionWithItems }>(`/api/admin/collections/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCollection(id: string) {
    return this.request<{ success: boolean }>(`/api/admin/collections/${id}`, { method: 'DELETE' });
  }

  async createCollectionItem(collectionId: string, data: import('@stamps-share/shared').CreateCollectionItemRequest) {
    return this.request<{ item: import('@stamps-share/shared').CollectionItemWithOptions }>(`/api/admin/collections/${collectionId}/items`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCollectionItem(collectionId: string, itemId: string, data: Partial<import('@stamps-share/shared').CreateCollectionItemRequest>) {
    return this.request<{ item: import('@stamps-share/shared').CollectionItemWithOptions }>(`/api/admin/collections/${collectionId}/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCollectionItem(collectionId: string, itemId: string) {
    return this.request<{ success: boolean }>(`/api/admin/collections/${collectionId}/items/${itemId}`, { method: 'DELETE' });
  }

  async createRedemptionOption(collectionId: string, itemId: string, data: import('@stamps-share/shared').CreateRedemptionOptionRequest) {
    return this.request<{ option: import('@stamps-share/shared').RedemptionOption }>(`/api/admin/collections/${collectionId}/items/${itemId}/options`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteRedemptionOption(collectionId: string, itemId: string, optionId: string) {
    return this.request<{ success: boolean }>(`/api/admin/collections/${collectionId}/items/${itemId}/options/${optionId}`, { method: 'DELETE' });
  }

  async getSettings() {
    return this.request<{ settings: { id: string; adminDevicePhone: string; updatedAt: string; updatedBy: string | null } }>('/api/admin/settings');
  }

  async getPublicSettings() {
    return this.request<{ settings: { adminDevicePhone: string } }>('/api/settings/public');
  }

  async updateSettings(data: { adminDevicePhone?: string }) {
    return this.request<{ settings: { id: string; adminDevicePhone: string; updatedAt: string; updatedBy: string | null } }>('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiClient();
