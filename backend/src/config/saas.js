/** Default tenant used for legacy imports, dev seed, and Jest anonymous API access. */
const DEFAULT_TENANT_ORG_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

/** Synthetic user used when NODE_ENV=test and no Authorization header (integration tests). */
const TEST_USER_ID = '11111111-1111-4111-8111-111111111111';

module.exports = {
  DEFAULT_TENANT_ORG_ID,
  TEST_USER_ID
};
