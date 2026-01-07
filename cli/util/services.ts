import { execSync } from 'child_process'

/**
 * Executes commands to manage METIS as a system service in
 * an OS-specific manner.
 * @param command - The desired command to send to the service
 * manager (start|stop|restart|status)
 */
export function manageMetisService(command: TServiceCommand): void {
  const windowsCommandMap = {
    start: 'Start-Service',
    stop: 'Stop-Service',
    restart: 'Restart-Service',
    status: 'Get-Service',
  }

  try {
    let commandLineCode = ''

    // Windows
    if (process.platform === 'win32') {
      commandLineCode = `powershell -NoProfile -Command "${windowsCommandMap[command]} METIS"`
    }
    // Unix
    else {
      commandLineCode = `sudo systemctl ${command} metis.service`
      console.log(
        'Executing command with sudo privileges. You may be prompted for your system password.',
      )
    }

    execSync(commandLineCode, { stdio: 'inherit' })
  } catch (err) {
    throw new Error(`Failed to execute service command "${command}".`)
  }
}

/* -- TYPES -- */

/**
 * Defines a valid command for managing METIS as a service.
 */
export type TServiceCommand = 'start' | 'stop' | 'restart' | 'status'
