import { createCafeApiClient } from '@cafe/shared';

export const cafeApi = createCafeApiClient(
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000',
);

export const getMenuForDisplay = () => cafeApi.getMenu();
