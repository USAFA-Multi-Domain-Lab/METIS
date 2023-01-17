//npm imports
import express from 'express'

function gatherNamesOf(arrayOfPeople: Array<any>) {
  return arrayOfPeople.map(function (person: any) {
    return person.name
  })
}

module.exports = gatherNamesOf
