import { AnyObject } from './modules/toolbox/objects'

export const assetTestData: AnyObject = {
  cyber_city: {
    network_1: {
      bank: {
        color: {
          white: {
            label: 'Cyber-City_Bank-Light: "white"',
            description: 'Turns the bank color to white.',
            scriptName: 'BankColor',
            originalPath: '',
            args: { color: 'white' },
          },
          blue: {
            label: 'Cyber-City_Bank-Light: "blue"',
            description: 'Turns the bank color to blue.',
            scriptName: 'BankColor',
            originalPath: '',
            args: { color: 'blue' },
          },
          red: {
            label: 'Cyber-City_Bank-Light: "red"',
            description: 'Turns the bank color to red.',
            scriptName: 'BankColor',
            originalPath: '',
            args: { color: 'red' },
          },
          green: {
            label: 'Cyber-City_Bank-Light: "green"',
            description: 'Turns the bank color to green.',
            scriptName: 'BankColor',
            originalPath: '',
            args: { color: 'green' },
          },
          yellow: {
            label: 'Cyber-City_Bank-Light: "yellow"',
            description: 'Turns the bank color to yellow.',
            scriptName: 'BankColor',
            originalPath: '',
            args: { color: 'yellow' },
          },
          purple: {
            label: 'Cyber-City_Bank-Light: "purple"',
            description: 'Turns the bank color to purple.',
            scriptName: 'BankColor',
            originalPath: '',
            args: { color: 'purple' },
          },
          off: {
            label: 'Cyber-City_Bank-Light: "OFF"',
            description: 'Turns the bank color off.',
            scriptName: 'BankColor',
            originalPath: '',
            args: { color: 'off' },
          },
        },
      },
      traffic: {
        zone: {
          commercial: {
            // master: {
            //   ON: {
            //     label: 'ON',
            //     description:
            //       'This will turn on every color in every direction.',
            //     scriptName: 'TrafficLight',
            //     args: 'ON'
            //   },
            //   OFF: {
            //     label: 'OFF',
            //     description:
            //       'This will turn off every color in every direction.',
            //     scriptName: 'TrafficLight',
            //     args: 'OFF'
            //   },
            // },
            direction: {
              east: {
                color: {
                  green: {
                    ON: {
                      label: 'Cyber-City_Traffic-Commercial-East-Green: "ON"',
                      description:
                        'Turns on the east-bound green light in the commercial area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'commercial',
                        direction: 'east',
                        color: 'green',
                        state: 'ON',
                      },
                    },
                    OFF: {
                      label: 'Cyber-City_Traffic-Commercial-East-Green: "OFF"',
                      description:
                        'Turns off the east-bound green light in the commercial area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'commercial',
                        direction: 'east',
                        color: 'green',
                        state: 'OFF',
                      },
                    },
                  },
                  red: {
                    ON: {
                      label: 'Cyber-City_Traffic-Commercial-East-Red: "ON"',
                      description:
                        'Turns on the east-bound red light in the commercial area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'commercial',
                        direction: 'east',
                        color: 'red',
                        state: 'ON',
                      },
                    },
                    OFF: {
                      label: 'Cyber-City_Traffic-Commercial-East-Red: "OFF"',
                      description:
                        'Turns off the east-bound red light in the commercial area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'commercial',
                        direction: 'east',
                        color: 'red',
                        state: 'OFF',
                      },
                    },
                  },
                  yellow: {
                    ON: {
                      label: 'Cyber-City_Traffic-Commercial-East-Yellow: "ON"',
                      description:
                        'Turns on the east-bound yellow light in the commercial area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'commercial',
                        direction: 'east',
                        color: 'yellow',
                        state: 'ON',
                      },
                    },
                    OFF: {
                      label: 'Cyber-City_Traffic-Commercial-East-Yellow: "OFF"',
                      description:
                        'Turns off the east-bound yellow light in the commercial area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'commercial',
                        direction: 'east',
                        color: 'yellow',
                        state: 'OFF',
                      },
                    },
                  },
                },
              },
              north: {
                color: {
                  green: {
                    ON: {
                      label: 'ON',
                      description:
                        'Turns on the north-bound green light in the commercial area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'commercial',
                        direction: 'north',
                        color: 'green',
                        state: 'ON',
                      },
                    },
                    OFF: {
                      label: 'Cyber-City_Traffic-Commercial-North-Green: "OFF"',
                      description:
                        'Turns off the north-bound green light in the commercial area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'commercial',
                        direction: 'north',
                        color: 'green',
                        state: 'OFF',
                      },
                    },
                  },
                  red: {
                    ON: {
                      label: 'Cyber-City_Traffic-Commercial-North-Red: "ON"',
                      description:
                        'Turns on the north-bound red light in the commercial area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'commercial',
                        direction: 'north',
                        color: 'red',
                        state: 'ON',
                      },
                    },
                    OFF: {
                      label: 'Cyber-City_Traffic-Commercial-North-Red: "OFF"',
                      description:
                        'Turns off the north-bound red light in the commercial area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'commercial',
                        direction: 'north',
                        color: 'red',
                        state: 'OFF',
                      },
                    },
                  },
                  yellow: {
                    ON: {
                      label: 'Cyber-City_Traffic-Commercial-North-Yellow: "ON"',
                      description:
                        'Turns on the north-bound yellow light in the commercial area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'commercial',
                        direction: 'north',
                        color: 'yellow',
                        state: 'ON',
                      },
                    },
                    OFF: {
                      label:
                        'Cyber-City_Traffic-Commercial-North-Yellow: "OFF"',
                      description:
                        'Turns off the north-bound yellow light in the commercial area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'commercial',
                        direction: 'north',
                        color: 'yellow',
                        state: 'OFF',
                      },
                    },
                  },
                },
              },
              south: {
                color: {
                  green: {
                    ON: {
                      label: 'Cyber-City_Traffic-Commercial-South-Green: "ON"',
                      description:
                        'Turns on the south-bound green light in the commercial area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'commercial',
                        direction: 'south',
                        color: 'green',
                        state: 'ON',
                      },
                    },
                    OFF: {
                      label: 'Cyber-City_Traffic-Commercial-South-Green: "OFF"',
                      description:
                        'Turns off the south-bound green light in the commercial area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'commercial',
                        direction: 'south',
                        color: 'green',
                        state: 'OFF',
                      },
                    },
                  },
                  red: {
                    ON: {
                      label: 'Cyber-City_Traffic-Commercial-South-Red: "ON"',
                      description:
                        'Turns on the south-bound red light in the commercial area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'commercial',
                        direction: 'south',
                        color: 'red',
                        state: 'ON',
                      },
                    },
                    OFF: {
                      label: 'Cyber-City_Traffic-Commercial-South-Red: "OFF"',
                      description:
                        'Turns off the south-bound red light in the commercial area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'commercial',
                        direction: 'south',
                        color: 'red',
                        state: 'OFF',
                      },
                    },
                  },
                  yellow: {
                    ON: {
                      label: 'Cyber-City_Traffic-Commercial-South-Yellow: "ON"',
                      description:
                        'Turns on the south-bound yellow light in the commercial area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'commercial',
                        direction: 'south',
                        color: 'yellow',
                        state: 'ON',
                      },
                    },
                    OFF: {
                      label:
                        'Cyber-City_Traffic-Commercial-South-Yellow: "OFF"',
                      description:
                        'Turns off the south-bound yellow light in the commercial area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'commercial',
                        direction: 'south',
                        color: 'yellow',
                        state: 'OFF',
                      },
                    },
                  },
                },
              },
              west: {
                color: {
                  green: {
                    ON: {
                      label: 'Cyber-City_Traffic-Commercial-West-Green: "ON"',
                      description:
                        'Turns on the west-bound green light in the commercial area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'commercial',
                        direction: 'west',
                        color: 'green',
                        state: 'ON',
                      },
                    },
                    OFF: {
                      label: 'Cyber-City_Traffic-Commercial-West-Green: "OFF"',
                      description:
                        'Turns off the west-bound green light in the commercial area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'commercial',
                        direction: 'west',
                        color: 'green',
                        state: 'OFF',
                      },
                    },
                  },
                  red: {
                    ON: {
                      label: 'Cyber-City_Traffic-Commercial-West-Red: "ON"',
                      description:
                        'Turns on the west-bound red light in the commercial area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'commercial',
                        direction: 'west',
                        color: 'red',
                        state: 'ON',
                      },
                    },
                    OFF: {
                      label: 'Cyber-City_Traffic-Commercial-West-Red: "OFF"',
                      description:
                        'Turns off the west-bound red light in the commercial area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'commercial',
                        direction: 'west',
                        color: 'red',
                        state: 'OFF',
                      },
                    },
                  },
                  yellow: {
                    ON: {
                      label: 'Cyber-City_Traffic-Commercial-West-Yellow: "ON"',
                      description:
                        'Turns on the west-bound yellow light in the commercial area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'commercial',
                        direction: 'west',
                        color: 'yellow',
                        state: 'ON',
                      },
                    },
                    OFF: {
                      label: 'Cyber-City_Traffic-Commercial-West-Yellow: "OFF"',
                      description:
                        'Turns off the west-bound yellow light in the commercial area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'commercial',
                        direction: 'west',
                        color: 'yellow',
                        state: 'OFF',
                      },
                    },
                  },
                },
              },
            },
          },
          industrial: {
            // master: {
            //   ON: {
            //     label: 'ON',
            //     description:
            //       'This will turn on every color in every direction.',
            //     scriptName: 'TrafficLight',
            //     args: 'ON'
            //   },
            //   OFF: {
            //     label: 'OFF',
            //     description:
            //       'This will turn off every color in every direction.',
            //     scriptName: 'TrafficLight',
            // args: 'OFF'
            //   },
            // },
            direction: {
              east: {
                color: {
                  green: {
                    ON: {
                      label: 'Cyber-City_Traffic-Industrial-East-Green: "ON"',
                      description:
                        'Turns on the east-bound green light in the industrial area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'industrial',
                        direction: 'east',
                        color: 'green',
                        state: 'ON',
                      },
                    },
                    OFF: {
                      label: 'Cyber-City_Traffic-Industrial-East-Green: "OFF"',
                      description:
                        'Turns off the east-bound green light in the industrial area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'industrial',
                        direction: 'east',
                        color: 'green',
                        state: 'OFF',
                      },
                    },
                  },
                  red: {
                    ON: {
                      label: 'Cyber-City_Traffic-Industrial-East-Red: "ON"',
                      description:
                        'Turns on the east-bound red light in the industrial area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'industrial',
                        direction: 'east',
                        color: 'red',
                        state: 'ON',
                      },
                    },
                    OFF: {
                      label: 'Cyber-City_Traffic-Industrial-East-Red: "OFF"',
                      description:
                        'Turns off the east-bound red light in the industrial area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'industrial',
                        direction: 'east',
                        color: 'red',
                        state: 'OFF',
                      },
                    },
                  },
                  yellow: {
                    ON: {
                      label: 'Cyber-City_Traffic-Industrial-East-Yellow: "ON"',
                      description:
                        'Turns on the east-bound yellow light in the industrial area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'industrial',
                        direction: 'east',
                        color: 'yellow',
                        state: 'ON',
                      },
                    },
                    OFF: {
                      label: 'Cyber-City_Traffic-Industrial-East-Yellow: "OFF"',
                      description:
                        'Turns off the east-bound yellow light in the industrial area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'industrial',
                        direction: 'east',
                        color: 'yellow',
                        state: 'OFF',
                      },
                    },
                  },
                },
              },
              north: {
                color: {
                  green: {
                    ON: {
                      label: 'Cyber-City_Traffic-Industrial-North-Green: "ON"',
                      description:
                        'Turns on the north-bound green light in the industrial area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'industrial',
                        direction: 'north',
                        color: 'green',
                        state: 'ON',
                      },
                    },
                    OFF: {
                      label: 'Cyber-City_Traffic-Industrial-North-Green: "OFF"',
                      description:
                        'Turns off the north-bound green light in the industrial area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'industrial',
                        direction: 'north',
                        color: 'green',
                        state: 'OFF',
                      },
                    },
                  },
                  red: {
                    ON: {
                      label: 'Cyber-City_Traffic-Industrial-North-Red: "ON"',
                      description:
                        'Turns on the north-bound red light in the industrial area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'industrial',
                        direction: 'north',
                        color: 'red',
                        state: 'ON',
                      },
                    },
                    OFF: {
                      label: 'Cyber-City_Traffic-Industrial-North-Red: "OFF"',
                      description:
                        'Turns off the north-bound red light in the industrial area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'industrial',
                        direction: 'north',
                        color: 'red',
                        state: 'OFF',
                      },
                    },
                  },
                  yellow: {
                    ON: {
                      label: 'Cyber-City_Traffic-Industrial-North-Yellow: "ON"',
                      description:
                        'Turns on the north-bound yellow light in the industrial area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'industrial',
                        direction: 'north',
                        color: 'yellow',
                        state: 'ON',
                      },
                    },
                    OFF: {
                      label:
                        'Cyber-City_Traffic-Industrial-North-Yellow: "OFF"',
                      description:
                        'Turns off the north-bound yellow light in the industrial area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'industrial',
                        direction: 'north',
                        color: 'yellow',
                        state: 'OFF',
                      },
                    },
                  },
                },
              },
              south: {
                color: {
                  green: {
                    ON: {
                      label: 'Cyber-City_Traffic-Industrial-South-Green: "ON"',
                      description:
                        'Turns on the south-bound green light in the industrial area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'industrial',
                        direction: 'south',
                        color: 'green',
                        state: 'ON',
                      },
                    },
                    OFF: {
                      label: 'Cyber-City_Traffic-Industrial-South-Green: "OFF"',
                      description:
                        'Turns off the south-bound green light in the industrial area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'industrial',
                        direction: 'south',
                        color: 'green',
                        state: 'OFF',
                      },
                    },
                  },
                  red: {
                    ON: {
                      label: 'Cyber-City_Traffic-Industrial-South-Red: "ON"',
                      description:
                        'Turns on the south-bound red light in the industrial area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'industrial',
                        direction: 'south',
                        color: 'red',
                        state: 'ON',
                      },
                    },
                    OFF: {
                      label: 'Cyber-City_Traffic-Industrial-South-Red: "OFF"',
                      description:
                        'Turns off the south-bound red light in the industrial area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'industrial',
                        direction: 'south',
                        color: 'red',
                        state: 'OFF',
                      },
                    },
                  },
                  yellow: {
                    ON: {
                      label: 'Cyber-City_Traffic-Industrial-South-Yellow: "ON"',
                      description:
                        'Turns on the south-bound yellow light in the industrial area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'industrial',
                        direction: 'south',
                        color: 'yellow',
                        state: 'ON',
                      },
                    },
                    OFF: {
                      label:
                        'Cyber-City_Traffic-Industrial-South-Yellow: "OFF"',
                      description:
                        'Turns off the south-bound yellow light in the industrial area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'industrial',
                        direction: 'south',
                        color: 'yellow',
                        state: 'OFF',
                      },
                    },
                  },
                },
              },
              west: {
                color: {
                  green: {
                    ON: {
                      label: 'Cyber-City_Traffic-Industrial-West-Green: "ON"',
                      description:
                        'Turns on the west-bound green light in the industrial area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'industrial',
                        direction: 'west',
                        color: 'green',
                        state: 'ON',
                      },
                    },
                    OFF: {
                      label: 'Cyber-City_Traffic-Industrial-West-Green: "OFF"',
                      description:
                        'Turns off the west-bound green light in the industrial area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'industrial',
                        direction: 'west',
                        color: 'green',
                        state: 'OFF',
                      },
                    },
                  },
                  red: {
                    ON: {
                      label: 'Cyber-City_Traffic-Industrial-West-Red: "ON"',
                      description:
                        'Turns on the west-bound red light in the industrial area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'industrial',
                        direction: 'west',
                        color: 'red',
                        state: 'ON',
                      },
                    },
                    OFF: {
                      label: 'Cyber-City_Traffic-Industrial-West-Red: "OFF"',
                      description:
                        'Turns off the west-bound red light in the industrial area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'industrial',
                        direction: 'west',
                        color: 'red',
                        state: 'OFF',
                      },
                    },
                  },
                  yellow: {
                    ON: {
                      label: 'Cyber-City_Traffic-Industrial-West-Yellow: "ON"',
                      description:
                        'Turns on the west-bound yellow light in the industrial area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'industrial',
                        direction: 'west',
                        color: 'yellow',
                        state: 'ON',
                      },
                    },
                    OFF: {
                      label: 'Cyber-City_Traffic-Industrial-West-Yellow: "OFF"',
                      description:
                        'Turns off the west-bound yellow light in the industrial area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'industrial',
                        direction: 'west',
                        color: 'yellow',
                        state: 'OFF',
                      },
                    },
                  },
                },
              },
            },
          },
          military: {
            // master: {
            //   ON: {
            //     label: 'ON',
            //     description:
            //       'This will turn on every color in every direction.',
            //     scriptName: 'TrafficLight',
            //     args: 'ON'
            //   },
            //   OFF: {
            //     label: 'OFF',
            //     description:
            //       'This will turn off every color in every direction.',
            //     scriptName: 'TrafficLight',
            //     args: 'OFF'
            //   },
            // },
            direction: {
              east: {
                color: {
                  green: {
                    ON: {
                      label: 'Cyber-City_Traffic-Military-East-Green: "ON"',
                      description:
                        'Turns on the east-bound green light in the military area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'military',
                        direction: 'east',
                        color: 'green',
                        state: 'ON',
                      },
                    },
                    OFF: {
                      label: 'Cyber-City_Traffic-Military-East-Green: "OFF"',
                      description:
                        'Turns off the east-bound green light in the military area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'military',
                        direction: 'east',
                        color: 'green',
                        state: 'OFF',
                      },
                    },
                  },
                  red: {
                    ON: {
                      label: 'Cyber-City_Traffic-Military-East-Red: "ON"',
                      description:
                        'Turns on the east-bound red light in the military area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'military',
                        direction: 'east',
                        color: 'red',
                        state: 'ON',
                      },
                    },
                    OFF: {
                      label: 'Cyber-City_Traffic-Military-East-Red: "OFF"',
                      description:
                        'Turns off the east-bound red light in the military area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'military',
                        direction: 'east',
                        color: 'red',
                        state: 'OFF',
                      },
                    },
                  },
                  yellow: {
                    ON: {
                      label: 'Cyber-City_Traffic-Military-East-Yellow: "ON"',
                      description:
                        'Turns on the east-bound yellow light in the military area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'military',
                        direction: 'east',
                        color: 'yellow',
                        state: 'ON',
                      },
                    },
                    OFF: {
                      label: 'Cyber-City_Traffic-Military-East-Yellow: "OFF"',
                      description:
                        'Turns off the east-bound yellow light in the military area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'military',
                        direction: 'east',
                        color: 'yellow',
                        state: 'OFF',
                      },
                    },
                  },
                },
              },
              north: {
                color: {
                  green: {
                    ON: {
                      label: 'Cyber-City_Traffic-Military-North-Green: "ON"',
                      description:
                        'Turns on the north-bound green light in the military area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'military',
                        direction: 'north',
                        color: 'green',
                        state: 'ON',
                      },
                    },
                    OFF: {
                      label: 'Cyber-City_Traffic-Military-North-Green: "OFF"',
                      description:
                        'Turns off the north-bound green light in the military area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'military',
                        direction: 'north',
                        color: 'green',
                        state: 'OFF',
                      },
                    },
                  },
                  red: {
                    ON: {
                      label: 'Cyber-City_Traffic-Military-North-Red: "ON"',
                      description:
                        'Turns on the north-bound red light in the military area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'military',
                        direction: 'north',
                        color: 'red',
                        state: 'ON',
                      },
                    },
                    OFF: {
                      label: 'Cyber-City_Traffic-Military-North-Red: "OFF"',
                      description:
                        'Turns off the north-bound red light in the military area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'military',
                        direction: 'north',
                        color: 'red',
                        state: 'OFF',
                      },
                    },
                  },
                  yellow: {
                    ON: {
                      label: 'Cyber-City_Traffic-Military-North-Yellow: "ON"',
                      description:
                        'Turns on the north-bound yellow light in the military area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'military',
                        direction: 'north',
                        color: 'yellow',
                        state: 'ON',
                      },
                    },
                    OFF: {
                      label: 'Cyber-City_Traffic-Military-North-Yellow: "OFF"',
                      description:
                        'Turns off the north-bound yellow light in the military area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'military',
                        direction: 'north',
                        color: 'yellow',
                        state: 'OFF',
                      },
                    },
                  },
                },
              },
              south: {
                color: {
                  green: {
                    ON: {
                      label: 'Cyber-City_Traffic-Military-South-Green: "ON"',
                      description:
                        'Turns on the south-bound green light in the military area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'military',
                        direction: 'south',
                        color: 'green',
                        state: 'ON',
                      },
                    },
                    OFF: {
                      label: 'Cyber-City_Traffic-Military-South-Green: "OFF"',
                      description:
                        'Turns off the south-bound green light in the military area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'military',
                        direction: 'south',
                        color: 'green',
                        state: 'OFF',
                      },
                    },
                  },
                  red: {
                    ON: {
                      label: 'Cyber-City_Traffic-Military-South-Red: "ON"',
                      description:
                        'Turns on the south-bound red light in the military area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'military',
                        direction: 'south',
                        color: 'red',
                        state: 'ON',
                      },
                    },
                    OFF: {
                      label: 'Cyber-City_Traffic-Military-South-Red: "OFF"',
                      description:
                        'Turns off the south-bound red light in the military area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'military',
                        direction: 'south',
                        color: 'red',
                        state: 'OFF',
                      },
                    },
                  },
                  yellow: {
                    ON: {
                      label: 'Cyber-City_Traffic-Military-South-Yellow: "ON"',
                      description:
                        'Turns on the south-bound yellow light in the military area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'military',
                        direction: 'south',
                        color: 'yellow',
                        state: 'ON',
                      },
                    },
                    OFF: {
                      label: 'Cyber-City_Traffic-Military-South-Yellow: "OFF"',
                      description:
                        'Turns off the south-bound yellow light in the military area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'military',
                        direction: 'south',
                        color: 'yellow',
                        state: 'OFF',
                      },
                    },
                  },
                },
              },
              west: {
                color: {
                  green: {
                    ON: {
                      label: 'Cyber-City_Traffic-Military-West-Green: "ON"',
                      description:
                        'Turns on the west-bound green light in the military area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'military',
                        direction: 'west',
                        color: 'green',
                        state: 'ON',
                      },
                    },
                    OFF: {
                      label: 'Cyber-City_Traffic-Military-West-Green: "OFF"',
                      description:
                        'Turns off the west-bound green light in the military area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'military',
                        direction: 'west',
                        color: 'green',
                        state: 'OFF',
                      },
                    },
                  },
                  red: {
                    ON: {
                      label: 'Cyber-City_Traffic-Military-West-Red: "ON"',
                      description:
                        'Turns on the west-bound red light in the military area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'military',
                        direction: 'west',
                        color: 'red',
                        state: 'ON',
                      },
                    },
                    OFF: {
                      label: 'Cyber-City_Traffic-Military-West-Red: "OFF"',
                      description:
                        'Turns off the west-bound red light in the military area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'military',
                        direction: 'west',
                        color: 'red',
                        state: 'OFF',
                      },
                    },
                  },
                  yellow: {
                    ON: {
                      label: 'Cyber-City_Traffic-Military-West-Yellow: "ON"',
                      description:
                        'Turns on the west-bound yellow light in the military area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'military',
                        direction: 'west',
                        color: 'yellow',
                        state: 'ON',
                      },
                    },
                    OFF: {
                      label: 'Cyber-City_Traffic-Military-West-Yellow: "OFF"',
                      description:
                        'Turns off the west-bound yellow light in the military area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'military',
                        direction: 'west',
                        color: 'yellow',
                        state: 'OFF',
                      },
                    },
                  },
                },
              },
            },
          },
          residential: {
            // master: {
            //   ON: {
            //     label: 'ON',
            //     description:
            //       'This will turn on every color in every direction.',
            //     scriptName: 'TrafficLight',
            //     args: 'ON'
            //   },
            //   OFF: {
            //     label: 'OFF',
            //     description:
            //       'This will turn off every color in every direction.',
            //     scriptName: 'TrafficLight',
            //     args: 'OFF'
            //   },
            // },
            direction: {
              east: {
                color: {
                  green: {
                    ON: {
                      label: 'Cyber-City_Traffic-Residential-East-Green: "ON"',
                      description:
                        'Turns on the east-bound green light in the residential area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'residential',
                        direction: 'east',
                        color: 'green',
                        state: 'ON',
                      },
                    },
                    OFF: {
                      label: 'Cyber-City_Traffic-Residential-East-Green: "OFF"',
                      description:
                        'Turns off the east-bound green light in the residential area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'residential',
                        direction: 'east',
                        color: 'green',
                        state: 'OFF',
                      },
                    },
                  },
                  red: {
                    ON: {
                      label: 'Cyber-City_Traffic-Residential-East-Red: "ON"',
                      description:
                        'Turns on the east-bound red light in the residential area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'residential',
                        direction: 'east',
                        color: 'red',
                        state: 'ON',
                      },
                    },
                    OFF: {
                      label: 'Cyber-City_Traffic-Residential-East-Red: "OFF"',
                      description:
                        'Turns off the east-bound red light in the residential area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'residential',
                        direction: 'east',
                        color: 'red',
                        state: 'OFF',
                      },
                    },
                  },
                  yellow: {
                    ON: {
                      label: 'Cyber-City_Traffic-Residential-East-Yellow: "ON"',
                      description:
                        'Turns on the east-bound yellow light in the residential area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'residential',
                        direction: 'east',
                        color: 'yellow',
                        state: 'ON',
                      },
                    },
                    OFF: {
                      label:
                        'Cyber-City_Traffic-Residential-East-Yellow: "OFF"',
                      description:
                        'Turns off the east-bound yellow light in the residential area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'residential',
                        direction: 'east',
                        color: 'yellow',
                        state: 'OFF',
                      },
                    },
                  },
                },
              },
              north: {
                color: {
                  green: {
                    ON: {
                      label: 'Cyber-City_Traffic-Residential-North-Green: "ON"',
                      description:
                        'Turns on the north-bound green light in the residential area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'residential',
                        direction: 'north',
                        color: 'green',
                        state: 'ON',
                      },
                    },
                    OFF: {
                      label:
                        'Cyber-City_Traffic-Residential-North-Green: "OFF"',
                      description:
                        'Turns off the north-bound green light in the residential area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'residential',
                        direction: 'north',
                        color: 'green',
                        state: 'OFF',
                      },
                    },
                  },
                  red: {
                    ON: {
                      label: 'Cyber-City_Traffic-Residential-North-Red: "ON"',
                      description:
                        'Turns on the north-bound red light in the residential area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'residential',
                        direction: 'north',
                        color: 'red',
                        state: 'ON',
                      },
                    },
                    OFF: {
                      label: 'Cyber-City_Traffic-Residential-North-Red: "OFF"',
                      description:
                        'Turns off the north-bound red light in the residential area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'residential',
                        direction: 'north',
                        color: 'red',
                        state: 'OFF',
                      },
                    },
                  },
                  yellow: {
                    ON: {
                      label:
                        'Cyber-City_Traffic-Residential-North-Yellow: "ON"',
                      description:
                        'Turns on the north-bound yellow light in the residential area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'residential',
                        direction: 'north',
                        color: 'yellow',
                        state: 'ON',
                      },
                    },
                    OFF: {
                      label:
                        'Cyber-City_Traffic-Residential-North-Yellow: "OFF"',
                      description:
                        'Turns off the north-bound yellow light in the residential area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'residential',
                        direction: 'north',
                        color: 'yellow',
                        state: 'OFF',
                      },
                    },
                  },
                },
              },
              south: {
                color: {
                  green: {
                    ON: {
                      label: 'Cyber-City_Traffic-Residential-South-Green: "ON"',
                      description:
                        'Turns on the south-bound green light in the residential area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'residential',
                        direction: 'south',
                        color: 'green',
                        state: 'ON',
                      },
                    },
                    OFF: {
                      label:
                        'Cyber-City_Traffic-Residential-South-Green: "OFF"',
                      description:
                        'Turns off the south-bound green light in the residential area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'residential',
                        direction: 'south',
                        color: 'green',
                        state: 'OFF',
                      },
                    },
                  },
                  red: {
                    ON: {
                      label: 'Cyber-City_Traffic-Residential-South-Red: "ON"',
                      description:
                        'Turns on the south-bound red light in the residential area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'residential',
                        direction: 'south',
                        color: 'red',
                        state: 'ON',
                      },
                    },
                    OFF: {
                      label: 'Cyber-City_Traffic-Residential-South-Red: "OFF"',
                      description:
                        'Turns off the south-bound red light in the residential area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'residential',
                        direction: 'south',
                        color: 'red',
                        state: 'OFF',
                      },
                    },
                  },
                  yellow: {
                    ON: {
                      label:
                        'Cyber-City_Traffic-Residential-South-Yellow: "ON"',
                      description:
                        'Turns on the south-bound yellow light in the residential area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'residential',
                        direction: 'south',
                        color: 'yellow',
                        state: 'ON',
                      },
                    },
                    OFF: {
                      label:
                        'Cyber-City_Traffic-Residential-South-Yellow: "OFF"',
                      description:
                        'Turns off the south-bound yellow light in the residential area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'residential',
                        direction: 'south',
                        color: 'yellow',
                        state: 'OFF',
                      },
                    },
                  },
                },
              },
              west: {
                color: {
                  green: {
                    ON: {
                      label: 'Cyber-City_Traffic-Residential-West-Green: "ON"',
                      description:
                        'Turns on the west-bound green light in the residential area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'residential',
                        direction: 'west',
                        color: 'green',
                        state: 'ON',
                      },
                    },
                    OFF: {
                      label: 'Cyber-City_Traffic-Residential-West-Green: "OFF"',
                      description:
                        'Turns off the west-bound green light in the residential area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'residential',
                        direction: 'west',
                        color: 'green',
                        state: 'OFF',
                      },
                    },
                  },
                  red: {
                    ON: {
                      label: 'Cyber-City_Traffic-Residential-West-Red: "ON"',
                      description:
                        'Turns on the west-bound red light in the residential area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'residential',
                        direction: 'west',
                        color: 'red',
                        state: 'ON',
                      },
                    },
                    OFF: {
                      label: 'Cyber-City_Traffic-Residential-West-Red: "OFF"',
                      description:
                        'Turns off the west-bound red light in the residential area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'residential',
                        direction: 'west',
                        color: 'red',
                        state: 'OFF',
                      },
                    },
                  },
                  yellow: {
                    ON: {
                      label: 'Cyber-City_Traffic-Residential-West-Yellow: "ON"',
                      description:
                        'Turns on the west-bound yellow light in the residential area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'residential',
                        direction: 'west',
                        color: 'yellow',
                        state: 'ON',
                      },
                    },
                    OFF: {
                      label:
                        'Cyber-City_Traffic-Residential-West-Yellow: "OFF"',
                      description:
                        'Turns off the west-bound yellow light in the residential area.',
                      scriptName: 'TrafficLight',
                      originalPath: '',
                      args: {
                        zone: 'residential',
                        direction: 'west',
                        color: 'yellow',
                        state: 'OFF',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      gas: {
        all_sections: {
          on: {
            label: 'Cyber-City_Gas-All-Sections: "ON"',
            description: 'Turns gas section 1 on.',
            scriptName: 'Gas',
            originalPath: '',
            args: { state: 'ON' },
          },
          off: {
            label: 'Cyber-City_Gas-All-Sections: "OFF"',
            description: 'Turns gas section 1 off.',
            scriptName: 'Gas',
            originalPath: '',
            args: { state: 'OFF' },
          },
        },
        sections: {
          section_1: {
            on: {
              label: 'Cyber-City_Gas-Section-1: "ON"',
              description: 'Turns gas section 1 on.',
              scriptName: 'Gas',
              originalPath: '',
              args: { section: '1', state: 'ON' },
            },
            off: {
              label: 'Cyber-City_Gas-Section-1: "OFF"',
              description: 'Turns gas section 1 off.',
              scriptName: 'Gas',
              originalPath: '',
              args: { section: '1', state: 'OFF' },
            },
          },
          section_2: {
            on: {
              label: 'Cyber-City_Gas-Section-2: "ON"',
              description: 'Turns gas section 2 on.',
              scriptName: 'Gas',
              originalPath: '',
              args: { section: '2', state: 'ON' },
            },
            off: {
              label: 'Cyber-City_Gas-Section-2: "OFF"',
              description: 'Turns gas section 2 off.',
              scriptName: 'Gas',
              originalPath: '',
              args: { section: '2', state: 'OFF' },
            },
          },
          section_3: {
            on: {
              label: 'Cyber-City_Gas-Section-3: "ON"',
              description: 'Turns gas section 3 on.',
              scriptName: 'Gas',
              originalPath: '',
              args: { section: '3', state: 'ON' },
            },
            off: {
              label: 'Cyber-City_Gas-Section-3: "OFF"',
              description: 'Turns gas section 3 off.',
              scriptName: 'Gas',
              originalPath: '',
              args: { section: '3', state: 'OFF' },
            },
          },
        },
      },
      light_strip: {
        on: {
          label: 'Cyber-City_Light-Strip: "ON"',
          description: 'Turns the light strip on.',
          scriptName: 'LightStrip',
          originalPath: '',
          args: { state: 'ON' },
        },
        off: {
          label: 'Cyber-City_Light-Strip: "OFF"',
          description: 'Turns the light strip off.',
          scriptName: 'LightStrip',
          originalPath: '',
          args: { state: 'OFF' },
        },
      },
      lights: {
        buildings: {
          admin_building: {
            on: {
              label: 'Cyber-City_Lights-Admin-Building: "ON"',
              description: "Turns the admin building's lights on.",
              scriptName: 'BuildingLights',
              originalPath: '',
              args: { building: 'admin building', state: 'ON' },
            },
            off: {
              label: 'Cyber-City_Lights-Admin-Building: "OFF"',
              description: "Turns the admin building's lights off.",
              scriptName: 'BuildingLights',
              originalPath: '',
              args: { building: 'admin building', state: 'OFF' },
            },
          },
          barracks_1: {
            on: {
              label: 'Cyber-City_Lights-Barracks-1: "ON"',
              description: "Turns the barracks' lights on.",
              scriptName: 'BuildingLights',
              originalPath: '',
              args: { building: 'barracks 1', state: 'ON' },
            },
            off: {
              label: 'Cyber-City_Lights-Barracks-1: "OFF"',
              description: "Turns the barracks' lights off.",
              scriptName: 'BuildingLights',
              originalPath: '',
              args: { building: 'barracks 1', state: 'OFF' },
            },
          },
          barracks_2: {
            on: {
              label: 'Cyber-City_Lights-Barracks-2: "ON"',
              description: "Turns the barracks' lights on.",
              scriptName: 'BuildingLights',
              originalPath: '',
              args: { building: 'barracks 2', state: 'ON' },
            },
            off: {
              label: 'Cyber-City_Lights-Barracks-2: "OFF"',
              description: "Turns the barracks' lights off.",
              scriptName: 'BuildingLights',
              originalPath: '',
              args: { building: 'barracks 2', state: 'OFF' },
            },
          },
          brown_house: {
            on: {
              label: 'Cyber-City_Lights-Brown-House: "ON"',
              description: "Turns the brown house's lights on.",
              scriptName: 'BuildingLights',
              originalPath: '',
              args: { building: 'brown house', state: 'ON' },
            },
            off: {
              label: 'Cyber-City_Lights-Brown-House: "OFF"',
              description: "Turns the brown house's lights off.",
              scriptName: 'BuildingLights',
              originalPath: '',
              args: { building: 'brown house', state: 'OFF' },
            },
          },
          cuppa_jo: {
            on: {
              label: 'Cyber-City_Lights-Cuppa-Jo: "ON"',
              description: "Turns the cuppa jo's lights on.",
              scriptName: 'BuildingLights',
              originalPath: '',
              args: { building: 'cuppa jo', state: 'ON' },
            },
            off: {
              label: 'Cyber-City_Lights-Cuppa-Jo: "OFF"',
              description: "Turns the cuppa jo's lights off.",
              scriptName: 'BuildingLights',
              originalPath: '',
              args: { building: 'cuppa jo', state: 'OFF' },
            },
          },
          facespace: {
            on: {
              label: 'Cyber-City_Lights-Facespace: "ON"',
              description: "Turns the facespace's lights on.",
              scriptName: 'BuildingLights',
              originalPath: '',
              args: { building: 'facespace', state: 'ON' },
            },
            off: {
              label: 'Cyber-City_Lights-Facespace: "OFF"',
              description: "Turns the facespace's lights off.",
              scriptName: 'BuildingLights',
              originalPath: '',
              args: { building: 'facespace', state: 'OFF' },
            },
          },
          firehouse: {
            on: {
              label: 'Cyber-City_Lights-Firehouse: "ON"',
              description: "Turns the firehouse's lights on.",
              scriptName: 'BuildingLights',
              originalPath: '',
              args: { building: 'firehouse', state: 'ON' },
            },
            off: {
              label: 'Cyber-City_Lights-Firehouse: "OFF"',
              description: "Turns the firehouse's lights off.",
              scriptName: 'BuildingLights',
              originalPath: '',
              args: { building: 'firehouse', state: 'OFF' },
            },
          },
          general_store: {
            on: {
              label: 'Cyber-City_Lights-General-Store: "ON"',
              description: "Turns the general store's lights on.",
              scriptName: 'BuildingLights',
              originalPath: '',
              args: { building: 'general store', state: 'ON' },
            },
            off: {
              label: 'Cyber-City_Lights-General-Store: "OFF"',
              description: "Turns the general store's lights off.",
              scriptName: 'BuildingLights',
              originalPath: '',
              args: { building: 'general store', state: 'OFF' },
            },
          },
          green_house: {
            on: {
              label: 'Cyber-City_Lights-Green-House: "ON"',
              description: "Turns the green house's lights on.",
              scriptName: 'BuildingLights',
              originalPath: '',
              args: { building: 'green house', state: 'ON' },
            },
            off: {
              label: 'Cyber-City_Lights-Green-House: "OFF"',
              description: "Turns the green house's lights off.",
              scriptName: 'BuildingLights',
              originalPath: '',
              args: { building: 'green house', state: 'OFF' },
            },
          },
          isp: {
            on: {
              label: 'Cyber-City_Lights-ISP: "ON"',
              description: "Turns the isp's lights on.",
              scriptName: 'BuildingLights',
              originalPath: '',
              args: { building: 'isp', state: 'ON' },
            },
            off: {
              label: 'Cyber-City_Lights-ISP: "OFF"',
              description: "Turns the isp's lights off.",
              scriptName: 'BuildingLights',
              originalPath: '',
              args: { building: 'isp', state: 'OFF' },
            },
          },
          large_tower: {
            on: {
              label: 'Cyber-City_Lights-Large-Tower: "ON"',
              description: "Turns the large tower's lights on.",
              scriptName: 'BuildingLights',
              originalPath: '',
              args: { building: 'large tower', state: 'ON' },
            },
            off: {
              label: 'Cyber-City_Lights-Large-Tower: "OFF"',
              description: "Turns the large tower's lights off.",
              scriptName: 'BuildingLights',
              originalPath: '',
              args: { building: 'large tower', state: 'OFF' },
            },
          },
          military: {
            on: {
              label: 'Cyber-City_Lights-Military: "ON"',
              description: "Turns the military's lights on.",
              scriptName: 'BuildingLights',
              originalPath: '',
              args: { building: 'military', state: 'ON' },
            },
            off: {
              label: 'Cyber-City_Lights-Military: "OFF"',
              description: "Turns the military's lights off.",
              scriptName: 'BuildingLights',
              originalPath: '',
              args: { building: 'military', state: 'OFF' },
            },
          },
          police_station: {
            on: {
              label: 'Cyber-City_Lights-Police-Station: "ON"',
              description: "Turns the police station's lights on.",
              scriptName: 'BuildingLights',
              originalPath: '',
              args: { building: 'police station', state: 'ON' },
            },
            off: {
              label: 'Cyber-City_Lights-Police-Station: "OFF"',
              description: "Turns the police station's lights off.",
              scriptName: 'BuildingLights',
              originalPath: '',
              args: { building: 'police station', state: 'OFF' },
            },
          },
          power_plant: {
            on: {
              label: 'Cyber-City_Lights-Power-Plant: "ON"',
              description: "Turns the power plant's lights on.",
              scriptName: 'BuildingLights',
              originalPath: '',
              args: { building: 'power plant', state: 'ON' },
            },
            off: {
              label: 'Cyber-City_Lights-Power-Plant: "OFF"',
              description: "Turns the power plant's lights off.",
              scriptName: 'BuildingLights',
              originalPath: '',
              args: { building: 'power plant', state: 'OFF' },
            },
          },
          small_tower: {
            on: {
              label: 'Cyber-City_Lights-Small-Tower: "ON"',
              description: "Turns the small tower's lights on.",
              scriptName: 'BuildingLights',
              originalPath: '',
              args: { building: 'small tower', state: 'ON' },
            },
            off: {
              label: 'Cyber-City_Lights-Small-Tower: "OFF"',
              description: "Turns the small tower's lights off.",
              scriptName: 'BuildingLights',
              originalPath: '',
              args: { building: 'small tower', state: 'OFF' },
            },
          },
          toms_club: {
            on: {
              label: 'Cyber-City_Lights-Toms-Club: "ON"',
              description: "Turns toms club's lights on.",
              scriptName: 'BuildingLights',
              originalPath: '',
              args: { building: 'toms club', state: 'ON' },
            },
            off: {
              label: 'Cyber-City_Lights-Toms-Club: "OFF"',
              description: "Turns toms club's lights off.",
              scriptName: 'BuildingLights',
              originalPath: '',
              args: { building: 'toms club', state: 'OFF' },
            },
          },
          train_station: {
            on: {
              label: 'Cyber-City_Lights-Train-Station: "ON"',
              description: "Turns the train station's lights on.",
              scriptName: 'BuildingLights',
              originalPath: '',
              args: { building: 'train station', state: 'ON' },
            },
            off: {
              label: 'Cyber-City_Lights-Train-Station: "OFF"',
              description: "Turns the train station's lights off.",
              scriptName: 'BuildingLights',
              originalPath: '',
              args: { building: 'train station', state: 'OFF' },
            },
          },
          watson_elementary: {
            on: {
              label: 'Cyber-City_Lights-Watson-Elementary: "ON"',
              description: "Turns watson elementary's lights on.",
              scriptName: 'BuildingLights',
              originalPath: '',
              args: { building: 'watson elementary', state: 'ON' },
            },
            off: {
              label: 'Cyber-City_Lights-Watson-Elementary: "OFF"',
              description: "Turns watson elementary's lights off.",
              scriptName: 'BuildingLights',
              originalPath: '',
              args: { building: 'watson elementary', state: 'OFF' },
            },
          },
        },
        // ! per Michael's request this is left out to prevent issues.
        // zones: {
        // commercial: {
        //   on: {
        //     label: 'Cyber-City_Lights-Zone-Commercial: "ON"',
        //     description: 'Turns all the lights in the commercial area on.',
        //     scriptName: 'BuildingLights',
        //     args: { zone: 'commercial', state: 'ON' }
        //   },
        //   off: {
        //     label: 'Cyber-City_Lights-Zone-Commercial: "OFF"',
        //     description: 'Turns all the lights in the commercial area off.',
        //     scriptName: 'BuildingLights',
        //     args: { zone: 'commercial', state: 'OFF' }
        //   },
        // },
        // industrial: {
        //   on: {
        //     label: 'Cyber-City_Lights-Zone-Industrial: "ON"',
        //     description: 'Turns all the lights in the industrial area on.',
        //     scriptName: 'BuildingLights',
        //     args: { zone: 'industrial', state: 'ON' }
        //   },
        //   off: {
        //     label: 'Cyber-City_Lights-Zone-Industrial: "OFF"',
        //     description: 'Turns all the lights in the industrial area off.',
        //     scriptName: 'BuildingLights',
        //     args: { zone: 'industrial', state: 'OFF' }
        //   },
        // },
        // military: {
        //   on: {
        //     label: 'Cyber-City_Lights-Zone-Military: "ON"',
        //     description: 'Turns all the lights in the military area on.',
        //     scriptName: 'BuildingLights',
        //     args: { zone: 'military', state: 'ON' }
        //   },
        //   off: {
        //     label: 'Cyber-City_Lights-Zone-Military: "OFF"',
        //     description: 'Turns all the lights in the military area off.',
        //     scriptName: 'BuildingLights',
        //     args: { zone: 'military', state: 'OFF' }
        //   },
        // },
        //   residential: {
        //     on: {
        //       label: 'Cyber-City_Lights-Zone-Residential: "ON"',
        //       description: 'Turns all the lights in the residential area on.',
        //       scriptName: 'BuildingLights',
        //       args: { zone: 'residential', state: 'ON' }
        //     },
        //     off: {
        //       label: 'Cyber-City_Lights-Zone-Residential: "OFF"',
        //       description: 'Turns all the lights in the residential area off.',
        //       scriptName: 'BuildingLights',
        //       args: { zone: 'residential', state: 'OFF' }
        //     },
        //   },
        // },
      },
      radar: {
        on: {
          label: 'Cyber-City_Radar: "ON"',
          description: 'Turns the radar on.',
          scriptName: 'Radar',
          originalPath: '',
          args: { state: 'ON' },
        },
        off: {
          label: 'Cyber-City_Radar: "OFF"',
          description: 'Turns the radar off.',
          scriptName: 'Radar',
          originalPath: '',
          args: { state: 'OFF' },
        },
      },
      rail_switch: {
        zones: {
          military: {
            left: {
              label: 'Cyber-City_Rail-Switch-Military: "left"',
              description: 'Turns the military rail switch to left.',
              scriptName: 'RailSwitch',
              originalPath: '',
              args: { zone: 'military', state: 'left' },
            },
            right: {
              label: 'Cyber-City_Rail-Switch-Military: "right"',
              description: 'Turns the military rail switch to right.',
              scriptName: 'RailSwitch',
              originalPath: '',
              args: { zone: 'military', state: 'right' },
            },
          },
          industrial: {
            left: {
              label: 'Cyber-City_Rail-Switch-Industrial: "left"',
              description: 'Turns the industrial rail switch to left.',
              scriptName: 'RailSwitch',
              originalPath: '',
              args: { zone: 'industrial', state: 'left' },
            },
            right: {
              label: 'Cyber-City_Rail-Switch-Industrial: "right"',
              description: 'Turns the industrial rail switch to right.',
              scriptName: 'RailSwitch',
              originalPath: '',
              args: { zone: 'industrial', state: 'right' },
            },
          },
          residential: {
            left: {
              label: 'Cyber-City_Rail-Switch-Residential: "left"',
              description: 'Turns the residential rail switch to left.',
              scriptName: 'RailSwitch',
              originalPath: '',
              args: { zone: 'residential', state: 'left' },
            },
            right: {
              label: 'Cyber-City_Rail-Switch-Residential: "right"',
              description: 'Turns the residential rail switch to right.',
              scriptName: 'RailSwitch',
              originalPath: '',
              args: { zone: 'residential', state: 'right' },
            },
          },
        },
      },
      train: {
        on: {
          label: 'Cyber-City_Train: "ON"',
          description: 'Turns the train on.',
          scriptName: 'Train',
          originalPath: '',
          args: { state: 'ON' },
        },
        off: {
          label: 'Cyber-City_Train: "OFF"',
          description: 'Turns the train off.',
          scriptName: 'Train',
          originalPath: '',
          args: { state: 'OFF' },
        },
      },
      water: {
        color: {
          white: {
            label: 'Cyber-City_Water-Tower-Color: "white"',
            description: 'Turns the water tower color to white.',
            scriptName: 'WaterTower',
            originalPath: '',
            args: { color: 'white' },
          },
          blue: {
            label: 'Cyber-City_Water-Tower-Color: "blue"',
            description: 'Turns the water tower color to blue.',
            scriptName: 'WaterTower',
            originalPath: '',
            args: { color: 'blue' },
          },
          red: {
            label: 'Cyber-City_Water-Tower-Color: "red"',
            description: 'Turns the water tower color to red.',
            scriptName: 'WaterTower',
            originalPath: '',
            args: { color: 'red' },
          },
          green: {
            label: 'Cyber-City_Water-Tower-Color: "green"',
            description: 'Turns the water tower color to green.',
            scriptName: 'WaterTower',
            originalPath: '',
            args: { color: 'green' },
          },
          yellow: {
            label: 'Cyber-City_Water-Tower-Color: "yellow"',
            description: 'Turns the water tower color to yellow.',
            scriptName: 'WaterTower',
            originalPath: '',
            args: { color: 'yellow' },
          },
          purple: {
            label: 'Cyber-City_Water-Tower-Color: "purple"',
            description: 'Turns the water tower color to purple.',
            scriptName: 'WaterTower',
            originalPath: '',
            args: { color: 'purple' },
          },
          skyblue: {
            label: 'Cyber-City_Water-Tower-Color: "sky blue"',
            description: 'Turns the water tower color to sky blue.',
            scriptName: 'WaterTower',
            originalPath: '',
            args: { color: 'skyblue' },
          },
          off: {
            label: 'Cyber-City_Water-Tower-Color: "OFF"',
            description: 'Turns the water tower color off.',
            scriptName: 'WaterTower',
            originalPath: '',
            args: { color: 'off' },
          },
        },
      },
    },
  },
}
