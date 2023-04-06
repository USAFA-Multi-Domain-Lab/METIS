import { AnyObject } from './modules/toolbox/objects'

export const assetTestData: AnyObject = {
  cyber_city: {
    network_1: {
      bank: {
        color: {
          white: { label: 'white', scriptName: 'BankColor', args: ['white'] },
          blue: { label: 'blue', scriptName: 'BankColor', args: [] },
          red: { label: 'red', scriptName: 'BankColor', args: [] },
          green: { label: 'green', scriptName: 'BankColor', args: [] },
          yellow: { label: 'yellow', scriptName: 'BankColor', args: [] },
          purple: { label: 'purple', scriptName: 'BankColor', args: [] },
          off: { label: 'OFF', scriptName: 'BankColor', args: [] },
          brightOrange: {
            label: 'Bright Orange',
            scriptName: 'BankColor',
            args: [],
          },
        },
      },
    },
  },
}

// traffic: {
//         zone: {
//           commercial: {
//             master: { ON: {label: '', script: '', args: []}, OFF: {label: '', script: '', args: []} },
//             direction: {
//               east: {
//                 color: {
//                   green: { ON: {label: '', script: '', args: []}, OFF: {label: '', script: '', args: []} },
//                   red: { ON: {label: '', script: '', args: []}, OFF: {label: '', script: '', args: []} },
//                   yellow: { ON: {label: '', script: '', args: []}, OFF: {label: '', script: '', args: []} },
//                 },
//               },
//               north: {
//                 color: {
//                   green: { ON: {label: '', script: '', args: []}, OFF: {label: '', script: '', args: []} },
//                   red: { ON: {label: '', script: '', args: []}, OFF: {label: '', script: '', args: []} },
//                   yellow: { ON: {label: '', script: '', args: []}, OFF: {label: '', script: '', args: []} },
//                 },
//               },
//               south: {
//                 color: {
//                   green: { ON: {label: '', script: '', args: []}, OFF: {label: '', script: '', args: []} },
//                   red: { ON: {label: '', script: '', args: []}, OFF: {label: '', script: '', args: []} },
//                   yellow: { ON: {label: '', script: '', args: []}, OFF: {label: '', script: '', args: []} },
//                 },
//               },
//               west: {
//                 color: {
//                   green: { ON: {label: '', script: '', args: []}, OFF: {label: '', script: '', args: []} },
//                   red: { ON: {label: '', script: '', args: []}, OFF: {label: '', script: '', args: []} },
//                   yellow: { ON: {label: '', script: '', args: []}, OFF: {label: '', script: '', args: []} },
//                 },
//               },
//             },
//           },
//           industrial: {
//             master: { ON: {label: '', script: '', args: []}, OFF: {label: '', script: '', args: []} },
//             direction: {
//               east: {
//                 color: {
//                   green: { ON: {label: '', script: '', args: []}, OFF: {label: '', script: '', args: []} },
//                   red: { ON: {label: '', script: '', args: []}, OFF: {label: '', script: '', args: []} },
//                   yellow: { ON: {label: '', script: '', args: []}, OFF: {label: '', script: '', args: []} },
//                 },
//               },
//               north: {
//                 color: {
//                   green: { ON: {label: '', script: '', args: []}, OFF: {label: '', script: '', args: []} },
//                   red: { ON: {label: '', script: '', args: []}, OFF: {label: '', script: '', args: []} },
//                   yellow: { ON: {label: '', script: '', args: []}, OFF: {label: '', script: '', args: []} },
//                 },
//               },
//               south: {
//                 color: {
//                   green: { ON: {label: '', script: '', args: []}, OFF: {label: '', script: '', args: []} },
//                   red: { ON: {label: '', script: '', args: []}, OFF: {label: '', script: '', args: []} },
//                   yellow: { ON: {label: '', script: '', args: []}, OFF: {label: '', script: '', args: []} },
//                 },
//               },
//               west: {
//                 color: {
//                   green: { ON: {label: '', script: '', args: []}, OFF: {label: '', script: '', args: []} },
//                   red: { ON: {label: '', script: '', args: []}, OFF: {label: '', script: '', args: []} },
//                   yellow: { ON: {label: '', script: '', args: []}, OFF: {label: '', script: '', args: []} },
//                 },
//               },
//             },
//           },
//           military: {
//             master: { ON: {label: '', script: '', args: []}, OFF: {label: '', script: '', args: []} },
//             direction: {
//               east: {
//                 color: {
//                   green: { ON: {label: '', script: '', args: []}, OFF: {label: '', script: '', args: []} },
//                   red: { ON: {label: '', script: '', args: []}, OFF: {label: '', script: '', args: []} },
//                   yellow: { ON: {label: '', script: '', args: []}, OFF: {label: '', script: '', args: []} },
//                 },
//               },
//               north: {
//                 color: {
//                   green: { ON: {label: '', script: '', args: []}, OFF: {label: '', script: '', args: []} },
//                   red: { ON: {label: '', script: '', args: []}, OFF: {label: '', script: '', args: []} },
//                   yellow: { ON: {label: '', script: '', args: []}, OFF: {label: '', script: '', args: []} },
//                 },
//               },
//               south: {
//                 color: {
//                   green: { ON: {label: '', script: '', args: []}, OFF: {label: '', script: '', args: []} },
//                   red: { ON: {label: '', script: '', args: []}, OFF: {label: '', script: '', args: []} },
//                   yellow: { ON: {label: '', script: '', args: []}, OFF: {label: '', script: '', args: []} },
//                 },
//               },
//               west: {
//                 color: {
//                   green: { ON: {label: '', script: '', args: []}, OFF: {label: '', script: '', args: []} },
//                   red: { ON: {label: '', script: '', args: []}, OFF: {label: '', script: '', args: []} },
//                   yellow: { ON: {label: '', script: '', args: []}, OFF: {label: '', script: '', args: []} },
//                 },
//               },
//             },
//           },
//           residential: {
//             master: { ON: {label: '', script: '', args: []}, OFF: {label: '', script: '', args: []} },
//             direction: {
//               east: {
//                 color: {
//                   green: { ON: {label: '', script: '', args: []}, OFF: {label: '', script: '', args: []} },
//                   red: { ON: {label: '', script: '', args: []}, OFF: {label: '', script: '', args: []} },
//                   yellow: { ON: {label: '', script: '', args: []}, OFF: {label: '', script: '', args: []} },
//                 },
//               },
//               north: {
//                 color: {
//                   green: { ON: {label: '', script: '', args: []}, OFF: {label: '', script: '', args: []} },
//                   red: { ON: {label: '', script: '', args: []}, OFF: {label: '', script: '', args: []} },
//                   yellow: { ON: {label: '', script: '', args: []}, OFF: {label: '', script: '', args: []} },
//                 },
//               },
//               south: {
//                 color: {
//                   green: { ON: {label: '', script: '', args: []}, OFF: {label: '', script: '', args: []} },
//                   red: { ON: {label: '', script: '', args: []}, OFF: {label: '', script: '', args: []} },
//                   yellow: { ON: {label: '', script: '', args: []}, OFF: {label: '', script: '', args: []} },
//                 },
//               },
//               west: {
//                 color: {
//                   green: { ON: {label: '', script: '', args: []}, OFF: {label: '', script: '', args: []} },
//                   red: { ON: {label: '', script: '', args: []}, OFF: {label: '', script: '', args: []} },
//                   yellow: { ON: {label: '', script: '', args: []}, OFF: {label: '', script: '', args: []} },
//                 },
//               },
//             },
//           },
//         },
//       },
