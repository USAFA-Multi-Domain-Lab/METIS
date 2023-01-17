//npm imports
import express from 'express'

function titleCase(title: string) {
  let titleArray = title.split(' ')
  let newTitleArray: Array<string> = []
  titleArray.forEach((word: string) => {
    let newWord = word[0].toUpperCase() + word.slice(1)
    newTitleArray.push(newWord)
  })
  let newTitle = newTitleArray.join(' ')
  return newTitle
}

module.exports = titleCase
