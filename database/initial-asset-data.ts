// -- initial --

export let radarAssetData = {
  assetID: 'Radar',
  name: 'Radar',
  mechanisms: [
    {
      assetID: 'Radar',
      mechanismID: 'Radar-Power',
      name: 'Power',
      states: [
        {
          mechanismID: 'Radar-Power',
          mechanismStateID: 'Radar-Power-ON',
          name: 'ON',
        },
        {
          mechanismID: 'Radar-Power',
          mechanismStateID: 'Radar-Power-OFF',
          name: 'OFF',
        },
      ],
    },
    {
      assetID: 'Radar',
      mechanismID: 'Radar-Motor',
      name: 'Motor',
      states: [
        {
          mechanismID: 'Radar-Motor',
          mechanismStateID: 'Radar-Motor-ON',
          name: 'ON',
        },
        {
          mechanismID: 'Radar-Motor',
          mechanismStateID: 'Radar-Motor-OFF',
          name: 'OFF',
        },
      ],
    },
  ],
}

export let lightsAssetData = {
  assetID: 'Lights',
  name: 'Lights',
  mechanisms: [
    {
      assetID: 'Lights',
      mechanismID: 'Lights-Power',
      name: 'Power',
      states: [
        {
          mechanismID: 'Lights-Power',
          mechanismStateID: 'Lights-Power-ON',
          name: 'ON',
        },
        {
          mechanismID: 'Lights-Power',
          mechanismStateID: 'Lights-Power-OFF',
          name: 'OFF',
        },
      ],
    },
    {
      assetID: 'Lights',
      mechanismID: 'Lights-Color',
      name: 'Color',
      states: [
        {
          mechanismID: 'Lights-Color',
          mechanismStateID: 'Lights-Color-ON',
          name: 'ON',
        },
        {
          mechanismID: 'Lights-Color',
          mechanismStateID: 'Lights-Color-OFF',
          name: 'OFF',
        },
      ],
    },
  ],
}
