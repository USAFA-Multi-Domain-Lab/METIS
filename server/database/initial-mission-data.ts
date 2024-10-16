// -- initial --

import { TCommonMissionJson } from 'metis/missions'
import ServerMissionAction from '../missions/actions'
import ServerMissionForce from '../missions/forces'
import ServerMissionNode from '../missions/nodes'
import ServerMissionPrototype from '../missions/nodes/prototypes'

export let demoMissionData: TCommonMissionJson = {
  name: 'METIS > ASCOT 7 DEMO',
  versionNumber: 1,
  seed: '6499bf5b8214651c898d125f',
  structure: {
    '882d6985-a05c-4f36-b66b-92de27d34552': {
      '405b84dc-a653-47ed-8d88-aef3177a99b2': {},
      '315605d0-3210-4644-8903-d254151769e2': {},
      '51f256b3-614c-4f9a-80f3-3d020a758cd7': {},
      '2d69024c-9cc4-40bd-ab84-1d7761abe810': {},
      'd4bf672b-1490-4246-92c5-69e31d2714b5': {
        '6185ea46-de8b-4308-aec3-e257313563af': {
          'e25eb328-d98a-4215-a1a2-e854137e9209': {
            '152811b3-e125-4cae-b4e4-06a5842b403c': {
              'b6220969-160d-4339-8a96-b5c632422ffa': {},
              '0d0ad493-346c-4096-80e3-f8bc7b21f535': {},
              'a8bbd3c1-b050-40cc-932a-5b642e9e5d37': {},
              '71eb8dd1-1104-481b-baf0-a4850c58ebc7': {},
              '7344d4d7-2a9b-4b99-ad2a-4dd353a3bd49': {
                'c3a94935-578b-42a1-9fc1-7878fe24fb6d': {},
                'ae6b07fb-9f36-4eeb-9dbd-e579e8eb7f5d': {},
                '60acf5d1-3467-462c-816c-bcb2e5c2b8e0': {
                  '26f3833d-45cf-4860-ac97-edd8ef877d3c': {
                    '3bca4ca3-4a5b-4518-bc7a-0f2c8d9b1999': {},
                    'a6a31b1c-7be6-4a71-81c1-1ffa88ed3711': {},
                    'e398028a-1f87-4d58-bf69-b949ef176cf6': {
                      'd04326e3-491b-479a-9f22-d4f49703f8de': {},
                    },
                  },
                },
              },
              'c3b45b64-160d-4fca-a0bf-10fc8740ea21': {},
            },
            '1c97200f-69d6-4546-b99e-6cd0a11ae0a4': {},
          },
          'cb7c666e-4ac3-4c6c-8dcd-c8c4d383ce65': {},
          'e1ef9397-f480-4f06-8c0b-afcf1ace7f69': {},
          '096fa5e6-d25a-4b86-a618-a8ab854d9b12': {},
          '36ed93ea-a7ef-445e-b1a2-d068681ebca4': {},
          '05b4b9e6-2f46-4ce0-adf4-d1d846c650da': {},
        },
      },
      'afa6923d-875f-4dbe-b724-3c908deb853b': {},
      '339e1633-34cc-488f-abee-61ec1f21f0dd': {},
    },
  },
  forces: [
    {
      _id: ServerMissionForce.DEFAULT_PROPERTIES._id,
      introMessage: '<p>Welcome to Friendly Force!</p>',
      name: 'Friendly Force',
      color: '#34a1fb',
      initialResources: 100,
      nodes: [
        {
          _id: ServerMissionNode.DEFAULT_PROPERTIES._id,
          prototypeId: 'f0be8f94-82ad-4e90-8a3d-65d2380a7c49',
          name: 'Select Target Region',
          color: '#65eb59',
          description: '<p>Select Combatant Command</p>',
          preExecutionText:
            '<p>SYS MESSAGE: Select the unified combatant commands in which to conduct operations.</p>',
          executable: false,
          device: false,
          actions: [
            {
              _id: ServerMissionAction.DEFAULT_PROPERTIES._id,
              name: 'New Action',
              description: '<p>Enter your description here.</p>',
              processTime: 5000,
              successChance: 0.5,
              resourceCost: 1,
              postExecutionSuccessText:
                '<p>Enter your successful post-execution message here.</p>',
              postExecutionFailureText:
                '<p>Enter your failed post-execution message here.</p>',
              effects: [],
            },
          ],
        },
        {
          _id: ServerMissionNode.DEFAULT_PROPERTIES._id,
          prototypeId: '77429f3a-6187-4793-b4fc-ee2f626b1787',
          name: 'CENTCOM',
          color: '#52b1ff',
          description: '<p>U.S. Central Command</p>',
          preExecutionText:
            '<p>*** CONNECTION ESTABLISHED *** SYS MESSAGE: Welcome to the unified combatant commands cyberspace effects services interface system.</p>',
          executable: false,
          device: false,
          actions: [],
        },
        {
          _id: ServerMissionNode.DEFAULT_PROPERTIES._id,
          prototypeId: 'f6ae948d-c81a-4719-b373-c6c7ccec09b0',
          name: 'AFRICOM',
          color: '#52b1ff',
          description: '<p>U.S. Africa Command</p>',
          preExecutionText:
            '<p>*** CONNECTION ESTABLISHED *** SYS MESSAGE: Welcome to the unified combatant commands cyberspace effects services interface system.</p>',
          executable: false,
          device: false,
          actions: [],
        },
        {
          _id: ServerMissionNode.DEFAULT_PROPERTIES._id,
          prototypeId: '6d7913d0-f6d6-40e8-b203-4c8553dcc6e0',
          name: 'EUCOM',
          color: '#52b1ff',
          description: '<p>U.S. European Command</p>',
          preExecutionText:
            '<p>*** CONNECTION ESTABLISHED *** SYS MESSAGE: Welcome to the unified combatant commands cyberspace effects services interface system.</p>',
          executable: false,
          device: false,
          actions: [],
        },
        {
          _id: ServerMissionNode.DEFAULT_PROPERTIES._id,
          prototypeId: 'b1cdcf5b-1571-4178-ab5e-bf1672462c9f',
          name: 'NORTHCOM',
          color: '#52b1ff',
          description: '<p>U.S. Northern Command</p>',
          preExecutionText:
            '<p>*** CONNECTION ESTABLISHED *** SYS MESSAGE: Welcome to the unified combatant commands cyberspace effects services interface system.</p>',
          executable: false,
          device: false,
          actions: [],
        },
        {
          _id: ServerMissionNode.DEFAULT_PROPERTIES._id,
          prototypeId: 'e29df0b8-7093-47d5-a6c2-cda4861c9ee3',
          name: 'INDOPACOM',
          color: '#52b1ff',
          description: '<p>U.S. Indo-Pacific Command</p>',
          preExecutionText:
            "<p>*** CONNECTION ESTABLISHED *** SYS MESSAGE: Welcome to the unified combatant command's cyberspace effects services interface system. MISSION: U.S. Indo-Pacific Command will implement a combat credible deterrence strategy capable of denying our adversaries sustained air and sea dominance by focusing on posturing the Joint Force to win before fighting, while being ready to fight and win, if required.</p>",
          executable: false,
          device: false,
          actions: [],
        },
        {
          _id: ServerMissionNode.DEFAULT_PROPERTIES._id,
          prototypeId: 'b47d9081-9ea5-4540-8d8b-67eaa28fe1d0',
          name: 'SOUTHCOM',
          color: '#52b1ff',
          description: '<p>U.S. Southern Command</p>',
          preExecutionText:
            '<p>*** CONNECTION ESTABLISHED *** SYS MESSAGE: Welcome to the unified combatant commands cyberspace effects services interface system.</p>',
          executable: false,
          device: false,
          actions: [],
        },
        {
          _id: ServerMissionNode.DEFAULT_PROPERTIES._id,
          prototypeId: '70effa5f-412b-4756-9fcb-b07dd7d9b50e',
          name: 'SPACECOM',
          color: '#52b1ff',
          description: '<p>U.S. Space Command</p>',
          preExecutionText:
            '<p>*** CONNECTION ESTABLISHED *** SYS MESSAGE: Welcome to the unified combatant commands cyberspace effects services interface system.</p>',
          executable: false,
          device: false,
          actions: [],
        },
        {
          _id: ServerMissionNode.DEFAULT_PROPERTIES._id,
          prototypeId: 'fc95ead3-f930-4f37-ac40-6dab33b41698',
          name: 'Select Domain',
          color: '#eb5fb2',
          description: '<p>Select Domain of Operations</p>',
          preExecutionText: '<p>SYS MESSAGE: Select domain of operations.</p>',
          executable: false,
          device: false,
          actions: [],
        },
        {
          _id: ServerMissionNode.DEFAULT_PROPERTIES._id,
          prototypeId: '702e2bfd-dd98-4806-a938-639725290577',
          name: 'Space',
          color: '#cd328e',
          description: '<p>Target Space Domain</p>',
          preExecutionText: '<p>SYS MESSAGE: Select target region.</p>',
          executable: false,
          device: false,
          actions: [],
        },
        {
          _id: ServerMissionNode.DEFAULT_PROPERTIES._id,
          prototypeId: 'f44309a6-6853-47a4-b2a3-daa76865c3bf',
          name: 'Cyberspace',
          color: '#cd328e',
          description: '<p>Target Cyberspace Domain</p>',
          preExecutionText:
            '<p>SYS MESSAGE: Selected domain assets currently available for cyberspace effects targets has been compiled.</p>',
          executable: false,
          device: false,
          actions: [],
        },
        {
          _id: ServerMissionNode.DEFAULT_PROPERTIES._id,
          prototypeId: '621f6ecd-6cf8-4e94-80bf-dffbde8a2a96',
          name: 'Air',
          color: '#cd328e',
          description: '<p>Target Air Domain</p>',
          preExecutionText:
            '<p>SYS MESSAGE: Selected domain assets currently available for cyberspace effects targets has been compiled.</p>',
          executable: false,
          device: false,
          actions: [],
        },
        {
          _id: ServerMissionNode.DEFAULT_PROPERTIES._id,
          prototypeId: 'aba76dd8-083d-4fb0-a469-587a89555d6a',
          name: 'Land',
          color: '#cd328e',
          description: '<p>Target Land Domain</p>',
          preExecutionText:
            '<p>SYS MESSAGE: Selected domain assets currently available for cyberspace effects targets has been compiled.</p>',
          executable: false,
          device: false,
          actions: [],
        },
        {
          _id: ServerMissionNode.DEFAULT_PROPERTIES._id,
          prototypeId: 'bf75dfc9-ab88-4ce2-a5aa-4861c1f797f0',
          name: 'Sea',
          color: '#cd328e',
          description: '<p>Target Sea Domain</p>',
          preExecutionText:
            '<p>SYS MESSAGE: Selected domain assets currently available for cyberspace effects targets has been compiled.</p>',
          executable: false,
          device: false,
          actions: [],
        },
        {
          _id: ServerMissionNode.DEFAULT_PROPERTIES._id,
          prototypeId: '7f41635e-5b64-4b84-8da3-b3f0a5fdb990',
          name: 'Sub-Surface',
          color: '#cd328e',
          description: '<p>Target Sub-Surface Domain</p>',
          preExecutionText:
            '<p>SYS MESSAGE: Selected domain assets currently available for cyberspace effects targets has been compiled.</p>',
          executable: false,
          device: false,
          actions: [],
        },
        {
          _id: ServerMissionNode.DEFAULT_PROPERTIES._id,
          prototypeId: '6c6d78a0-5b67-49a1-928c-79dce43fe253',
          name: 'China',
          color: '#f5e677',
          description: '<p>Select Target Region</p>',
          preExecutionText:
            '<p>*** WARNING: ACCESS AND OPERATIONS CONDUCTED BEYOND THIS POINT REQUIRES COMBATANT COMMAND LEAVE AUTHORIZATION. ***</p>',
          executable: true,
          device: false,
          actions: [
            {
              _id: ServerMissionAction.DEFAULT_PROPERTIES._id,
              name: 'CONFIRM AUTHORIZATION',
              description: '<p>ACCESS WARNING</p>',
              processTime: 10000,
              successChance: 1,
              resourceCost: 0,
              postExecutionSuccessText:
                "<p>*** RUNNING COMPILE SCRIPT. . . . . . [] *** SYS MESSAGE: Compiling list of Xi’an Satellite Control Center subordinate ground control stations (GCS). 系统消息：正在整理西安卫星控制中心下属地面控制站（GCS）列表。 Xìtǒng xiāoxī: Zhèngzài zhěnglǐ xī'ān wèixīng kòngzhì zhōngxīn xiàshǔ dìmiàn kòngzhì zhàn (GCS) lièbiǎo.</p>",
              postExecutionFailureText: '<p>Error: 1025845</p>',
              effects: [],
            },
          ],
        },
        {
          _id: ServerMissionNode.DEFAULT_PROPERTIES._id,
          prototypeId: '530caa0b-86c7-4fc6-ba20-187176ab06c8',
          name: 'North Korea',
          color: '#f5e677',
          description: '<p>Select Target Region</p>',
          preExecutionText:
            '<p>*** WARNING: Access beyond this point requires combatant command leave authorization. ***</p>',
          executable: true,
          device: false,
          actions: [
            {
              _id: ServerMissionAction.DEFAULT_PROPERTIES._id,
              name: 'CONFIRM AUTHORIZATION',
              description: '<p>ACCESS WARNING</p>',
              processTime: 5000,
              successChance: 1,
              resourceCost: 0,
              postExecutionSuccessText:
                '<p>*** RUNNING COMPILE SCRIPT. . . . . . [] *** SYS MESSAGE: List of available access points has been generated.</p>',
              postExecutionFailureText: '<p>Error: 1025845</p>',
              effects: [],
            },
          ],
        },
        {
          _id: ServerMissionNode.DEFAULT_PROPERTIES._id,
          prototypeId: '163279da-c5ca-464b-af42-279a25ac55c0',
          name: 'Nanning Station [南宁站] ',
          color: '#d0bf3b',
          description: '<p>Select Ground Control Station</p>',
          preExecutionText: '',
          executable: true,
          device: false,
          actions: [
            {
              _id: ServerMissionAction.DEFAULT_PROPERTIES._id,
              name: 'Run Brute Force Entry Script',
              description: '<p>Gain access to this system.</p>',
              processTime: 10000,
              successChance: 1,
              resourceCost: 10,
              postExecutionSuccessText:
                '<p>/// BRUTE FORCE CRACK SUCCESSFUL /// SYS MESSAGE: List compiled of currently connected terrestrial based assets.</p>',
              postExecutionFailureText:
                '<p>Error: 1025845 *** NETWORK ACCESS BLOCKED ***</p>',
              effects: [],
            },
          ],
        },
        {
          _id: ServerMissionNode.DEFAULT_PROPERTIES._id,
          prototypeId: '00c6c255-3a0d-494b-8ed3-351a866cbd42',
          name: 'Lingshui Station [陵水测控站]',
          color: '#d0bf3b',
          description: '<p>Select Ground Control Station</p>',
          preExecutionText: '',
          executable: true,
          device: false,
          actions: [
            {
              _id: ServerMissionAction.DEFAULT_PROPERTIES._id,
              name: 'Run Brute Force Entry Script',
              description: '<p>Gain access to this system.</p>',
              processTime: 10000,
              successChance: 1,
              resourceCost: 10,
              postExecutionSuccessText:
                '<p>/// BRUTE FORCE CRACK SUCCESSFUL /// SYS MESSAGE: List compiled of currently connected terrestrial based assets.</p>',
              postExecutionFailureText:
                '<p>Error: 1025845 *** NETWORK ACCESS BLOCKED ***</p>',
              effects: [],
            },
          ],
        },
        {
          _id: ServerMissionNode.DEFAULT_PROPERTIES._id,
          prototypeId: 'b6b9aa31-5aaa-4bd0-8578-cebf09175d12',
          name: 'Menghai Station [勐海测控站]',
          color: '#d0bf3b',
          description: '<p>Select Ground Control Station</p>',
          preExecutionText: '',
          executable: true,
          device: false,
          actions: [
            {
              _id: ServerMissionAction.DEFAULT_PROPERTIES._id,
              name: 'Run Brute Force Entry Script',
              description: '<p>Gain access to this system.</p>',
              processTime: 10000,
              successChance: 1,
              resourceCost: 10,
              postExecutionSuccessText:
                '<p>/// BRUTE FORCE CRACK SUCCESSFUL /// SYS MESSAGE: List compiled of currently connected terrestrial based assets.</p>',
              postExecutionFailureText:
                '<p>Error: 1025845 *** NETWORK ACCESS BLOCKED ***</p>',
              effects: [],
            },
          ],
        },
        {
          _id: ServerMissionNode.DEFAULT_PROPERTIES._id,
          prototypeId: 'ac205391-73cc-4220-8bae-6b8214d04a28',
          name: 'Minxi Station [闽西测控站]',
          color: '#d0bf3b',
          description: '<p>Select Ground Control Station</p>',
          preExecutionText: '',
          executable: true,
          device: false,
          actions: [
            {
              _id: ServerMissionAction.DEFAULT_PROPERTIES._id,
              name: 'Run Brute Force Entry Script',
              description: '<p>Gain access to this system.</p>',
              processTime: 10000,
              successChance: 1,
              resourceCost: 10,
              postExecutionSuccessText:
                '<p>/// BRUTE FORCE CRACK SUCCESSFUL /// SYS MESSAGE: List compiled of currently connected terrestrial based assets.</p>',
              postExecutionFailureText:
                '<p>Error: 1025845 *** NETWORK ACCESS BLOCKED ***</p>',
              effects: [],
            },
          ],
        },
        {
          _id: ServerMissionNode.DEFAULT_PROPERTIES._id,
          prototypeId: '2c2ca5c7-1cef-4440-ab0d-7af83b09c341',
          name: 'Changchun Station [长春测控站] ',
          color: '#d0bf3b',
          description: '<p>Select Ground Control Station</p>',
          preExecutionText:
            '<p>Now connected to Changchun Station monitor/command systems.</p>',
          executable: true,
          device: false,
          actions: [
            {
              _id: ServerMissionAction.DEFAULT_PROPERTIES._id,
              name: 'Run Access Script',
              description: '<p>Gain access to this system.</p>',
              processTime: 10000,
              successChance: 1,
              resourceCost: 10,
              postExecutionSuccessText:
                '<p>/// ACCESS SCRIPT SUCCESSFUL /// SYS MESSAGE: List compiled of currently connected terrestrial based assets. /// 访问脚本成功 /// 系统消息：当前连接的地面资产的列表。 /// Fǎngwèn jiǎoběn chénggōng/// xìtǒng xiāoxī: Dāngqián liánjiē dì dìmiàn zīchǎn dì lièbiǎo.</p>',
              postExecutionFailureText:
                '<p>Error: 1025845 *** NETWORK ACCESS BLOCKED ***</p>',
              effects: [],
            },
          ],
        },
        {
          _id: ServerMissionNode.DEFAULT_PROPERTIES._id,
          prototypeId: 'eef4bf51-4ba9-4065-b584-b4a3fcad28ef',
          name: 'Qingdao Station [青岛测控站]',
          color: '#d0bf3b',
          description: '<p>Select Ground Control Station</p>',
          preExecutionText: '',
          executable: true,
          device: false,
          actions: [
            {
              _id: ServerMissionAction.DEFAULT_PROPERTIES._id,
              name: 'Run Brute Force Entry Script',
              description: '<p>Gain access to this system.</p>',
              processTime: 10000,
              successChance: 1,
              resourceCost: 10,
              postExecutionSuccessText:
                '<p>/// BRUTE FORCE CRACK SUCCESSFUL /// SYS MESSAGE: List compiled of currently connected terrestrial based assets.</p>',
              postExecutionFailureText:
                '<p>Error: 1025845 *** NETWORK ACCESS BLOCKED ***</p>',
              effects: [],
            },
          ],
        },
        {
          _id: ServerMissionNode.DEFAULT_PROPERTIES._id,
          prototypeId: '6fcec8cb-0485-4e78-b6b2-804b041c5a80',
          name: 'YAOGAN-23 (SAR)',
          color: '#52b1ff',
          description: '<p>JB-7-4</p>',
          preExecutionText:
            '<p>Satellite: YAOGAN-23 (SAR) Two Line Element Set (TLE): 1 40305U 14071A 23186.44045114 .00010456 00000-0 35544-3 0 9998 2 40305 97.6540 150.2916 0001821 103.7780 256.3663 15.30655096478928</p>',
          executable: true,
          device: false,
          actions: [
            {
              _id: ServerMissionAction.DEFAULT_PROPERTIES._id,
              name: 'New Action',
              description: '<p>Enter your description here.</p>',
              processTime: 5000,
              successChance: 0.5,
              resourceCost: 1,
              postExecutionSuccessText:
                '<p>Enter your successful post-execution message here.</p>',
              postExecutionFailureText:
                '<p>Enter your failed post-execution message here.</p>',
              effects: [],
            },
          ],
        },
        {
          _id: ServerMissionNode.DEFAULT_PROPERTIES._id,
          prototypeId: '198984b2-bd37-4426-8929-970677187591',
          name: 'YAOGAN-35 (ELINT)',
          color: '#52b1ff',
          description: '<p>Unknown</p>',
          preExecutionText:
            '<p>Satellite: YAOGAN-35 (ELINT) - Two Line Element Set (TLE): 1 53522U 22100A 23185.93674371 .00000372 00000-0 15955-4 0 9992 2 53522 35.0016 357.2127 0015138 230.2255 129.7127 15.25075460 48723</p>',
          executable: true,
          device: false,
          actions: [
            {
              _id: ServerMissionAction.DEFAULT_PROPERTIES._id,
              name: 'New Action',
              description: '<p>Enter your description here.</p>',
              processTime: 5000,
              successChance: 0.5,
              resourceCost: 1,
              postExecutionSuccessText:
                '<p>Enter your successful post-execution message here.</p>',
              postExecutionFailureText:
                '<p>Enter your failed post-execution message here.</p>',
              effects: [],
            },
          ],
        },
        {
          _id: ServerMissionNode.DEFAULT_PROPERTIES._id,
          prototypeId: '5fff17d5-71c1-43d9-b58e-316e19f260cd',
          name: 'YAOGAN-36 (Data)',
          color: '#52b1ff',
          description: '<p>Unknown</p>',
          preExecutionText:
            '<p>YAOGAN-36 (Data) - Two Line Element Set (TLE): 1 54372U 22160A 23186.55133669 .00108949 00000-0 42295-2 0 9995 2 54372 34.9942 281.0301 0008014 20.3153 357.7082 15.24733845 33602</p>',
          executable: true,
          device: false,
          actions: [
            {
              _id: ServerMissionAction.DEFAULT_PROPERTIES._id,
              name: 'Exploit Data',
              description: '<p>Pull asset connection data.</p>',
              processTime: 10000,
              successChance: 1,
              resourceCost: 1,
              postExecutionSuccessText:
                '<p>Currently Connected: Chengdu GJ-2 (Wing Loong 2) - SPEED: 320 km/h - ALTITUDE: 28k MSL - LOCATION: 43° 30.1647′ N, 141° 05.6799′ E 目前连接：成都 GJ-2（翼龙 2） - 速度：320 km/h - 海拔：28k MSL - 位置：43°30.1647′N，141°05.6799′E Mùqián liánjiē: Chéngdū GJ-2(yì lóng 2) - sùdù:320 Km/h - hǎibá:28K MSL - wèizhì:43°30.1647′N,141°05.6799′E</p>',
              postExecutionFailureText:
                '<p>Error: 10295456 *** ACCESS BLOCKED ***</p>',
              effects: [],
            },
          ],
        },
        {
          _id: ServerMissionNode.DEFAULT_PROPERTIES._id,
          prototypeId: '0f52597c-bef7-4842-adb6-3712d429ecea',
          name: 'Chengdu GJ-2 (UAV)',
          color: '#b839ff',
          description: '<p>Wing Loong 2 (UAV, China)</p>',
          preExecutionText:
            '<p>Last Reported Data: Chengdu GJ-2 (Remotely Piloted Aircraft) - Current SPEED: 320 km/h - Current ALTITUDE: 28k MSL - Current LOCATION: 43° 30.1647′ N, 141° 05.6799′ E</p>',
          executable: true,
          device: false,
          actions: [
            {
              _id: ServerMissionAction.DEFAULT_PROPERTIES._id,
              name: 'Access Control Systems',
              description: '<p>Access UAV On-board Systems.</p>',
              processTime: 10000,
              successChance: 1,
              resourceCost: 5,
              postExecutionSuccessText:
                '<p>/// Access gained to UAV on-board systems. /// /// 获得无人机机载系统的访问权限。 /// /// Huòdé wú rén jī jī zǎi xìtǒng de fǎngwèn quánxiàn. ///</p>',
              postExecutionFailureText:
                '<p>Error: 10295456 *** Air Vehicle has rejected command. ***</p>',
              effects: [],
            },
          ],
        },
        {
          _id: ServerMissionNode.DEFAULT_PROPERTIES._id,
          prototypeId: 'cda2438e-27fb-433a-8355-8e4695dc1f15',
          name: 'Flight Controls',
          color: '#b839ff',
          description: '<p>Access air vehicle flight controls.</p>',

          preExecutionText: '',
          executable: true,
          device: true,
          actions: [
            {
              _id: ServerMissionAction.DEFAULT_PROPERTIES._id,
              name: 'Update Flight Command',
              description: '<p>Update Speed Control</p>',
              processTime: 10000,
              successChance: 1,
              resourceCost: 5,
              postExecutionSuccessText:
                '<p>/// Commanded Speed: 0 km/h (Confirmed) ///</p>',
              postExecutionFailureText:
                '<p>Error: 10295456 *** Air Vehicle has rejected command. ***</p>',
              effects: [],
            },
            {
              _id: ServerMissionAction.DEFAULT_PROPERTIES._id,
              name: 'New Action',
              description: '<p>Enter your description here.</p>',
              processTime: 5000,
              successChance: 0.5,
              resourceCost: 1,
              postExecutionSuccessText:
                '<p>Enter your successful post-execution message here.</p>',
              postExecutionFailureText:
                '<p>Enter your failed post-execution message here.</p>',
              effects: [],
            },
          ],
        },
        {
          _id: ServerMissionNode.DEFAULT_PROPERTIES._id,
          prototypeId: 'b6d2bb57-4533-490e-8ae0-14d99a7d446a',
          name: 'Access Controls',
          color: '#b839ff',
          description: '<p>Access air vehicle system lock-out.</p>',

          preExecutionText: '',
          executable: true,
          device: true,
          actions: [
            {
              _id: ServerMissionAction.DEFAULT_PROPERTIES._id,
              name: 'Lock System Controls',
              description: '<p>Lock UAV Access Controls</p>',
              processTime: 10000,
              successChance: 1,
              resourceCost: 1,
              postExecutionSuccessText:
                '<p>/// Air Vehicle Controls *LOCKED*, Executing Loss-of-Link Procedures. (Confirmed) ///</p>',
              postExecutionFailureText:
                '<p>Error: 10295456 *** Air Vehicle has rejected command. ***</p>',
              effects: [],
            },
            {
              _id: ServerMissionAction.DEFAULT_PROPERTIES._id,
              name: 'New Action',
              description: '<p>Enter your description here.</p>',
              processTime: 5000,
              successChance: 0.5,
              resourceCost: 1,
              postExecutionSuccessText:
                '<p>Enter your successful post-execution message here.</p>',
              postExecutionFailureText:
                '<p>Enter your failed post-execution message here.</p>',
              effects: [],
            },
          ],
        },
        {
          _id: ServerMissionNode.DEFAULT_PROPERTIES._id,
          prototypeId: '31305d00-8976-4496-8998-b52214d0b01d',
          name: 'Emergency Controls',
          color: '#b839ff',
          description: '<p>Execute Emergency Loss-of-Link.</p>',

          preExecutionText: '<p>UAV will execute loss-of-link protocol.</p>',
          executable: true,
          device: false,
          actions: [
            {
              _id: ServerMissionAction.DEFAULT_PROPERTIES._id,
              name: 'Force Loss-of-Link',
              description: '<p>UAV will execute loss-of-link protocol.</p>',
              processTime: 10000,
              successChance: 1,
              resourceCost: 1,
              postExecutionSuccessText:
                '<p>/// DESTRUCTION WARNING /// SYS MESSAGE: Forcing loss-of-link protocol will result in UAV self-destruction. *** CONFIRM ACTION *** /// 破坏警告 /// 系统消息：强制使用链路丢失协议将导致无人机自毁。 *** 确认操作 *** /// Pòhuài jǐnggào/// xìtǒng xiāoxī: Qiángzhì shǐyòng liàn lù diūshī xiéyì jiāng dǎozhì wú rén jī zì huǐ. *** Quèrèn cāozuò***</p>',
              postExecutionFailureText:
                '<p>Error: 10295456 *** Air Vehicle has rejected command. ***</p>',
              effects: [],
            },
          ],
        },
        {
          _id: ServerMissionNode.DEFAULT_PROPERTIES._id,
          prototypeId: '32fc6311-4241-4acd-97cd-89646e811e22',
          name: '*** WARNING ***',
          color: '#f9484f',
          description: '<p>*** CONFIRM ACTION ***</p>',

          preExecutionText: '<p>*** CONFIRM ACTION ***</p>',
          executable: true,
          device: true,
          actions: [
            {
              _id: ServerMissionAction.DEFAULT_PROPERTIES._id,
              name: 'Send Self-destruction Command',
              description: '<p>Enter your description here.</p>',
              processTime: 10000,
              successChance: 1,
              resourceCost: 1,
              postExecutionSuccessText:
                '<p>/// UAV HAS RECIEVED SELF-DESTRUCTION COMMAND /// SYS MESSAGE: Connection to UAV (Chengdu GJ-2) has terminated. /// 无人机已收到自毁命令 /// 系统消息：与无人机（成都 GJ-2）的连接已终止。 /// Wú rén jī yǐ shōu dào zì huǐ mìnglìng/// xìtǒng xiāoxī: Yǔ wú rén jī (chéngdū GJ-2) de liánjiē yǐ zhōngzhǐ.</p>',
              postExecutionFailureText:
                '<p>Error: 10295456 *** Air Vehicle has rejected command. ***</p>',
              effects: [],
            },
          ],
        },
      ],
    },
  ],
  prototypes: [
    {
      _id: 'f0be8f94-82ad-4e90-8a3d-65d2380a7c49',
      structureKey: '882d6985-a05c-4f36-b66b-92de27d34552',
      depthPadding: ServerMissionPrototype.DEFAULT_PROPERTIES.depthPadding,
    },
    {
      _id: '77429f3a-6187-4793-b4fc-ee2f626b1787',
      structureKey: '405b84dc-a653-47ed-8d88-aef3177a99b2',
      depthPadding: ServerMissionPrototype.DEFAULT_PROPERTIES.depthPadding,
    },
    {
      _id: 'f6ae948d-c81a-4719-b373-c6c7ccec09b0',
      structureKey: '315605d0-3210-4644-8903-d254151769e2',
      depthPadding: ServerMissionPrototype.DEFAULT_PROPERTIES.depthPadding,
    },
    {
      _id: '6d7913d0-f6d6-40e8-b203-4c8553dcc6e0',
      structureKey: '51f256b3-614c-4f9a-80f3-3d020a758cd7',
      depthPadding: ServerMissionPrototype.DEFAULT_PROPERTIES.depthPadding,
    },
    {
      _id: 'b1cdcf5b-1571-4178-ab5e-bf1672462c9f',
      structureKey: '2d69024c-9cc4-40bd-ab84-1d7761abe810',
      depthPadding: ServerMissionPrototype.DEFAULT_PROPERTIES.depthPadding,
    },
    {
      _id: 'e29df0b8-7093-47d5-a6c2-cda4861c9ee3',
      structureKey: 'd4bf672b-1490-4246-92c5-69e31d2714b5',
      depthPadding: ServerMissionPrototype.DEFAULT_PROPERTIES.depthPadding,
    },
    {
      _id: 'b47d9081-9ea5-4540-8d8b-67eaa28fe1d0',
      structureKey: 'afa6923d-875f-4dbe-b724-3c908deb853b',
      depthPadding: ServerMissionPrototype.DEFAULT_PROPERTIES.depthPadding,
    },
    {
      _id: '70effa5f-412b-4756-9fcb-b07dd7d9b50e',
      structureKey: '339e1633-34cc-488f-abee-61ec1f21f0dd',
      depthPadding: ServerMissionPrototype.DEFAULT_PROPERTIES.depthPadding,
    },
    {
      _id: 'fc95ead3-f930-4f37-ac40-6dab33b41698',
      structureKey: '6185ea46-de8b-4308-aec3-e257313563af',
      depthPadding: ServerMissionPrototype.DEFAULT_PROPERTIES.depthPadding,
    },
    {
      _id: '702e2bfd-dd98-4806-a938-639725290577',
      structureKey: 'e25eb328-d98a-4215-a1a2-e854137e9209',
      depthPadding: ServerMissionPrototype.DEFAULT_PROPERTIES.depthPadding,
    },
    {
      _id: 'f44309a6-6853-47a4-b2a3-daa76865c3bf',
      structureKey: 'cb7c666e-4ac3-4c6c-8dcd-c8c4d383ce65',
      depthPadding: ServerMissionPrototype.DEFAULT_PROPERTIES.depthPadding,
    },
    {
      _id: '621f6ecd-6cf8-4e94-80bf-dffbde8a2a96',
      structureKey: 'e1ef9397-f480-4f06-8c0b-afcf1ace7f69',
      depthPadding: ServerMissionPrototype.DEFAULT_PROPERTIES.depthPadding,
    },
    {
      _id: 'aba76dd8-083d-4fb0-a469-587a89555d6a',
      structureKey: '096fa5e6-d25a-4b86-a618-a8ab854d9b12',
      depthPadding: ServerMissionPrototype.DEFAULT_PROPERTIES.depthPadding,
    },
    {
      _id: 'bf75dfc9-ab88-4ce2-a5aa-4861c1f797f0',
      structureKey: '36ed93ea-a7ef-445e-b1a2-d068681ebca4',
      depthPadding: ServerMissionPrototype.DEFAULT_PROPERTIES.depthPadding,
    },
    {
      _id: '7f41635e-5b64-4b84-8da3-b3f0a5fdb990',
      structureKey: '05b4b9e6-2f46-4ce0-adf4-d1d846c650da',
      depthPadding: ServerMissionPrototype.DEFAULT_PROPERTIES.depthPadding,
    },
    {
      _id: '6c6d78a0-5b67-49a1-928c-79dce43fe253',
      structureKey: '152811b3-e125-4cae-b4e4-06a5842b403c',
      depthPadding: ServerMissionPrototype.DEFAULT_PROPERTIES.depthPadding,
    },
    {
      _id: '530caa0b-86c7-4fc6-ba20-187176ab06c8',
      structureKey: '1c97200f-69d6-4546-b99e-6cd0a11ae0a4',
      depthPadding: ServerMissionPrototype.DEFAULT_PROPERTIES.depthPadding,
    },
    {
      _id: '163279da-c5ca-464b-af42-279a25ac55c0',
      structureKey: 'b6220969-160d-4339-8a96-b5c632422ffa',
      depthPadding: ServerMissionPrototype.DEFAULT_PROPERTIES.depthPadding,
    },
    {
      _id: '00c6c255-3a0d-494b-8ed3-351a866cbd42',
      structureKey: '0d0ad493-346c-4096-80e3-f8bc7b21f535',
      depthPadding: ServerMissionPrototype.DEFAULT_PROPERTIES.depthPadding,
    },
    {
      _id: 'b6b9aa31-5aaa-4bd0-8578-cebf09175d12',
      structureKey: 'a8bbd3c1-b050-40cc-932a-5b642e9e5d37',
      depthPadding: ServerMissionPrototype.DEFAULT_PROPERTIES.depthPadding,
    },
    {
      _id: 'ac205391-73cc-4220-8bae-6b8214d04a28',
      structureKey: '71eb8dd1-1104-481b-baf0-a4850c58ebc7',
      depthPadding: ServerMissionPrototype.DEFAULT_PROPERTIES.depthPadding,
    },
    {
      _id: '2c2ca5c7-1cef-4440-ab0d-7af83b09c341',
      structureKey: '7344d4d7-2a9b-4b99-ad2a-4dd353a3bd49',
      depthPadding: ServerMissionPrototype.DEFAULT_PROPERTIES.depthPadding,
    },
    {
      _id: 'eef4bf51-4ba9-4065-b584-b4a3fcad28ef',
      structureKey: 'c3b45b64-160d-4fca-a0bf-10fc8740ea21',
      depthPadding: ServerMissionPrototype.DEFAULT_PROPERTIES.depthPadding,
    },
    {
      _id: '6fcec8cb-0485-4e78-b6b2-804b041c5a80',
      structureKey: 'c3a94935-578b-42a1-9fc1-7878fe24fb6d',
      depthPadding: ServerMissionPrototype.DEFAULT_PROPERTIES.depthPadding,
    },
    {
      _id: '198984b2-bd37-4426-8929-970677187591',
      structureKey: 'ae6b07fb-9f36-4eeb-9dbd-e579e8eb7f5d',
      depthPadding: ServerMissionPrototype.DEFAULT_PROPERTIES.depthPadding,
    },
    {
      _id: '5fff17d5-71c1-43d9-b58e-316e19f260cd',
      structureKey: '60acf5d1-3467-462c-816c-bcb2e5c2b8e0',
      depthPadding: ServerMissionPrototype.DEFAULT_PROPERTIES.depthPadding,
    },
    {
      _id: '0f52597c-bef7-4842-adb6-3712d429ecea',
      structureKey: '26f3833d-45cf-4860-ac97-edd8ef877d3c',
      depthPadding: ServerMissionPrototype.DEFAULT_PROPERTIES.depthPadding,
    },
    {
      _id: 'cda2438e-27fb-433a-8355-8e4695dc1f15',
      structureKey: '3bca4ca3-4a5b-4518-bc7a-0f2c8d9b1999',
      depthPadding: ServerMissionPrototype.DEFAULT_PROPERTIES.depthPadding,
    },
    {
      _id: 'b6d2bb57-4533-490e-8ae0-14d99a7d446a',
      structureKey: 'a6a31b1c-7be6-4a71-81c1-1ffa88ed3711',
      depthPadding: ServerMissionPrototype.DEFAULT_PROPERTIES.depthPadding,
    },
    {
      _id: '31305d00-8976-4496-8998-b52214d0b01d',
      structureKey: 'e398028a-1f87-4d58-bf69-b949ef176cf6',
      depthPadding: ServerMissionPrototype.DEFAULT_PROPERTIES.depthPadding,
    },
    {
      _id: '32fc6311-4241-4acd-97cd-89646e811e22',
      structureKey: 'd04326e3-491b-479a-9f22-d4f49703f8de',
      depthPadding: ServerMissionPrototype.DEFAULT_PROPERTIES.depthPadding,
    },
  ],
}
