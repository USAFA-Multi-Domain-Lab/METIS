import { AnyObject } from './toolbox/objects'

export const assetData: AnyObject = {
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
          OFF: {
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
            power: {
              ON: {
                label: 'ON',
                description:
                  'This will turn on the power for traffic lights in the commercial area.',
                scriptName: 'TrafficLight',
                args: { power: 'ON' },
              },
              OFF: {
                label: 'OFF',
                description:
                  'This will turn off the power for traffic lights in the commercial area.',
                scriptName: 'TrafficLight',
                args: { power: 'OFF' },
              },
            },
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
                        power: 'ON',
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
                        power: 'OFF',
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
                        power: 'ON',
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
                        power: 'OFF',
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
                        power: 'ON',
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
                        power: 'OFF',
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
                        power: 'ON',
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
                        power: 'OFF',
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
                        power: 'ON',
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
                        power: 'OFF',
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
                        power: 'ON',
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
                        power: 'OFF',
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
                        power: 'ON',
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
                        power: 'OFF',
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
                        power: 'ON',
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
                        power: 'OFF',
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
                        power: 'ON',
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
                        power: 'OFF',
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
                        power: 'ON',
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
                        power: 'OFF',
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
                        power: 'ON',
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
                        power: 'OFF',
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
                        power: 'ON',
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
                        power: 'OFF',
                      },
                    },
                  },
                },
              },
            },
          },
          industrial: {
            power: {
              ON: {
                label: 'ON',
                description:
                  'This will turn on the power for traffic lights in the industrial area.',
                scriptName: 'TrafficLight',
                args: { power: 'ON' },
              },
              OFF: {
                label: 'OFF',
                description:
                  'This will turn off the power for traffic lights in the industrial area.',
                scriptName: 'TrafficLight',
                args: { power: 'OFF' },
              },
            },
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
                        power: 'ON',
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
                        power: 'OFF',
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
                        power: 'ON',
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
                        power: 'OFF',
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
                        power: 'ON',
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
                        power: 'OFF',
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
                        power: 'ON',
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
                        power: 'OFF',
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
                        power: 'ON',
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
                        power: 'OFF',
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
                        power: 'ON',
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
                        power: 'OFF',
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
                        power: 'ON',
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
                        power: 'OFF',
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
                        power: 'ON',
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
                        power: 'OFF',
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
                        power: 'ON',
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
                        power: 'OFF',
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
                        power: 'ON',
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
                        power: 'OFF',
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
                        power: 'ON',
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
                        power: 'OFF',
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
                        power: 'ON',
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
                        power: 'OFF',
                      },
                    },
                  },
                },
              },
            },
          },
          military: {
            power: {
              ON: {
                label: 'ON',
                description:
                  'This will turn on the power for traffic lights in the military area.',
                scriptName: 'TrafficLight',
                args: { power: 'ON' },
              },
              OFF: {
                label: 'OFF',
                description:
                  'This will turn off the power for traffic lights in the military area.',
                scriptName: 'TrafficLight',
                args: { power: 'OFF' },
              },
            },
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
                        power: 'ON',
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
                        power: 'OFF',
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
                        power: 'ON',
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
                        power: 'OFF',
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
                        power: 'ON',
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
                        power: 'OFF',
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
                        power: 'ON',
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
                        power: 'OFF',
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
                        power: 'ON',
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
                        power: 'OFF',
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
                        power: 'ON',
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
                        power: 'OFF',
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
                        power: 'ON',
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
                        power: 'OFF',
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
                        power: 'ON',
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
                        power: 'OFF',
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
                        power: 'ON',
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
                        power: 'OFF',
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
                        power: 'ON',
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
                        power: 'OFF',
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
                        power: 'ON',
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
                        power: 'OFF',
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
                        power: 'ON',
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
                        power: 'OFF',
                      },
                    },
                  },
                },
              },
            },
          },
          residential: {
            power: {
              ON: {
                label: 'ON',
                description:
                  'This will turn on the power for traffic lights in the residential area.',
                scriptName: 'TrafficLight',
                args: { power: 'ON' },
              },
              OFF: {
                label: 'OFF',
                description:
                  'This will turn off the power for traffic lights in the residential area.',
                scriptName: 'TrafficLight',
                args: { power: 'OFF' },
              },
            },
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
                        power: 'ON',
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
                        power: 'OFF',
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
                        power: 'ON',
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
                        power: 'OFF',
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
                        power: 'ON',
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
                        power: 'OFF',
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
                        power: 'ON',
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
                        power: 'OFF',
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
                        power: 'ON',
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
                        power: 'OFF',
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
                        power: 'ON',
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
                        power: 'OFF',
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
                        power: 'ON',
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
                        power: 'OFF',
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
                        power: 'ON',
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
                        power: 'OFF',
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
                        power: 'ON',
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
                        power: 'OFF',
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
                        power: 'ON',
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
                        power: 'OFF',
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
                        power: 'ON',
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
                        power: 'OFF',
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
                        power: 'ON',
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
                        power: 'OFF',
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
          ON: {
            label: 'Cyber-City_Gas-All-Sections: "ON"',
            description: 'Turns gas section 1 on.',
            scriptName: 'Gas',
            originalPath: '',
            args: { power: 'ON' },
          },
          OFF: {
            label: 'Cyber-City_Gas-All-Sections: "OFF"',
            description: 'Turns gas section 1 off.',
            scriptName: 'Gas',
            originalPath: '',
            args: { power: 'OFF' },
          },
        },
        sections: {
          section_1: {
            ON: {
              label: 'Cyber-City_Gas-Section-1: "ON"',
              description: 'Turns gas section 1 on.',
              scriptName: 'Gas',
              originalPath: '',
              args: { section: '1', power: 'ON' },
            },
            OFF: {
              label: 'Cyber-City_Gas-Section-1: "OFF"',
              description: 'Turns gas section 1 off.',
              scriptName: 'Gas',
              originalPath: '',
              args: { section: '1', power: 'OFF' },
            },
          },
          section_2: {
            ON: {
              label: 'Cyber-City_Gas-Section-2: "ON"',
              description: 'Turns gas section 2 on.',
              scriptName: 'Gas',
              originalPath: '',
              args: { section: '2', power: 'ON' },
            },
            OFF: {
              label: 'Cyber-City_Gas-Section-2: "OFF"',
              description: 'Turns gas section 2 off.',
              scriptName: 'Gas',
              originalPath: '',
              args: { section: '2', power: 'OFF' },
            },
          },
          section_3: {
            ON: {
              label: 'Cyber-City_Gas-Section-3: "ON"',
              description: 'Turns gas section 3 on.',
              scriptName: 'Gas',
              originalPath: '',
              args: { section: '3', power: 'ON' },
            },
            OFF: {
              label: 'Cyber-City_Gas-Section-3: "OFF"',
              description: 'Turns gas section 3 off.',
              scriptName: 'Gas',
              originalPath: '',
              args: { section: '3', power: 'OFF' },
            },
          },
        },
      },
      light_strip: {
        master: {
          ON: {
            label: 'Cyber-City_Light-Strip: "ON"',
            description: "Turns the light strip's power and lights on.",
            scriptName: 'LightStrip',
            originalPath: '',
            args: { master: 'ON' },
          },
          OFF: {
            label: 'Cyber-City_Light-Strip: "OFF"',
            description: "Turns the light strip's power and lights off.",
            scriptName: 'LightStrip',
            originalPath: '',
            args: { master: 'OFF' },
          },
        },
        power: {
          ON: {
            label: 'Cyber-City_Light-Strip-Power: "ON"',
            description: "Turns the light strip's power on.",
            scriptName: 'LightStrip',
            originalPath: '',
            args: { power: 'ON' },
          },
          OFF: {
            label: 'Cyber-City_Light-Strip-Power: "OFF"',
            description: "Turns the light strip's power off.",
            scriptName: 'LightStrip',
            originalPath: '',
            args: { power: 'OFF' },
          },
        },
        lights: {
          ON: {
            label: 'Cyber-City_Light-Strip-Lights: "ON"',
            description: "Turns the light strip's lights on.",
            scriptName: 'LightStrip',
            originalPath: '',
            args: { lights: 'ON' },
          },
          OFF: {
            label: 'Cyber-City_Light-Strip-Lights: "OFF"',
            description: "Turns the light strip's lights off.",
            scriptName: 'LightStrip',
            originalPath: '',
            args: { lights: 'OFF' },
          },
        },
      },
      lights: {
        buildings: {
          admin_building: {
            ON: {
              label: 'Cyber-City_Lights-Admin-Building: "ON"',
              description: "Turns the admin building's lights on.",
              scriptName: 'BuildingLights',
              originalPath: '',
              args: { building: 'admin building', power: 'ON' },
            },
            OFF: {
              label: 'Cyber-City_Lights-Admin-Building: "OFF"',
              description: "Turns the admin building's lights off.",
              scriptName: 'BuildingLights',
              originalPath: '',
              args: { building: 'admin building', power: 'OFF' },
            },
          },
          barracks_1: {
            ON: {
              label: 'Cyber-City_Lights-Barracks-1: "ON"',
              description: "Turns the barracks' lights on.",
              scriptName: 'BuildingLights',
              originalPath: '',
              args: { building: 'barracks 1', power: 'ON' },
            },
            OFF: {
              label: 'Cyber-City_Lights-Barracks-1: "OFF"',
              description: "Turns the barracks' lights off.",
              scriptName: 'BuildingLights',
              originalPath: '',
              args: { building: 'barracks 1', power: 'OFF' },
            },
          },
          barracks_2: {
            ON: {
              label: 'Cyber-City_Lights-Barracks-2: "ON"',
              description: "Turns the barracks' lights on.",
              scriptName: 'BuildingLights',
              originalPath: '',
              args: { building: 'barracks 2', power: 'ON' },
            },
            OFF: {
              label: 'Cyber-City_Lights-Barracks-2: "OFF"',
              description: "Turns the barracks' lights off.",
              scriptName: 'BuildingLights',
              originalPath: '',
              args: { building: 'barracks 2', power: 'OFF' },
            },
          },
          brown_house: {
            ON: {
              label: 'Cyber-City_Lights-Brown-House: "ON"',
              description: "Turns the brown house's lights on.",
              scriptName: 'BuildingLights',
              originalPath: '',
              args: { building: 'brown house', power: 'ON' },
            },
            OFF: {
              label: 'Cyber-City_Lights-Brown-House: "OFF"',
              description: "Turns the brown house's lights off.",
              scriptName: 'BuildingLights',
              originalPath: '',
              args: { building: 'brown house', power: 'OFF' },
            },
          },
          cuppa_jo: {
            ON: {
              label: 'Cyber-City_Lights-Cuppa-Jo: "ON"',
              description: "Turns the cuppa jo's lights on.",
              scriptName: 'BuildingLights',
              originalPath: '',
              args: { building: 'cuppa jo', power: 'ON' },
            },
            OFF: {
              label: 'Cyber-City_Lights-Cuppa-Jo: "OFF"',
              description: "Turns the cuppa jo's lights off.",
              scriptName: 'BuildingLights',
              originalPath: '',
              args: { building: 'cuppa jo', power: 'OFF' },
            },
          },
          facespace: {
            ON: {
              label: 'Cyber-City_Lights-Facespace: "ON"',
              description: "Turns the facespace's lights on.",
              scriptName: 'BuildingLights',
              originalPath: '',
              args: { building: 'facespace', power: 'ON' },
            },
            OFF: {
              label: 'Cyber-City_Lights-Facespace: "OFF"',
              description: "Turns the facespace's lights off.",
              scriptName: 'BuildingLights',
              originalPath: '',
              args: { building: 'facespace', power: 'OFF' },
            },
          },
          firehouse: {
            ON: {
              label: 'Cyber-City_Lights-Firehouse: "ON"',
              description: "Turns the firehouse's lights on.",
              scriptName: 'BuildingLights',
              originalPath: '',
              args: { building: 'firehouse', power: 'ON' },
            },
            OFF: {
              label: 'Cyber-City_Lights-Firehouse: "OFF"',
              description: "Turns the firehouse's lights off.",
              scriptName: 'BuildingLights',
              originalPath: '',
              args: { building: 'firehouse', power: 'OFF' },
            },
          },
          general_store: {
            ON: {
              label: 'Cyber-City_Lights-General-Store: "ON"',
              description: "Turns the general store's lights on.",
              scriptName: 'BuildingLights',
              originalPath: '',
              args: { building: 'general store', power: 'ON' },
            },
            OFF: {
              label: 'Cyber-City_Lights-General-Store: "OFF"',
              description: "Turns the general store's lights off.",
              scriptName: 'BuildingLights',
              originalPath: '',
              args: { building: 'general store', power: 'OFF' },
            },
          },
          green_house: {
            ON: {
              label: 'Cyber-City_Lights-Green-House: "ON"',
              description: "Turns the green house's lights on.",
              scriptName: 'BuildingLights',
              originalPath: '',
              args: { building: 'green house', power: 'ON' },
            },
            OFF: {
              label: 'Cyber-City_Lights-Green-House: "OFF"',
              description: "Turns the green house's lights off.",
              scriptName: 'BuildingLights',
              originalPath: '',
              args: { building: 'green house', power: 'OFF' },
            },
          },
          isp: {
            ON: {
              label: 'Cyber-City_Lights-ISP: "ON"',
              description: "Turns the isp's lights on.",
              scriptName: 'BuildingLights',
              originalPath: '',
              args: { building: 'isp', power: 'ON' },
            },
            OFF: {
              label: 'Cyber-City_Lights-ISP: "OFF"',
              description: "Turns the isp's lights off.",
              scriptName: 'BuildingLights',
              originalPath: '',
              args: { building: 'isp', power: 'OFF' },
            },
          },
          large_tower: {
            ON: {
              label: 'Cyber-City_Lights-Large-Tower: "ON"',
              description: "Turns the large tower's lights on.",
              scriptName: 'BuildingLights',
              originalPath: '',
              args: { building: 'large tower', power: 'ON' },
            },
            OFF: {
              label: 'Cyber-City_Lights-Large-Tower: "OFF"',
              description: "Turns the large tower's lights off.",
              scriptName: 'BuildingLights',
              originalPath: '',
              args: { building: 'large tower', power: 'OFF' },
            },
          },
          military: {
            ON: {
              label: 'Cyber-City_Lights-Military: "ON"',
              description: "Turns the military's lights on.",
              scriptName: 'BuildingLights',
              originalPath: '',
              args: { building: 'military', power: 'ON' },
            },
            OFF: {
              label: 'Cyber-City_Lights-Military: "OFF"',
              description: "Turns the military's lights off.",
              scriptName: 'BuildingLights',
              originalPath: '',
              args: { building: 'military', power: 'OFF' },
            },
          },
          police_station: {
            ON: {
              label: 'Cyber-City_Lights-Police-Station: "ON"',
              description: "Turns the police station's lights on.",
              scriptName: 'BuildingLights',
              originalPath: '',
              args: { building: 'police station', power: 'ON' },
            },
            OFF: {
              label: 'Cyber-City_Lights-Police-Station: "OFF"',
              description: "Turns the police station's lights off.",
              scriptName: 'BuildingLights',
              originalPath: '',
              args: { building: 'police station', power: 'OFF' },
            },
          },
          power_plant: {
            ON: {
              label: 'Cyber-City_Lights-Power-Plant: "ON"',
              description: "Turns the power plant's lights on.",
              scriptName: 'BuildingLights',
              originalPath: '',
              args: { building: 'power plant', power: 'ON' },
            },
            OFF: {
              label: 'Cyber-City_Lights-Power-Plant: "OFF"',
              description: "Turns the power plant's lights off.",
              scriptName: 'BuildingLights',
              originalPath: '',
              args: { building: 'power plant', power: 'OFF' },
            },
          },
          small_tower: {
            ON: {
              label: 'Cyber-City_Lights-Small-Tower: "ON"',
              description: "Turns the small tower's lights on.",
              scriptName: 'BuildingLights',
              originalPath: '',
              args: { building: 'small tower', power: 'ON' },
            },
            OFF: {
              label: 'Cyber-City_Lights-Small-Tower: "OFF"',
              description: "Turns the small tower's lights off.",
              scriptName: 'BuildingLights',
              originalPath: '',
              args: { building: 'small tower', power: 'OFF' },
            },
          },
          toms_club: {
            ON: {
              label: 'Cyber-City_Lights-Toms-Club: "ON"',
              description: "Turns toms club's lights on.",
              scriptName: 'BuildingLights',
              originalPath: '',
              args: { building: 'toms club', power: 'ON' },
            },
            OFF: {
              label: 'Cyber-City_Lights-Toms-Club: "OFF"',
              description: "Turns toms club's lights off.",
              scriptName: 'BuildingLights',
              originalPath: '',
              args: { building: 'toms club', power: 'OFF' },
            },
          },
          train_station: {
            ON: {
              label: 'Cyber-City_Lights-Train-Station: "ON"',
              description: "Turns the train station's lights on.",
              scriptName: 'BuildingLights',
              originalPath: '',
              args: { building: 'train station', power: 'ON' },
            },
            OFF: {
              label: 'Cyber-City_Lights-Train-Station: "OFF"',
              description: "Turns the train station's lights off.",
              scriptName: 'BuildingLights',
              originalPath: '',
              args: { building: 'train station', power: 'OFF' },
            },
          },
          watson_elementary: {
            ON: {
              label: 'Cyber-City_Lights-Watson-Elementary: "ON"',
              description: "Turns watson elementary's lights on.",
              scriptName: 'BuildingLights',
              originalPath: '',
              args: { building: 'watson elementary', power: 'ON' },
            },
            OFF: {
              label: 'Cyber-City_Lights-Watson-Elementary: "OFF"',
              description: "Turns watson elementary's lights off.",
              scriptName: 'BuildingLights',
              originalPath: '',
              args: { building: 'watson elementary', power: 'OFF' },
            },
          },
        },
        // ! per Michael's request this is left out to prevent issues.
        // zones: {
        // commercial: {
        //   ON: {
        //     label: 'Cyber-City_Lights-Zone-Commercial: "ON"',
        //     description: 'Turns all the lights in the commercial area on.',
        //     scriptName: 'BuildingLights',
        //     args: { zone: 'commercial', power: 'ON' }
        //   },
        //   OFF: {
        //     label: 'Cyber-City_Lights-Zone-Commercial: "OFF"',
        //     description: 'Turns all the lights in the commercial area off.',
        //     scriptName: 'BuildingLights',
        //     args: { zone: 'commercial', power: 'OFF' }
        //   },
        // },
        // industrial: {
        //   ON: {
        //     label: 'Cyber-City_Lights-Zone-Industrial: "ON"',
        //     description: 'Turns all the lights in the industrial area on.',
        //     scriptName: 'BuildingLights',
        //     args: { zone: 'industrial', power: 'ON' }
        //   },
        //   OFF: {
        //     label: 'Cyber-City_Lights-Zone-Industrial: "OFF"',
        //     description: 'Turns all the lights in the industrial area off.',
        //     scriptName: 'BuildingLights',
        //     args: { zone: 'industrial', power: 'OFF' }
        //   },
        // },
        // military: {
        //   ON: {
        //     label: 'Cyber-City_Lights-Zone-Military: "ON"',
        //     description: 'Turns all the lights in the military area on.',
        //     scriptName: 'BuildingLights',
        //     args: { zone: 'military', power: 'ON' }
        //   },
        //   OFF: {
        //     label: 'Cyber-City_Lights-Zone-Military: "OFF"',
        //     description: 'Turns all the lights in the military area off.',
        //     scriptName: 'BuildingLights',
        //     args: { zone: 'military', power: 'OFF' }
        //   },
        // },
        //   residential: {
        //     ON: {
        //       label: 'Cyber-City_Lights-Zone-Residential: "ON"',
        //       description: 'Turns all the lights in the residential area on.',
        //       scriptName: 'BuildingLights',
        //       args: { zone: 'residential', power: 'ON' }
        //     },
        //     OFF: {
        //       label: 'Cyber-City_Lights-Zone-Residential: "OFF"',
        //       description: 'Turns all the lights in the residential area off.',
        //       scriptName: 'BuildingLights',
        //       args: { zone: 'residential', power: 'OFF' }
        //     },
        //   },
        // },
      },
      // ! DO NOT use until hardware has been fixed.
      // radar: {
      //   master: {
      //     ON: {
      //       label: 'Cyber-City_Radar: "ON"',
      //       description: "Turns the radar's power and motor on.",
      //       scriptName: 'Radar',
      //       originalPath: '',
      //       args: { master: 'ON' },
      //     },
      //     OFF: {
      //       label: 'Cyber-City_Radar: "OFF"',
      //       description: "Turns the radar's power and motor off.",
      //       scriptName: 'Radar',
      //       originalPath: '',
      //       args: { master: 'OFF' },
      //     },
      //   },
      //   power: {
      //     ON: {
      //       label: 'Cyber-City_Radar-Power: "ON"',
      //       description: "Turns the radar's power on.",
      //       scriptName: 'Radar',
      //       originalPath: '',
      //       args: { power: 'ON' },
      //     },
      //     OFF: {
      //       label: 'Cyber-City_Radar-Power: "OFF"',
      //       description: "Turns the radar's power off.",
      //       scriptName: 'Radar',
      //       originalPath: '',
      //       args: { power: 'OFF' },
      //     },
      //   },
      //   motor: {
      //     ON: {
      //       label: 'Cyber-City_Radar-Motor: "ON"',
      //       description: "Turns the radar's motor on.",
      //       scriptName: 'Radar',
      //       originalPath: '',
      //       args: { motor: 'ON' },
      //     },
      //     OFF: {
      //       label: 'Cyber-City_Radar-Motor: "OFF"',
      //       description: "Turns the radar's motor off.",
      //       scriptName: 'Radar',
      //       originalPath: '',
      //       args: { motor: 'OFF' },
      //     },
      //   },
      // },
      // ! -------------------------------------------------
      rail_switch: {
        zones: {
          military: {
            left: {
              label: 'Cyber-City_Rail-Switch-Military: "left"',
              description: 'Turns the military rail switch to left.',
              scriptName: 'RailSwitch',
              originalPath: '',
              args: { zone: 'military', direction: 'left' },
            },
            right: {
              label: 'Cyber-City_Rail-Switch-Military: "right"',
              description: 'Turns the military rail switch to right.',
              scriptName: 'RailSwitch',
              originalPath: '',
              args: { zone: 'military', direction: 'right' },
            },
          },
          industrial: {
            left: {
              label: 'Cyber-City_Rail-Switch-Industrial: "left"',
              description: 'Turns the industrial rail switch to left.',
              scriptName: 'RailSwitch',
              originalPath: '',
              args: { zone: 'industrial', direction: 'left' },
            },
            right: {
              label: 'Cyber-City_Rail-Switch-Industrial: "right"',
              description: 'Turns the industrial rail switch to right.',
              scriptName: 'RailSwitch',
              originalPath: '',
              args: { zone: 'industrial', direction: 'right' },
            },
          },
          residential: {
            left: {
              label: 'Cyber-City_Rail-Switch-Residential: "left"',
              description: 'Turns the residential rail switch to left.',
              scriptName: 'RailSwitch',
              originalPath: '',
              args: { zone: 'residential', direction: 'left' },
            },
            right: {
              label: 'Cyber-City_Rail-Switch-Residential: "right"',
              description: 'Turns the residential rail switch to right.',
              scriptName: 'RailSwitch',
              originalPath: '',
              args: { zone: 'residential', direction: 'right' },
            },
          },
        },
      },
      train: {
        ON: {
          label: 'Cyber-City_Train: "ON"',
          description: 'Turns the train on.',
          scriptName: 'Train',
          originalPath: '',
          args: { power: 'ON' },
        },
        OFF: {
          label: 'Cyber-City_Train: "OFF"',
          description: 'Turns the train off.',
          scriptName: 'Train',
          originalPath: '',
          args: { power: 'OFF' },
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
          sky_blue: {
            label: 'Cyber-City_Water-Tower-Color: "sky blue"',
            description: 'Turns the water tower color to sky blue.',
            scriptName: 'WaterTower',
            originalPath: '',
            args: { color: 'skyblue' },
          },
          OFF: {
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
  MDL: {
    'Alpha Suite': {
      ASCOT: {
        Friendly: {
          'Space': {
            SAT_THAADS: {
              Kill: {
                label: 'SAT_THAADS: "kill"',
                description: 'This kills the SAT_THAADS entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            SAT_ISR: {
              Kill: {
                label: 'SAT_ISRL "kill"',
                description: 'This kills the SAT_ISR entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
          },
          'Cyber': {
            'RED-DOOR': {
              Kill: {
                label: 'RED-DOOR: "kill"',
                description: 'This kills the RED-DOOR entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
          },
          'Air': {
            'RPA-A': {
              'Redirect RPA': {
                label: 'Redirect RPA: "RPA-A"',
                description: 'This redirects the RPA-A entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'RPA-B': {
              'Redirect RPA': {
                label: 'Redirect RPA: "RPA-B"',
                description: 'This redirects the RPA-B entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'MQ-25': {
              'Redirect RPA': {
                label: 'Redirect RPA: "MQ-25"',
                description: 'This redirects the RPA entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
          },
          'Land': {
            'RESUPPLY': {
              Kill: {
                label: 'RESUPPLY: "kill"',
                description: 'This will kill the resupply entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'THAADS-A': {
              Kill: {
                label: 'THAADS-A: "kill"',
                description: 'This will kill the THAADS-A entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'THAADS-B': {
              Kill: {
                label: 'THAADS-B: "kill"',
                description: 'This will kill the THAADS-B entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'THAADS-C': {
              Kill: {
                label: 'THAADS-C: "kill"',
                description: 'This will kill the THAADS-C entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'THAADS ADOC': {
              'Disable auto fire': {
                label: 'THAADS ADOC: "disable auto fire"',
                description:
                  'This will disable auto fire for the THAADS ADOC entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'EZOHIGUMA-1': {
              Kill: {
                label: 'EZOHIGUMA-1: "kill"',
                description: 'This will kill the EZOHIGUMA-1 entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'EZOHIGUMA-2': {
              Kill: {
                label: 'EZOHIGUMA-2: "kill"',
                description: 'This will kill the EZOHIGUMA-2 entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'RPA-UPLINK': {
              Kill: {
                label: 'RPA-UPLINK: "kill"',
                description: 'This will kill the RPA-UPLINK entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'LOGISTICS': {
              Kill: {
                label: 'LOGISTICS: "kill"',
                description: 'This will kill the LOGISTICS entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
          },
          'Surface': {},
          'Sub-Surface': {},
        },
        //   Hostile: {
        //     'Space': {},
        //     'Cyber': {},
        //     'Air': {},
        //     'Land': {},
        //     'Surface': {},
        //     'Sub-Surface': {},
        //   },
        //   Neutral: {
        //     'Space': {},
        //     'Cyber': {},
        //     'Air': {},
        //     'Land': {},
        //     'Surface': {},
        //     'Sub-Surface': {},
        //   },
        //   Unknown: {
        //     'Space': {},
        //     'Cyber': {},
        //     'Air': {},
        //     'Land': {},
        //     'Surface': {},
        //     'Sub-Surface': {},
        //   },
        // },
        // mIRC: {
        //   'mIRC Server': {
        //     EFFECTS: ['Shutdown Server', 'List all channels', 'List all users'],
        //   },
        //   'Channels': {
        //     'CJTF H COMMAND A': {},
        //     'JFACC OPS A': {},
        //     'JFLCC OPS A': {},
        //     'JFMCC OPS A': {},
        //     'UFSOCC OPS A': {},
        //     'JFSCC OPS A': {},
        //     'JFCCC OPS A': {},
        //     'TEXT 2 SPEECH A': {},
        //     'AUDIO_TRIGGER A': {},
        //     'ALL SOURCE INTEL A': {},
        //     'CESAR A': {},
        //     'METIS A': {},
        //     'AWACS A': {},
        //   },
        // },
        // Sonomarc: {
        //   Frequencies: {
        //     'BEIGE-41': {},
        //     'CRIMMSON-28': {},
        //     'VIOLET-26': {},
        //     'TEAL-36': {},
        //     'AMBER-38': {},
        //     'COBALT-45': {},
        //     'SAGE-32': {},
        //     'SCARLETT-28': {},
        //     'SIENNA-31': {},
        //     'ROYAL-44': {},
        //     'CIDER-23': {},
        //     'PLUM-33': {},
        //     'SAPPHIRE-24': {},
        //     'PEWTER-35': {},
        //     'LIME-30': {},
        //     'HAZEL-47': {},
        //     'YELLOW-16': {},
        //     'RUBY-22': {},
        //     'MOCHA-38': {},
        //     'FLINT-22': {},
        //     'BLUE-51': {},
        //     'PINK-52': {},
        //     'ORANGE-61': {},
        //     'BROWN-62': {},
        //     'GRAY-17': {},
        //     'LEMON-18': {},
        //     'PEACH-19': {},
        //     'ROSE-35': {},
        //     'BLUSH-29': {},
        //     'PALE-42': {},
        //     'GREEN-37': {},
        //     'PURPLE-14': {},
        //     'BLOSSOM-55': {},
        //     'CANARY-14': {},
        //   },
      },
    },
    'Omega Suite': {},
    'Alpha SuiteAlpha SuiteAlpha SuiteAlpha SuiteAlpha SuiteAlpha SuiteAlpha SuiteAlpha Suite':
      {},
  },
}
