// -- initial --

export let radarAssetData = {
  assetID: 'Radar_1',
  name: 'Radar',
  mechanisms: [
    {
      assetID: 'Radar_1',
      mechanismID: 'Power_1',
      name: 'Power',
      states: [
        {
          mechanismID: 'Power_1',
          mechanismStateID: 'ON',
          name: 'ON',
        },
        {
          mechanismID: 'Power_1',
          mechanismStateID: 'OFF',
          name: 'OFF',
        },
      ],
    },
    {
      assetID: 'Radar_1',
      mechanismID: 'Motor_1',
      name: 'Motor',
      states: [
        {
          mechanismID: 'Motor_1',
          mechanismStateID: 'ON',
          name: 'ON',
        },
        {
          mechanismID: 'Motor_1',
          mechanismStateID: 'OFF',
          name: 'OFF',
        },
      ],
    },
  ],
}
