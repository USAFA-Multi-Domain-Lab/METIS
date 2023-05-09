export {}

import fs from 'fs'

function doSomething(): void {
  try {
    throw Error('This is an error')
  } catch (error: any) {
    console.log('level 2')
    console.error(error)
    throw error
  }
}

// try {
//   fs.readFileSync('test.txt')
// } catch (error: any) {
//   console.log('hi')
// }

// try {
doSomething()
// } catch (error: any) {
//   console.log('level 1')
//   console.error(error)
// }

while (true) {}
