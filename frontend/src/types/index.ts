// ── NGO ──

export interface NGOResponse {
  ngo_id: string;
  name: string;
  treasury_address: string;
  issuer_address: string;
  distributor_address: string;
  dono_rate: string;
}

// ── Trustline ──

export interface TrustlinePrepareRequest {
  wallet_address: string;
  limit_value?: string;
}

export interface TrustlinePrepareResponse {
  transaction: Record<string, unknown>;
}

export interface TrustlineVerifyRequest {
  wallet_address: string;
}

export interface TrustlineVerifyResponse {
  ngo_id: string;
  wallet_address: string;
  trustline_ready: boolean;
}

// ── Donation ──

export type ProcessingState =
  | 'detected'
  | 'pending_trustline'
  | 'ready_to_issue'
  | 'issued_to_distributor'
  | 'sent_to_donor'
  | 'completed_zero_issuance'
  | 'failed';

export interface DonationResponse {
  donation_id: string;
  payment_reference: string;
  ngo_id: string;
  donor_wallet_address: string;
  treasury_address: string;
  rlusd_amount: string;
  dono_rate: string;
  dono_amount: number;
  state: ProcessingState;
  processing_state?: ProcessingState;
  detection_tx_hash?: string;
  issuance_tx_hash?: string;
  distribution_tx_hash?: string;
  failure_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface ReprocessRequest {
  donation_id?: string;
  ngo_id?: string;
}

export interface ReprocessResponse {
  processed_count: number;
  donations: DonationResponse[];
}

// ── Donor Tree ──

export interface TreeSpending {
  id: string;
  destination: string;
  amount: number;
  memo?: string;
  category?: string;
  has_proof: boolean;
  created_at: string;
}

export interface TreeBranch {
  ngo_id: string;
  ngo_name: string;
  ngo_logo_url?: string;
  total_donated: number;
  total_dono_tokens: number;
  donation_count: number;
  spending: TreeSpending[];
}

export interface DonorTree {
  donor_address: string;
  total_dono_tokens: number;
  total_donated: number;
  ngo_count: number;
  branches: TreeBranch[];
}
