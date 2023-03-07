// -- initial --

export let radarAssetData = {
  assetID: 'Radar-1',
  name: 'Radar',
  mechanisms: [
    {
      assetID: 'Radar-1',
      mechanismID: 'Radar-1_Power-1',
      name: 'Power',
      states: [
        {
          mechanismID: 'Radar-1_Power-1',
          mechanismStateID: 'Radar-1_Power-1_ON',
          name: 'ON',
        },
        {
          mechanismID: 'Radar-1_Power-1',
          mechanismStateID: 'Radar-1_Power-1_OFF',
          name: 'OFF',
        },
      ],
    },
    {
      assetID: 'Radar-1',
      mechanismID: 'Radar-1_Motor-1',
      name: 'Motor',
      states: [
        {
          mechanismID: 'Radar-1_Motor-1',
          mechanismStateID: 'Radar-1_Motor-1_ON',
          name: 'ON',
        },
        {
          mechanismID: 'Radar-1_Motor-1',
          mechanismStateID: 'Radar-1_Motor-1_OFF',
          name: 'OFF',
        },
      ],
    },
  ],
}

export let lightsAssetData = {
  assetID: 'Lights-1',
  name: 'Lights',
  mechanisms: [
    {
      assetID: 'Lights-1',
      mechanismID: 'Lights-1_Power-1',
      name: 'Power',
      states: [
        {
          mechanismID: 'Lights-1_Power-1',
          mechanismStateID: 'Lights-1_Power-1_ON',
          name: 'ON',
        },
        {
          mechanismID: 'Lights-1_Power-1',
          mechanismStateID: 'Lights-1_Power-1_OFF',
          name: 'OFF',
        },
      ],
    },
    {
      assetID: 'Lights-1',
      mechanismID: 'Lights-1_Color-1',
      name: 'Color',
      states: [
        {
          mechanismID: 'Lights-1_Color-1',
          mechanismStateID: 'Lights-1_Color-1_ON',
          name: 'ON',
        },
        {
          mechanismID: 'Lights-1_Color-1',
          mechanismStateID: 'Lights-1_Color-1_OFF',
          name: 'OFF',
        },
      ],
    },
  ],
}
