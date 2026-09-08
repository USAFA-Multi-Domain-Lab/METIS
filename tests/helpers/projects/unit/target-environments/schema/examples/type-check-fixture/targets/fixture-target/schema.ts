import { TargetSchema } from '@server/target-environments/schema/TargetSchema'

/**
 * The one target belonging to the fixture environment, so that a scan of
 * the environment has a target to find and register alongside it.
 */
const fixtureTarget = TargetSchema.create({
  _id: 'fixture-target',
  name: 'Fixture Target',
  description: 'A target that does nothing, used to exercise the scan.',
  script: async () => {},
  parameters: [],
})

export default fixtureTarget
