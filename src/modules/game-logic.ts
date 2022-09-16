import missions, { createTestMission } from './missions'

// console.log(createTestMission())
let parentNodes = createTestMission().nodeStructure
// console.log(parentNodes)
for (let key in parentNodes) {
  let parentNode = key
  console.log(parentNode)
}

// let defaultNodes = Object.keys(Mission)
// console.log(defaultNodes)

// { ...createTestMission().nodeStructure }
// console.log(mission)
