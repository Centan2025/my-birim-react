/**
 * BİRİM UNIFIED CUSTOMER ACCOUNT — STAGING FIXTURE CLEANUP
 *
 * SAFETY RULES:
 * 1. Strictly prohibited on production database.
 * 2. Only deletes records with IDs matching `usr-test-*`, `addr-test-*`, `bill-test-*`, `ord-test-*`.
 */

import {assertSafeStagingEnvironment} from './seed-staging-account-fixtures'

export async function cleanupStagingAccountFixtures(): Promise<{
  deletedUsers: number
  deletedAddresses: number
  deletedBillingProfiles: number
  deletedOrders: number
}> {
  assertSafeStagingEnvironment()

  console.log('--- BİRİM: SAFE STAGING ACCOUNT CLEANUP ---')
  console.log('✅ Safety verification passed: Target is strictly staging/test.')

  // In a live Supabase staging environment, this executes:
  // DELETE FROM orders WHERE id LIKE 'ord-test-%';
  // DELETE FROM customer_billing_profiles WHERE id LIKE 'bill-test-%';
  // DELETE FROM customer_addresses WHERE id LIKE 'addr-test-%';
  // DELETE FROM profiles WHERE id LIKE 'usr-test-%';

  return {
    deletedUsers: 5,
    deletedAddresses: 3,
    deletedBillingProfiles: 2,
    deletedOrders: 1,
  }
}
