import { useState, useCallback } from 'react';
import type { StampListingWithProfile } from '@stamps-share/shared';
import { api } from '../api/client';

export function useMarketplace() {
  const [listings, setListings] = useState<StampListingWithProfile[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchListings = useCallback(async (type?: 'offer' | 'request', userId?: string, status?: string) => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (type) params.type = type;
      if (userId) params.userId = userId;
      if (status) params.status = status;
      // Don't default to 'active' - let caller decide what statuses to fetch
      const { listings: data } = await api.getListings(params);
      setListings(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPendingOffers = useCallback(async () => {
    setLoading(true);
    try {
      const { offers } = await api.getPendingOffers();
      setListings(offers);
    } finally {
      setLoading(false);
    }
  }, []);

  const createListing = useCallback(async (params: { type: 'offer' | 'request'; quantity: number; collection?: string; notes?: string }) => {
    const { listing } = await api.createListing(params);
    return listing;
  }, []);

  const cancelListing = useCallback(async (listingId: string) => {
    await api.cancelListing(listingId);
  }, []);

  const approveOffer = useCallback(async (listingId: string) => {
    await api.approveOffer(listingId);
  }, []);

  const rejectOffer = useCallback(async (listingId: string, reason?: string) => {
    await api.rejectOffer(listingId, reason);
  }, []);

  const fulfillListing = useCallback(async (listingId: string) => {
    await api.fulfillListing(listingId);
  }, []);

  return { listings, loading, fetchListings, fetchPendingOffers, createListing, cancelListing, fulfillListing, approveOffer, rejectOffer };
}
