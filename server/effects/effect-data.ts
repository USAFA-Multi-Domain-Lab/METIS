import { AnyObject } from 'metis/toolbox/objects'

// todo: remove (v1 effects)
export const effectData: AnyObject = {
  cyber_city: {
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
              label: 'Cyber-City_Traffic-Commercial-Power: "ON"',
              description:
                'This will turn on the power for traffic lights in the commercial area.',
              scriptName: 'TrafficLight',
              args: { zone: 'commercial', power: 'ON' },
            },
            OFF: {
              label: 'Cyber-City_Traffic-Commercial-Power: "OFF"',
              description:
                'This will turn off the power for traffic lights in the commercial area.',
              scriptName: 'TrafficLight',
              args: { zone: 'commercial', power: 'OFF' },
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
                    label: 'Cyber-City_Traffic-Commercial-North-Yellow: "OFF"',
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
                    label: 'Cyber-City_Traffic-Commercial-South-Yellow: "OFF"',
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
              label: 'Cyber-City_Traffic-Industrial-Power: "ON"',
              description:
                'This will turn on the power for traffic lights in the industrial area.',
              scriptName: 'TrafficLight',
              args: { zone: 'industrial', power: 'ON' },
            },
            OFF: {
              label: 'Cyber-City_Traffic-Industrial-Power: "OFF"',
              description:
                'This will turn off the power for traffic lights in the industrial area.',
              scriptName: 'TrafficLight',
              args: { zone: 'industrial', power: 'OFF' },
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
                    label: 'Cyber-City_Traffic-Industrial-North-Yellow: "OFF"',
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
                    label: 'Cyber-City_Traffic-Industrial-South-Yellow: "OFF"',
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
              label: 'Cyber-City_Traffic-Military-Power: "ON"',
              description:
                'This will turn on the power for traffic lights in the military area.',
              scriptName: 'TrafficLight',
              args: { zone: 'military', power: 'ON' },
            },
            OFF: {
              label: 'Cyber-City_Traffic-Military-Power: "OFF"',
              description:
                'This will turn off the power for traffic lights in the military area.',
              scriptName: 'TrafficLight',
              args: { zone: 'military', power: 'OFF' },
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
              label: 'Cyber-City_Traffic-Residential-Power: "ON"',
              description:
                'This will turn on the power for traffic lights in the residential area.',
              scriptName: 'TrafficLight',
              args: { zone: 'residential', power: 'ON' },
            },
            OFF: {
              label: 'Cyber-City_Traffic-Residential-Power: "OFF"',
              description:
                'This will turn off the power for traffic lights in the residential area.',
              scriptName: 'TrafficLight',
              args: { zone: 'residential', power: 'OFF' },
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
                    label: 'Cyber-City_Traffic-Residential-East-Yellow: "OFF"',
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
                    label: 'Cyber-City_Traffic-Residential-North-Green: "OFF"',
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
                    label: 'Cyber-City_Traffic-Residential-North-Yellow: "ON"',
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
                    label: 'Cyber-City_Traffic-Residential-North-Yellow: "OFF"',
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
                    label: 'Cyber-City_Traffic-Residential-South-Green: "OFF"',
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
                    label: 'Cyber-City_Traffic-Residential-South-Yellow: "ON"',
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
                    label: 'Cyber-City_Traffic-Residential-South-Yellow: "OFF"',
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
                    label: 'Cyber-City_Traffic-Residential-West-Yellow: "OFF"',
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
    radar: {
      master: {
        ON: {
          label: 'Cyber-City_Radar: "ON"',
          description: "Turns the radar's power and motor on.",
          scriptName: 'Radar',
          originalPath: '',
          args: { master: 'ON' },
        },
        OFF: {
          label: 'Cyber-City_Radar: "OFF"',
          description: "Turns the radar's power and motor off.",
          scriptName: 'Radar',
          originalPath: '',
          args: { master: 'OFF' },
        },
      },
      power: {
        ON: {
          label: 'Cyber-City_Radar-Power: "ON"',
          description: "Turns the radar's power on.",
          scriptName: 'Radar',
          originalPath: '',
          args: { power: 'ON' },
        },
        OFF: {
          label: 'Cyber-City_Radar-Power: "OFF"',
          description: "Turns the radar's power off.",
          scriptName: 'Radar',
          originalPath: '',
          args: { power: 'OFF' },
        },
      },
      motor: {
        ON: {
          label: 'Cyber-City_Radar-Motor: "ON"',
          description: "Turns the radar's motor on.",
          scriptName: 'Radar',
          originalPath: '',
          args: { motor: 'ON' },
        },
        OFF: {
          label: 'Cyber-City_Radar-Motor: "OFF"',
          description: "Turns the radar's motor off.",
          scriptName: 'Radar',
          originalPath: '',
          args: { motor: 'OFF' },
        },
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
  MDL: {
    'ASCOT DEMO': {
      'CHENGDU GJ-2': {
        'change heading': {
          270: {
            label: 'CHENGDU GJ-2: "heading=270"',
            description:
              'This changes the heading of the CHENGDU GJ-2 entity to 270 degrees.',
            scriptName: 'ASCOT_DEMO',
            originalPath: '',
            args: {
              entityName: 'CHENGDU GJ-2',
              requestPath: 'heading',
              requestMethod: 'PATCH',
              requestData: {
                heading: {
                  unit: 'deg',
                  value: 270,
                },
              },
            },
          },
        },
        'change altitude': {
          0: {
            label: 'CHENGDU GJ-2: "altitude=0"',
            description:
              'This changes the altitude of the CHENGDU GJ-2 entity to 0 meters.',
            scriptName: 'ASCOT_DEMO',
            originalPath: '',
            args: {
              entityName: 'CHENGDU GJ-2',
              requestPath: 'altitude',
              requestMethod: 'PATCH',
              requestData: {
                altitude: {
                  unit: 'm',
                  value: 0,
                },
              },
            },
          },
        },
        'power': {
          kill: {
            label: 'CHENGDU GJ-2: "kill"',
            description: 'This kills the CHENGDU GJ-2 entity.',
            scriptName: 'ASCOT_DEMO',
            originalPath: '',
            args: {
              entityName: 'CHENGDU GJ-2',
              requestPath: 'kill',
              requestMethod: 'POST',
              requestData: {},
            },
          },
        },
      },
    },
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
                label: 'RPA-A: "redirect RPA"',
                description: 'This redirects the RPA-A entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'RPA-B': {
              'Redirect RPA': {
                label: 'RPA-B: "redirect RPA"',
                description: 'This redirects the RPA-B entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'MQ-25': {
              'Redirect RPA': {
                label: 'MQ-25: "redirect RPA"',
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
        Hostile: {
          'Space': {
            'PLA-SEARCH': {
              Kill: {
                label: 'PLA-SEARCH: "kill"',
                description: 'This kills the PLA-SEARCH entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
          },
          'Cyber': {},
          'Air': {
            'HAO-A': {
              'Redirect HAO': {
                label: 'HAO-A: "redirect HAO"',
                description: 'This redirects the HAO-A entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'HAO-B': {
              Kill: {
                label: 'HAO-B: "redirect HAO"',
                description: 'This redirects the HAO-B entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'HAO-C': {
              Kill: {
                label: 'HAO-C: "redirect HAO"',
                description: 'This redirects the HAO-C entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
          },
          'Land': {
            'PLA ADOC': {
              'Disable auto fire': {
                label: 'PLA ADOC: "disable auto fire"',
                description:
                  'This will disable auto fire for the PLA ADOC entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'IADS_C-2-B': {
              'Kill': {
                label: 'IADS_C-2-B: "kill"',
                description: 'This kills the IADS_C-2-B entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
              'Disable auto fire': {
                label: 'IADS_C-2-B: "disable auto fire"',
                description:
                  'This will disable auto fire for the IADS_C-2-B entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'IADS_C-2-C': {
              'Kill': {
                label: 'IADS_C-2-C: "kill"',
                description: 'This kills the IADS_C-2-C entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
              'Disable auto fire': {
                label: 'IADS_C-2-C: "disable auto fire"',
                description:
                  'This will disable auto fire for the IADS_C-2-C entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'IADS_C-2-D': {
              'Kill': {
                label: 'IADS_C-2-D: "kill"',
                description: 'This kills the IADS_C-2-D entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
              'Disable auto fire': {
                label: 'IADS_C-2-D: "disable auto fire"',
                description:
                  'This will disable auto fire for the IADS_C-2-D entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'IADS_E-3-A': {
              Kill: {
                label: 'IADS_E-3-A: "kill"',
                description: 'This kills the IADS_E-3-A entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'IADS_E-3-B': {
              'Kill': {
                label: 'IADS_E-3-B: "kill"',
                description: 'This kills the IADS_E-3-B entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
              'Disable radar': {
                label: 'IADS_E-3-B: "disable radar"',
                description: 'This will disable the IADS_E-3-B radar entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'IADS_N-4-A': {
              'Kill': {
                label: 'IADS_N-4-A: "kill"',
                description: 'This kills the IADS_N-4-A entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
              'Disable auto fire': {
                label: 'IADS_N-4-A: "disable auto fire"',
                description:
                  'This will disable auto fire for the IADS_N-4-A entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'IADS_N-4-B': {
              'Kill': {
                label: 'IADS_N-4-B: "kill"',
                description: 'This kills the IADS_N-4-B entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
              'Disable radar': {
                label: 'IADS_N-4-B: "disable radar"',
                description: 'This will disable the IADS_N-4-B radar entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'IADS_S-1-A': {
              'Kill': {
                label: 'IADS_S-1-A: "kill"',
                description: 'This kills the IADS_S-1-A entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
              'Disable auto fire': {
                label: 'IADS_S-1-A: "disable auto fire"',
                description:
                  'This will disable auto fire for the IADS_S-1-A entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'IADS_S-1-B': {
              'Kill': {
                label: 'IADS_S-1-B: "kill"',
                description: 'This kills the IADS_S-1-B entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
              'Disable radar': {
                label: 'IADS_S-1-B: "disable radar"',
                description: 'This will disable the IADS_S-1-B radar entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'IADS_S-1-C': {
              Kill: {
                label: 'IADS_S-1-C: "kill"',
                description: 'This kills the IADS_S-1-C entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'RUS-S300-A': {
              Kill: {
                label: 'RUS-S300-A: "kill"',
                description: 'This kills the RUS-S300-A entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'RUS-S300-B': {
              Kill: {
                label: 'RUS-S300-B: "kill"',
                description: 'This kills the RUS-S300-B entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'RUS-S300-C': {
              Kill: {
                label: 'RUS-S300-C: "kill"',
                description: 'This kills the RUS-S300-C entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'INF-BN-A-10': {
              Kill: {
                label: 'INF-BN-A-10: "kill"',
                description: 'This kills the INF-BN-A-10 entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'INF-BN-B-10': {
              Kill: {
                label: 'INF-BN-B-10: "kill"',
                description: 'This kills the INF-BN-B-10 entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'INF-BN-C-10': {
              Kill: {
                label: 'INF-BN-C-10: "kill"',
                description: 'This kills the INF-BN-C-10 entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'INF-BN-D-10': {
              Kill: {
                label: 'INF-BN-D-10: "kill"',
                description: 'This kills the INF-BN-D-10 entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'INF-BN-E-10': {
              Kill: {
                label: 'INF-BN-E-10: "kill"',
                description: 'This kills the INF-BN-E-10 entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'INF-BN-F-10': {
              Kill: {
                label: 'INF-BN-F-10: "kill"',
                description: 'This kills the INF-BN-F-10 entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'INF-BN-G-10': {
              Kill: {
                label: 'INF-BN-G-10: "kill"',
                description: 'This kills the INF-BN-G-10 entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'INF-CO-A-5': {
              Kill: {
                label: 'INF-CO-A-5: "kill"',
                description: 'This kills the INF-CO-A-5 entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'INF-CO-B-5': {
              Kill: {
                label: 'INF-CO-B-5: "kill"',
                description: 'This kills the INF-CO-B-5 entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'INF-CO-C-5': {
              Kill: {
                label: 'INF-CO-C-5: "kill"',
                description: 'This kills the INF-CO-C-5 entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'INF-CO-D-5': {
              Kill: {
                label: 'INF-CO-D-5: "kill"',
                description: 'This kills the INF-CO-D-5 entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'INF-CO-E-5': {
              Kill: {
                label: 'INF-CO-E-5: "kill"',
                description: 'This kills the INF-CO-E-5 entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'INF-CO-F-5': {
              Kill: {
                label: 'INF-CO-F-5: "kill"',
                description: 'This kills the INF-CO-F-5 entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'INF-CO-G-5': {
              Kill: {
                label: 'INF-CO-G-5: "kill"',
                description: 'This kills the INF-CO-G-5 entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'INF-CO-H-5': {
              Kill: {
                label: 'INF-CO-H-5: "kill"',
                description: 'This kills the INF-CO-H-5 entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'SOF-BN-A-8': {
              Kill: {
                label: 'SOF-BN-A-8: "kill"',
                description: 'This kills the SOF-BN-A-8 entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'SOF-BN-B-8': {
              Kill: {
                label: 'SOF-BN-B-8: "kill"',
                description: 'This kills the SOF-BN-B-8 entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'SOF-BN-C-8': {
              Kill: {
                label: 'SOF-BN-C-8: "kill"',
                description: 'This kills the SOF-BN-C-8 entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'SOF-TM-A-3': {
              Kill: {
                label: 'SOF-TM-A-3: "kill"',
                description: 'This kills the SOF-TM-A-3 entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'SOF-TM-B-3': {
              Kill: {
                label: 'SOF-TM-B-3: "kill"',
                description: 'This kills the SOF-TM-B-3 entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'SOF-TM-C-3': {
              Kill: {
                label: 'SOF-TM-C-3: "kill"',
                description: 'This kills the SOF-TM-C-3 entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'SOF-TM-D-3': {
              Kill: {
                label: 'SOF-TM-D-3: "kill"',
                description: 'This kills the SOF-TM-D-3 entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'SOF-TM-E-3': {
              Kill: {
                label: 'SOF-TM-E-3: "kill"',
                description: 'This kills the SOF-TM-E-3 entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'PLA-C2-HOK': {
              Kill: {
                label: 'PLA-C2-HOK: "kill"',
                description: 'This kills the PLA-C2-HOK entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
          },
          'Surface': {
            'PLA-CVN': {
              Kill: {
                label: 'PLA-CVN: "kill"',
                description: 'This kills the PLA-CVN entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'PLA-DDG-A': {
              'Kill': {
                label: 'PLA-DDG-A: "kill"',
                description: 'This kills the PLA-DDG-A entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
              'Disable auto fire': {
                label: 'PLA-DDG-A: "disable auto fire"',
                description:
                  'This will disable auto fire for the PLA-DDG-A entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'PLA-DDG-B': {
              'Kill': {
                label: 'PLA-DDG-B: "kill"',
                description: 'This kills the PLA-DDG-B entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
              'Disable auto fire': {
                label: 'PLA-DDG-B: "disable auto fire"',
                description:
                  'This will disable auto fire for the PLA-DDG-B entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'PLA-DDG-C': {
              'Kill': {
                label: 'PLA-DDG-C: "kill"',
                description: 'This kills the PLA-DDG-C entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
              'Disable auto fire': {
                label: 'PLA-DDG-C: "disable auto fire"',
                description:
                  'This will disable auto fire for the PLA-DDG-C entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'PLA-DDG-D': {
              'Kill': {
                label: 'PLA-DDG-D: "kill"',
                description: 'This kills the PLA-DDG-D entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
              'Disable auto fire': {
                label: 'PLA-DDG-D: "disable auto fire"',
                description:
                  'This will disable auto fire for the PLA-DDG-D entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
          },
          'Sub-Surface': {
            'PLA-SSN-A': {
              Kill: {
                label: 'PLA-SSN-A: "kill"',
                description: 'This kills the PLA-SSN-A entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'PLA-SSN-B': {
              Kill: {
                label: 'PLA-SSN-B: "kill"',
                description: 'This kills the PLA-SSN-B entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
          },
        },
        Neutral: {
          'Space': { 'CBCN-SAT': {} },
          'Cyber': {},
          'Air': {},
          'Land': {
            'CBCN-NODE': {
              Disable: {
                label: 'CBCN-NODE: "disable"',
                description: 'This disables the CBCN-NODE entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'CBCN-SERVER': {
              Disable: {
                label: 'CBCN-SERVER: "disable"',
                description: 'This disables the CBCN-SERVER entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'CBCN001-139': {
              Disable: {
                label: 'CBCN001-139: "disable"',
                description: 'This disables the CBCN001-139 entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'CBCN998': {
              Disable: {
                label: 'CBCN998: "disable"',
                description: 'This disables the CBCN998 entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'CBCN999': {
              Disable: {
                label: 'CBCN999: "disable"',
                description: 'This disables the CBCN999 entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
          },
          'Surface': {},
          'Sub-Surface': {},
        },
        Unknown: {
          'Space': {},
          'Cyber': {},
          'Air': {},
          'Land': {},
          'Surface': {},
          'Sub-Surface': {},
        },
      },
      mIRC: {
        'mIRC Server': {
          EFFECTS: ['Shutdown Server', 'List all channels', 'List all users'],
        },
        'Channels': {
          CJTF_H_COMMAND_A: {
            'Spoof Channel': {
              label: 'CJTF_H_COMMAND_A: "spoof channel"',
              description: 'This spoofs the CJTF_H_COMMAND_A channel.',
              scriptName: '',
              originalPath: '',
              args: {},
            },
          },
          JFACC_OPS_A: {
            'Spoof Channel': {
              label: 'JFACC_OPS_A: "spoof channel"',
              description: 'This spoofs the JFACC_OPS_A channel.',
              scriptName: '',
              originalPath: '',
              args: {},
            },
          },
          JFLCC_OPS_A: {
            'Spoof Channel': {
              label: 'JFLCC_OPS_A: "spoof channel"',
              description: 'This spoofs the JFLCC_OPS_A channel.',
              scriptName: '',
              originalPath: '',
              args: {},
            },
          },
          JFMCC_OPS_A: {
            'Spoof Channel': {
              label: 'JFMCC_OPS_A: "spoof channel"',
              description: 'This spoofs the JFMCC_OPS_A channel.',
              scriptName: '',
              originalPath: '',
              args: {},
            },
          },
          JFSOCC_OPS_A: {
            'Spoof Channel': {
              label: 'JFSOCC_OPS_A: "spoof channel"',
              description: 'This spoofs the JFSOCC_OPS_A channel.',
              scriptName: '',
              originalPath: '',
              args: {},
            },
          },
          JFSCC_OPS_A: {
            'Spoof Channel': {
              label: 'JFSCC_OPS_A: "spoof channel"',
              description: 'This spoofs the JFSCC_OPS_A channel.',
              scriptName: '',
              originalPath: '',
              args: {},
            },
          },
          JFCCC_OPS_A: {
            'Spoof Channel': {
              label: 'JFCCC_OPS_A: "spoof channel"',
              description: 'This spoofs the JFCCC_OPS_A channel.',
              scriptName: '',
              originalPath: '',
              args: {},
            },
          },
          TEXT_2_SPEECH_A: {
            'Spoof Channel': {
              label: 'TEXT_2_SPEECH_A: "spoof channel"',
              description: 'This spoofs the TEXT_2_SPEECH_A channel.',
              scriptName: '',
              originalPath: '',
              args: {},
            },
          },
          AUDIO_TRIGGER_A: {
            'Spoof Channel': {
              label: 'AUDIO_TRIGGER_A: "spoof channel"',
              description: 'This spoofs the AUDIO_TRIGGER_A channel.',
              scriptName: '',
              originalPath: '',
              args: {},
            },
          },
          ALL_SOURCE_INTEL_A: {
            'Spoof Channel': {
              label: 'ALL_SOURCE_INTEL_A: "spoof channel"',
              description: 'This spoofs the ALL_SOURCE_INTEL_A channel.',
              scriptName: '',
              originalPath: '',
              args: {},
            },
          },
          CESAR_A: {
            'Spoof Channel': {
              label: 'CESAR_A: "spoof channel"',
              description: 'This spoofs the CESAR_A channel.',
              scriptName: '',
              originalPath: '',
              args: {},
            },
          },
          METIS_A: {
            'Spoof Channel': {
              label: 'METIS_A: "spoof channel"',
              description: 'This spoofs the METIS_A channel.',
              scriptName: '',
              originalPath: '',
              args: {},
            },
          },
          AWACS_A: {
            'Spoof Channel': {
              label: 'AWACS_A: "spoof channel"',
              description: 'This spoofs the AWACS_A channel.',
              scriptName: '',
              originalPath: '',
              args: {},
            },
          },
        },
      },
      Sonomarc: {
        Frequencies: {
          'BEIGE-41': {
            'Jam Frequency': {
              label: 'BEIGE-41: "jam frequency"',
              description: 'This jams the BEIGE-41 frequency.',
              scriptName: '',
              originalPath: '',
              args: {},
            },
          },
          'CRIMMSON-28': {
            'Jam Frequency': {
              label: 'CRIMMSON-28: "jam frequency"',
              description: 'This jams the CRIMMSON-28 frequency.',
              scriptName: '',
              originalPath: '',
              args: {},
            },
          },
          'VIOLET-26': {
            'Jam Frequency': {
              label: 'VIOLET-26: "jam frequency"',
              description: 'This jams the VIOLET-26 frequency.',
              scriptName: '',
              originalPath: '',
              args: {},
            },
          },
          'TEAL-36': {
            'Jam Frequency': {
              label: 'TEAL-36: "jam frequency"',
              description: 'This jams the TEAL-36 frequency.',
              scriptName: '',
              originalPath: '',
              args: {},
            },
          },
          'AMBER-38': {
            'Jam Frequency': {
              label: 'AMBER-38: "jam frequency"',
              description: 'This jams the AMBER-38 frequency.',
              scriptName: '',
              originalPath: '',
              args: {},
            },
          },
          'COBALT-45': {
            'Jam Frequency': {
              label: 'COBALT-45: "jam frequency"',
              description: 'This jams the COBALT-45 frequency.',
              scriptName: '',
              originalPath: '',
              args: {},
            },
          },
          'SAGE-32': {
            'Jam Frequency': {
              label: 'SAGE-32: "jam frequency"',
              description: 'This jams the SAGE-32 frequency.',
              scriptName: '',
              originalPath: '',
              args: {},
            },
          },
          'SCARLETT-28': {
            'Jam Frequency': {
              label: 'SCARLETT-28: "jam frequency"',
              description: 'This jams the SCARLETT-28 frequency.',
              scriptName: '',
              originalPath: '',
              args: {},
            },
          },
          'SIENNA-31': {
            'Jam Frequency': {
              label: 'SIENNA-31: "jam frequency"',
              description: 'This jams the SIENNA-31 frequency.',
              scriptName: '',
              originalPath: '',
              args: {},
            },
          },
          'ROYAL-44': {
            'Jam Frequency': {
              label: 'ROYAL-44: "jam frequency"',
              description: 'This jams the ROYAL-44 frequency.',
              scriptName: '',
              originalPath: '',
              args: {},
            },
          },
          'CIDER-23': {
            'Jam Frequency': {
              label: 'CIDER-23: "jam frequency"',
              description: 'This jams the CIDER-23 frequency.',
              scriptName: '',
              originalPath: '',
              args: {},
            },
          },
          'PLUM-33': {
            'Jam Frequency': {
              label: 'PLUM-33: "jam frequency"',
              description: 'This jams the PLUM-33 frequency.',
              scriptName: '',
              originalPath: '',
              args: {},
            },
          },
          'SAPPHIRE-24': {
            'Jam Frequency': {
              label: 'SAPPHIRE-24: "jam frequency"',
              description: 'This jams the SAPPHIRE-24 frequency.',
              scriptName: '',
              originalPath: '',
              args: {},
            },
          },
          'PEWTER-35': {
            'Jam Frequency': {
              label: 'PEWTER-35: "jam frequency"',
              description: 'This jams the PEWTER-35 frequency.',
              scriptName: '',
              originalPath: '',
              args: {},
            },
          },
          'LIME-30': {
            'Jam Frequency': {
              label: 'LIME-30: "jam frequency"',
              description: 'This jams the LIME-30 frequency.',
              scriptName: '',
              originalPath: '',
              args: {},
            },
          },
          'HAZEL-47': {
            'Jam Frequency': {
              label: 'HAZEL-47: "jam frequency"',
              description: 'This jams the HAZEL-47 frequency.',
              scriptName: '',
              originalPath: '',
              args: {},
            },
          },
          'YELLOW-16': {
            'Jam Frequency': {
              label: 'YELLOW-16: "jam frequency"',
              description: 'This jams the YELLOW-16 frequency.',
              scriptName: '',
              originalPath: '',
              args: {},
            },
          },
          'RUBY-22': {
            'Jam Frequency': {
              label: 'RUBY-22: "jam frequency"',
              description: 'This jams the RUBY-22 frequency.',
              scriptName: '',
              originalPath: '',
              args: {},
            },
          },
          'MOCHA-38': {
            'Jam Frequency': {
              label: 'MOCHA-38: "jam frequency"',
              description: 'This jams the MOCHA-38 frequency.',
              scriptName: '',
              originalPath: '',
              args: {},
            },
          },
        },
      },
    },
    'Omega Suite': {
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
                label: 'RPA-A: "redirect RPA"',
                description: 'This redirects the RPA-A entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'RPA-B': {
              'Redirect RPA': {
                label: 'RPA-B: "redirect RPA"',
                description: 'This redirects the RPA-B entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'MQ-25': {
              'Redirect RPA': {
                label: 'MQ-25: "redirect RPA"',
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
        Hostile: {
          'Space': {
            'PLA-SEARCH': {
              Kill: {
                label: 'PLA-SEARCH: "kill"',
                description: 'This kills the PLA-SEARCH entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
          },
          'Cyber': {},
          'Air': {
            'HAO-A': {
              'Redirect HAO': {
                label: 'HAO-A: "redirect HAO"',
                description: 'This redirects the HAO-A entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'HAO-B': {
              Kill: {
                label: 'HAO-B: "redirect HAO"',
                description: 'This redirects the HAO-B entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'HAO-C': {
              Kill: {
                label: 'HAO-C: "redirect HAO"',
                description: 'This redirects the HAO-C entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
          },
          'Land': {
            'PLA ADOC': {
              'Disable auto fire': {
                label: 'PLA ADOC: "disable auto fire"',
                description:
                  'This will disable auto fire for the PLA ADOC entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'IADS_C-2-B': {
              'Kill': {
                label: 'IADS_C-2-B: "kill"',
                description: 'This kills the IADS_C-2-B entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
              'Disable auto fire': {
                label: 'IADS_C-2-B: "disable auto fire"',
                description:
                  'This will disable auto fire for the IADS_C-2-B entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'IADS_C-2-C': {
              'Kill': {
                label: 'IADS_C-2-C: "kill"',
                description: 'This kills the IADS_C-2-C entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
              'Disable auto fire': {
                label: 'IADS_C-2-C: "disable auto fire"',
                description:
                  'This will disable auto fire for the IADS_C-2-C entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'IADS_C-2-D': {
              'Kill': {
                label: 'IADS_C-2-D: "kill"',
                description: 'This kills the IADS_C-2-D entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
              'Disable auto fire': {
                label: 'IADS_C-2-D: "disable auto fire"',
                description:
                  'This will disable auto fire for the IADS_C-2-D entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'IADS_E-3-A': {
              Kill: {
                label: 'IADS_E-3-A: "kill"',
                description: 'This kills the IADS_E-3-A entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'IADS_E-3-B': {
              'Kill': {
                label: 'IADS_E-3-B: "kill"',
                description: 'This kills the IADS_E-3-B entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
              'Disable radar': {
                label: 'IADS_E-3-B: "disable radar"',
                description: 'This will disable the IADS_E-3-B radar entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'IADS_N-4-A': {
              'Kill': {
                label: 'IADS_N-4-A: "kill"',
                description: 'This kills the IADS_N-4-A entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
              'Disable auto fire': {
                label: 'IADS_N-4-A: "disable auto fire"',
                description:
                  'This will disable auto fire for the IADS_N-4-A entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'IADS_N-4-B': {
              'Kill': {
                label: 'IADS_N-4-B: "kill"',
                description: 'This kills the IADS_N-4-B entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
              'Disable radar': {
                label: 'IADS_N-4-B: "disable radar"',
                description: 'This will disable the IADS_N-4-B radar entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'IADS_S-1-A': {
              'Kill': {
                label: 'IADS_S-1-A: "kill"',
                description: 'This kills the IADS_S-1-A entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
              'Disable auto fire': {
                label: 'IADS_S-1-A: "disable auto fire"',
                description:
                  'This will disable auto fire for the IADS_S-1-A entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'IADS_S-1-B': {
              'Kill': {
                label: 'IADS_S-1-B: "kill"',
                description: 'This kills the IADS_S-1-B entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
              'Disable radar': {
                label: 'IADS_S-1-B: "disable radar"',
                description: 'This will disable the IADS_S-1-B radar entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'IADS_S-1-C': {
              Kill: {
                label: 'IADS_S-1-C: "kill"',
                description: 'This kills the IADS_S-1-C entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'RUS-S300-A': {
              Kill: {
                label: 'RUS-S300-A: "kill"',
                description: 'This kills the RUS-S300-A entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'RUS-S300-B': {
              Kill: {
                label: 'RUS-S300-B: "kill"',
                description: 'This kills the RUS-S300-B entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'RUS-S300-C': {
              Kill: {
                label: 'RUS-S300-C: "kill"',
                description: 'This kills the RUS-S300-C entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'INF-BN-A-10': {
              Kill: {
                label: 'INF-BN-A-10: "kill"',
                description: 'This kills the INF-BN-A-10 entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'INF-BN-B-10': {
              Kill: {
                label: 'INF-BN-B-10: "kill"',
                description: 'This kills the INF-BN-B-10 entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'INF-BN-C-10': {
              Kill: {
                label: 'INF-BN-C-10: "kill"',
                description: 'This kills the INF-BN-C-10 entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'INF-BN-D-10': {
              Kill: {
                label: 'INF-BN-D-10: "kill"',
                description: 'This kills the INF-BN-D-10 entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'INF-BN-E-10': {
              Kill: {
                label: 'INF-BN-E-10: "kill"',
                description: 'This kills the INF-BN-E-10 entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'INF-BN-F-10': {
              Kill: {
                label: 'INF-BN-F-10: "kill"',
                description: 'This kills the INF-BN-F-10 entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'INF-BN-G-10': {
              Kill: {
                label: 'INF-BN-G-10: "kill"',
                description: 'This kills the INF-BN-G-10 entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'INF-CO-A-5': {
              Kill: {
                label: 'INF-CO-A-5: "kill"',
                description: 'This kills the INF-CO-A-5 entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'INF-CO-B-5': {
              Kill: {
                label: 'INF-CO-B-5: "kill"',
                description: 'This kills the INF-CO-B-5 entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'INF-CO-C-5': {
              Kill: {
                label: 'INF-CO-C-5: "kill"',
                description: 'This kills the INF-CO-C-5 entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'INF-CO-D-5': {
              Kill: {
                label: 'INF-CO-D-5: "kill"',
                description: 'This kills the INF-CO-D-5 entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'INF-CO-E-5': {
              Kill: {
                label: 'INF-CO-E-5: "kill"',
                description: 'This kills the INF-CO-E-5 entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'INF-CO-F-5': {
              Kill: {
                label: 'INF-CO-F-5: "kill"',
                description: 'This kills the INF-CO-F-5 entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'INF-CO-G-5': {
              Kill: {
                label: 'INF-CO-G-5: "kill"',
                description: 'This kills the INF-CO-G-5 entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'INF-CO-H-5': {
              Kill: {
                label: 'INF-CO-H-5: "kill"',
                description: 'This kills the INF-CO-H-5 entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'SOF-BN-A-8': {
              Kill: {
                label: 'SOF-BN-A-8: "kill"',
                description: 'This kills the SOF-BN-A-8 entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'SOF-BN-B-8': {
              Kill: {
                label: 'SOF-BN-B-8: "kill"',
                description: 'This kills the SOF-BN-B-8 entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'SOF-BN-C-8': {
              Kill: {
                label: 'SOF-BN-C-8: "kill"',
                description: 'This kills the SOF-BN-C-8 entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'SOF-TM-A-3': {
              Kill: {
                label: 'SOF-TM-A-3: "kill"',
                description: 'This kills the SOF-TM-A-3 entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'SOF-TM-B-3': {
              Kill: {
                label: 'SOF-TM-B-3: "kill"',
                description: 'This kills the SOF-TM-B-3 entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'SOF-TM-C-3': {
              Kill: {
                label: 'SOF-TM-C-3: "kill"',
                description: 'This kills the SOF-TM-C-3 entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'SOF-TM-D-3': {
              Kill: {
                label: 'SOF-TM-D-3: "kill"',
                description: 'This kills the SOF-TM-D-3 entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'SOF-TM-E-3': {
              Kill: {
                label: 'SOF-TM-E-3: "kill"',
                description: 'This kills the SOF-TM-E-3 entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'PLA-C2-HOK': {
              Kill: {
                label: 'PLA-C2-HOK: "kill"',
                description: 'This kills the PLA-C2-HOK entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
          },
          'Surface': {
            'PLA-CVN': {
              Kill: {
                label: 'PLA-CVN: "kill"',
                description: 'This kills the PLA-CVN entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'PLA-DDG-A': {
              'Kill': {
                label: 'PLA-DDG-A: "kill"',
                description: 'This kills the PLA-DDG-A entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
              'Disable auto fire': {
                label: 'PLA-DDG-A: "disable auto fire"',
                description:
                  'This will disable auto fire for the PLA-DDG-A entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'PLA-DDG-B': {
              'Kill': {
                label: 'PLA-DDG-B: "kill"',
                description: 'This kills the PLA-DDG-B entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
              'Disable auto fire': {
                label: 'PLA-DDG-B: "disable auto fire"',
                description:
                  'This will disable auto fire for the PLA-DDG-B entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'PLA-DDG-C': {
              'Kill': {
                label: 'PLA-DDG-C: "kill"',
                description: 'This kills the PLA-DDG-C entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
              'Disable auto fire': {
                label: 'PLA-DDG-C: "disable auto fire"',
                description:
                  'This will disable auto fire for the PLA-DDG-C entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'PLA-DDG-D': {
              'Kill': {
                label: 'PLA-DDG-D: "kill"',
                description: 'This kills the PLA-DDG-D entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
              'Disable auto fire': {
                label: 'PLA-DDG-D: "disable auto fire"',
                description:
                  'This will disable auto fire for the PLA-DDG-D entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
          },
          'Sub-Surface': {
            'PLA-SSN-A': {
              Kill: {
                label: 'PLA-SSN-A: "kill"',
                description: 'This kills the PLA-SSN-A entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'PLA-SSN-B': {
              Kill: {
                label: 'PLA-SSN-B: "kill"',
                description: 'This kills the PLA-SSN-B entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
          },
        },
        Neutral: {
          'Space': { 'CBCN-SAT': {} },
          'Cyber': {},
          'Air': {},
          'Land': {
            'CBCN-NODE': {
              Disable: {
                label: 'CBCN-NODE: "disable"',
                description: 'This disables the CBCN-NODE entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'CBCN-SERVER': {
              Disable: {
                label: 'CBCN-SERVER: "disable"',
                description: 'This disables the CBCN-SERVER entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'CBCN001-139': {
              Disable: {
                label: 'CBCN001-139: "disable"',
                description: 'This disables the CBCN001-139 entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'CBCN998': {
              Disable: {
                label: 'CBCN998: "disable"',
                description: 'This disables the CBCN998 entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
            'CBCN999': {
              Disable: {
                label: 'CBCN999: "disable"',
                description: 'This disables the CBCN999 entity.',
                scriptName: '',
                originalPath: '',
                args: {},
              },
            },
          },
          'Surface': {},
          'Sub-Surface': {},
        },
        Unknown: {
          'Space': {},
          'Cyber': {},
          'Air': {},
          'Land': {},
          'Surface': {},
          'Sub-Surface': {},
        },
      },
      mIRC: {
        'mIRC Server': {
          EFFECTS: ['Shutdown Server', 'List all channels', 'List all users'],
        },
        'Channels': {
          CJTF_H_COMMAND_A: {
            'Spoof Channel': {
              label: 'CJTF_H_COMMAND_A: "spoof channel"',
              description: 'This spoofs the CJTF_H_COMMAND_A channel.',
              scriptName: '',
              originalPath: '',
              args: {},
            },
          },
          JFACC_OPS_A: {
            'Spoof Channel': {
              label: 'JFACC_OPS_A: "spoof channel"',
              description: 'This spoofs the JFACC_OPS_A channel.',
              scriptName: '',
              originalPath: '',
              args: {},
            },
          },
          JFLCC_OPS_A: {
            'Spoof Channel': {
              label: 'JFLCC_OPS_A: "spoof channel"',
              description: 'This spoofs the JFLCC_OPS_A channel.',
              scriptName: '',
              originalPath: '',
              args: {},
            },
          },
          JFMCC_OPS_A: {
            'Spoof Channel': {
              label: 'JFMCC_OPS_A: "spoof channel"',
              description: 'This spoofs the JFMCC_OPS_A channel.',
              scriptName: '',
              originalPath: '',
              args: {},
            },
          },
          JFSOCC_OPS_A: {
            'Spoof Channel': {
              label: 'JFSOCC_OPS_A: "spoof channel"',
              description: 'This spoofs the JFSOCC_OPS_A channel.',
              scriptName: '',
              originalPath: '',
              args: {},
            },
          },
          JFSCC_OPS_A: {
            'Spoof Channel': {
              label: 'JFSCC_OPS_A: "spoof channel"',
              description: 'This spoofs the JFSCC_OPS_A channel.',
              scriptName: '',
              originalPath: '',
              args: {},
            },
          },
          JFCCC_OPS_A: {
            'Spoof Channel': {
              label: 'JFCCC_OPS_A: "spoof channel"',
              description: 'This spoofs the JFCCC_OPS_A channel.',
              scriptName: '',
              originalPath: '',
              args: {},
            },
          },
          TEXT_2_SPEECH_A: {
            'Spoof Channel': {
              label: 'TEXT_2_SPEECH_A: "spoof channel"',
              description: 'This spoofs the TEXT_2_SPEECH_A channel.',
              scriptName: '',
              originalPath: '',
              args: {},
            },
          },
          AUDIO_TRIGGER_A: {
            'Spoof Channel': {
              label: 'AUDIO_TRIGGER_A: "spoof channel"',
              description: 'This spoofs the AUDIO_TRIGGER_A channel.',
              scriptName: '',
              originalPath: '',
              args: {},
            },
          },
          ALL_SOURCE_INTEL_A: {
            'Spoof Channel': {
              label: 'ALL_SOURCE_INTEL_A: "spoof channel"',
              description: 'This spoofs the ALL_SOURCE_INTEL_A channel.',
              scriptName: '',
              originalPath: '',
              args: {},
            },
          },
          CESAR_A: {
            'Spoof Channel': {
              label: 'CESAR_A: "spoof channel"',
              description: 'This spoofs the CESAR_A channel.',
              scriptName: '',
              originalPath: '',
              args: {},
            },
          },
          METIS_A: {
            'Spoof Channel': {
              label: 'METIS_A: "spoof channel"',
              description: 'This spoofs the METIS_A channel.',
              scriptName: '',
              originalPath: '',
              args: {},
            },
          },
          AWACS_A: {
            'Spoof Channel': {
              label: 'AWACS_A: "spoof channel"',
              description: 'This spoofs the AWACS_A channel.',
              scriptName: '',
              originalPath: '',
              args: {},
            },
          },
        },
      },
      Sonomarc: {
        Frequencies: {
          'BEIGE-41': {
            'Jam Frequency': {
              label: 'BEIGE-41: "jam frequency"',
              description: 'This jams the BEIGE-41 frequency.',
              scriptName: '',
              originalPath: '',
              args: {},
            },
          },
          'CRIMMSON-28': {
            'Jam Frequency': {
              label: 'CRIMMSON-28: "jam frequency"',
              description: 'This jams the CRIMMSON-28 frequency.',
              scriptName: '',
              originalPath: '',
              args: {},
            },
          },
          'VIOLET-26': {
            'Jam Frequency': {
              label: 'VIOLET-26: "jam frequency"',
              description: 'This jams the VIOLET-26 frequency.',
              scriptName: '',
              originalPath: '',
              args: {},
            },
          },
          'TEAL-36': {
            'Jam Frequency': {
              label: 'TEAL-36: "jam frequency"',
              description: 'This jams the TEAL-36 frequency.',
              scriptName: '',
              originalPath: '',
              args: {},
            },
          },
          'AMBER-38': {
            'Jam Frequency': {
              label: 'AMBER-38: "jam frequency"',
              description: 'This jams the AMBER-38 frequency.',
              scriptName: '',
              originalPath: '',
              args: {},
            },
          },
          'COBALT-45': {
            'Jam Frequency': {
              label: 'COBALT-45: "jam frequency"',
              description: 'This jams the COBALT-45 frequency.',
              scriptName: '',
              originalPath: '',
              args: {},
            },
          },
          'SAGE-32': {
            'Jam Frequency': {
              label: 'SAGE-32: "jam frequency"',
              description: 'This jams the SAGE-32 frequency.',
              scriptName: '',
              originalPath: '',
              args: {},
            },
          },
          'SCARLETT-28': {
            'Jam Frequency': {
              label: 'SCARLETT-28: "jam frequency"',
              description: 'This jams the SCARLETT-28 frequency.',
              scriptName: '',
              originalPath: '',
              args: {},
            },
          },
          'SIENNA-31': {
            'Jam Frequency': {
              label: 'SIENNA-31: "jam frequency"',
              description: 'This jams the SIENNA-31 frequency.',
              scriptName: '',
              originalPath: '',
              args: {},
            },
          },
          'ROYAL-44': {
            'Jam Frequency': {
              label: 'ROYAL-44: "jam frequency"',
              description: 'This jams the ROYAL-44 frequency.',
              scriptName: '',
              originalPath: '',
              args: {},
            },
          },
          'CIDER-23': {
            'Jam Frequency': {
              label: 'CIDER-23: "jam frequency"',
              description: 'This jams the CIDER-23 frequency.',
              scriptName: '',
              originalPath: '',
              args: {},
            },
          },
          'PLUM-33': {
            'Jam Frequency': {
              label: 'PLUM-33: "jam frequency"',
              description: 'This jams the PLUM-33 frequency.',
              scriptName: '',
              originalPath: '',
              args: {},
            },
          },
          'SAPPHIRE-24': {
            'Jam Frequency': {
              label: 'SAPPHIRE-24: "jam frequency"',
              description: 'This jams the SAPPHIRE-24 frequency.',
              scriptName: '',
              originalPath: '',
              args: {},
            },
          },
          'PEWTER-35': {
            'Jam Frequency': {
              label: 'PEWTER-35: "jam frequency"',
              description: 'This jams the PEWTER-35 frequency.',
              scriptName: '',
              originalPath: '',
              args: {},
            },
          },
          'LIME-30': {
            'Jam Frequency': {
              label: 'LIME-30: "jam frequency"',
              description: 'This jams the LIME-30 frequency.',
              scriptName: '',
              originalPath: '',
              args: {},
            },
          },
          'HAZEL-47': {
            'Jam Frequency': {
              label: 'HAZEL-47: "jam frequency"',
              description: 'This jams the HAZEL-47 frequency.',
              scriptName: '',
              originalPath: '',
              args: {},
            },
          },
          'YELLOW-16': {
            'Jam Frequency': {
              label: 'YELLOW-16: "jam frequency"',
              description: 'This jams the YELLOW-16 frequency.',
              scriptName: '',
              originalPath: '',
              args: {},
            },
          },
          'RUBY-22': {
            'Jam Frequency': {
              label: 'RUBY-22: "jam frequency"',
              description: 'This jams the RUBY-22 frequency.',
              scriptName: '',
              originalPath: '',
              args: {},
            },
          },
          'MOCHA-38': {
            'Jam Frequency': {
              label: 'MOCHA-38: "jam frequency"',
              description: 'This jams the MOCHA-38 frequency.',
              scriptName: '',
              originalPath: '',
              args: {},
            },
          },
        },
      },
    },
  },
}
