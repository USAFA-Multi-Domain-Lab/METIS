/**
 * Represents the `metis` target environment.
 */
const metis = new TargetEnvSchema({
  name: 'METIS (Internal Effects)',
  description:
    'A target-environment which allows effects to be produced within METIS itself, without interfacing with external software.',
  version: '0.2.1',
})

export default metis
