/**
 * Represents the `metis` target environment.
 */
const metis = new TargetEnvSchema({
  name: 'METIS (Internal Effects)',
  description:
    'A target-environment which allows effects to be produced within METIS itself, without interfacing with external software.',
  version: METIS_VERSION,
})

export default metis
