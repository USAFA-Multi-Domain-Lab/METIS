import React from 'react'
import './MissionMap.scss'
import ConsoleOutput from './ConsoleOutput'
import { Component, useState } from 'react'
import { useStore } from 'react-context-hook'

const MissionMap = () => {
  const [consoleOutputs, setConsoleOutputs] =
    useStore<Array<{ date: number; value: string }>>('consoleOutputs')

  const user = 'Jacob'

  const Scroll = () => {
    // This keeps the terminal at the bottom with the history above it
    const BorderBox = document.querySelector('.BorderBox')
    BorderBox?.scrollTo(0, 10000000000000000)
  }

  const Communication = () => {
    setConsoleOutputs([
      ...consoleOutputs,
      {
        date: Date.now(),
        value: `<span class='line-cursor'>${user}@USAFA: </span>
        <span class='communication'>Communication</span>
        has been executed.`,
      },
    ])
  }

  const Infrastructure = () => {
    setConsoleOutputs([
      ...consoleOutputs,
      {
        date: Date.now(),
        value: `<span class='line-cursor'>${user}@USAFA: </span>
        <span class='infrastructure'>Infrastructure</span>
        has been executed.`,
      },
    ])
  }

  const SatelliteServices = () => {
    setConsoleOutputs([
      ...consoleOutputs,
      {
        date: Date.now(),
        value: `<span class='line-cursor'>${user}@USAFA: </span>
        <span class='satellite-services'>Satellite Services</span>
        has been executed.`,
      },
    ])
  }

  // Renders HTML elements
  return (
    <div className='MissionMap'>
      <div className='Nodes'>
        <button className='communication' onClick={Communication}>
          COMMUNICATION
        </button>
        <button className='infrastructure' onClick={Infrastructure}>
          INFRASTRUCTURE
        </button>
        <button className='satellite-services' onClick={SatelliteServices}>
          SATELLITE SERVICES
        </button>
      </div>
    </div>
  )
}

export default MissionMap
