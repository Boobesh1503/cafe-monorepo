import type {
  Tenant,
  Branch,
  TenantMembership,
  TenantMemberRole,
  TenantStatus,
  SubscriptionPlan,
  MemberStatus,
} from '@prisma/client';

export type {
  Tenant,
  Branch,
  TenantMembership,
  TenantMemberRole,
  TenantStatus,
  SubscriptionPlan,
  MemberStatus,
};

export interface TenantBranding {
  logoUrl?: string;
  bannerUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  tagline?: string;
  fontFamily?: string;
}

export interface TenantSettings {
  currency: string;
  currencySymbol: string;
  timezone: string;
  taxRatePercent: number;
  orderNumberPrefix: string;
  allowOnlineOrders: boolean;
  tableReservationEnabled: boolean;
}

export interface TenantContext {
  id: string;
  slug: string;
  name: string;
  status: TenantStatus;
  subscriptionPlan: SubscriptionPlan;
  subscriptionExpiresAt: Date | null;
  branding: TenantBranding;
  settings: TenantSettings;
}

export interface AuthenticatedTenantRequestMember {
  membershipId: string;
  role: TenantMemberRole;
  status: MemberStatus;
  assignedBranchIds: string[];
}

export interface TenantOnboardResult {
  tenant: {
    id: string;
    slug: string;
    name: string;
    status: TenantStatus;
    subscriptionPlan: SubscriptionPlan;
    branding: TenantBranding;
    settings: TenantSettings;
  };
  primaryBranch: {
    id: string;
    name: string;
    code: string;
    city: string;
  };
  owner: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

