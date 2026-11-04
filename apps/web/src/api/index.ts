import { createCafeApiClient } from '@cafe/shared';
import { mockMenu } from './mockClient';

// Integration seam: replace this preview adapter with the live shared API client.
export const cafeApi = createCafeApiClient(
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000',
);

export async function getMenuForDisplay() {
  try {
    const result = await cafeApi.getMenu();
    return result.length ? result : mockMenu;
  } catch {
    return mockMenu;
  }
}
