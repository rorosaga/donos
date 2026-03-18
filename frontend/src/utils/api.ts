import { API_BASE } from './constants';
import type {
  NGOResponse,
  TrustlinePrepareRequest,
  TrustlinePrepareResponse,
  TrustlineVerifyRequest,
  TrustlineVerifyResponse,
  DonationResponse,
  ReprocessRequest,
  ReprocessResponse,
  DonorTree,
} from '../types';

// ── Helpers ──

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new ApiError(res.status, body || res.statusText);
  }

  return res.json() as Promise<T>;
}

// ── NGOs ──

export function fetchNGOs(): Promise<NGOResponse[]> {
  return request<NGOResponse[]>('/ngos');
}

export function fetchNGO(ngoId: string): Promise<NGOResponse> {
  return request<NGOResponse>(`/ngos/${ngoId}`);
}

export function prepareTrustline(
  ngoId: string,
  body: TrustlinePrepareRequest,
): Promise<TrustlinePrepareResponse> {
  return request<TrustlinePrepareResponse>(`/ngos/${ngoId}/trustline/prepare`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function verifyTrustline(
  ngoId: string,
  body: TrustlineVerifyRequest,
): Promise<TrustlineVerifyResponse> {
  return request<TrustlineVerifyResponse>(`/ngos/${ngoId}/trustline/verify`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// ── Donations ──

export function fetchDonations(params?: {
  ngo_id?: string;
  donor_wallet_address?: string;
}): Promise<DonationResponse[]> {
  const query = new URLSearchParams();
  if (params?.ngo_id) query.set('ngo_id', params.ngo_id);
  if (params?.donor_wallet_address)
    query.set('donor_wallet_address', params.donor_wallet_address);

  const qs = query.toString();
  return request<DonationResponse[]>(`/donations${qs ? `?${qs}` : ''}`);
}

export function fetchDonation(donationId: string): Promise<DonationResponse> {
  return request<DonationResponse>(`/donations/${donationId}`);
}

export function fetchDonationByPayment(
  paymentReference: string,
): Promise<DonationResponse> {
  return request<DonationResponse>(
    `/donations/by-payment/${paymentReference}`,
  );
}

export function reprocessDonations(
  body: ReprocessRequest,
): Promise<ReprocessResponse> {
  return request<ReprocessResponse>('/donations/reprocess', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// ── Donor Tree ──

export function fetchDonorTree(donorAddress: string): Promise<DonorTree> {
  return request<DonorTree>(`/donations/donor/${donorAddress}/tree`);
}

// ── Wallet (Xaman proxy) ──

export async function createConnectPayload(): Promise<{
  uuid: string
  qr_url: string | null
  deeplink: string | null
  websocket_url: string | null
}> {
  return request('/wallet/connect', { method: 'POST' })
}

export async function createSignPayload(txjson: Record<string, unknown>): Promise<{
  uuid: string
  qr_url: string | null
  deeplink: string | null
  websocket_url: string | null
}> {
  return request('/wallet/sign', {
    method: 'POST',
    body: JSON.stringify({ txjson }),
  })
}

export async function getPayloadResult(uuid: string): Promise<{
  signed: boolean
  account: string | null
  txid: string | null
  resolved: boolean
  cancelled: boolean
}> {
  return request(`/wallet/payload/${uuid}`)
}
