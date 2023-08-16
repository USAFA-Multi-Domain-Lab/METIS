// enum EGameUpdateType {
//   Open = 'open',
//   Execute = 'execute',
// }
//
// interface IGameUpdateChanges {
//   [EGameUpdateType.Open]: {
//     a: number
//     b: string
//   },
//   [EGameUpdateType.Execute]: {
//     a: boolean
//     c: Array<number>
//   },
// }
//
//
// export interface IGameUpdate<T extends EGameUpdateType> {
//   type: T
//   changes: IGameUpdateChanges<IGameUpdateChanges[keyof EGameUpdateType]>
// }

async function doSomething(): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    let number = 1000 + Math.random() * 1000
    resolve(number)
  })
}

async function doSomethingElse(): Promise<void> {
  try {
    let number: number = await doSomething()

    let secondNumber: number = number + 200

    console.log(secondNumber)
  } catch (error: any) {}
}

doSomethingElse()
