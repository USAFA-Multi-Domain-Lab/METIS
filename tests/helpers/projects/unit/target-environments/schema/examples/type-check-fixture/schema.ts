import { TargetEnvSchema } from '@server/target-environments/schema/TargetEnvSchema'

/**
 * Stands in for a real target environment's schema file, so that a scan of
 * the folder holding it has something to load and register.
 */
const typeCheckFixture = TargetEnvSchema.create({
  name: 'Type Check Fixture',
  description: 'A target environment used to exercise the directory scan.',
  version: '1.0.0',
  multiRealmSupport: true,
})

export default typeCheckFixture
