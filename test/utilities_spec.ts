// npm imports
import mocha from 'mocha'
import chai from 'chai'
import node from 'ts-node'

let expect = require('chai').expect
let gatherNamesOf = require('../utilities.ts')

describe('gatherNamesOf', function () {
  let people: any, names: any

  beforeEach(function () {
    people = [{ name: 'Günter' }, { name: 'Marceline' }, { name: 'Simon' }]
    names = gatherNamesOf(people)
  })

  it('should return an array', function () {
    expect(names).to.be.an('array')
  })

  it('should give me output the same length as the input', function () {
    expect(names.length).to.equal(people.length)
  })

  it('should give me the name of the object passed in', function () {
    expect(names[0]).to.equal(people[0].name)
  })
})
