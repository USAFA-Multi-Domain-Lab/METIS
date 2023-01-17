// npm imports
import mocha from 'mocha'
import chai from 'chai'
import node from 'ts-node'

let expect = require('chai').expect
let titleCase = require('../textUtilities')

describe('titleCase', function () {
  it('should return a string', function () {
    expect(titleCase('the great mouse detective')).to.be.a('string')
  })

  it('should be capitalized', function () {
    expect(titleCase('the great mouse detective')).to.equal(
      'The Great Mouse Detective',
    )
  })
})
