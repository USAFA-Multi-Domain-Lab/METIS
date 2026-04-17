import readline from 'readline'

/**
 * Prompts user for input with a yes/no question.
 * @param question - The question to ask.
 * @param defaultToYes - Whether the default answer is yes.
 * @returns True if user answered yes, false otherwise.
 */
export function promptYesNo(
  question: string,
  defaultToYes: boolean = false,
): Promise<boolean> {
  let readlineInterface = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    let suffix = defaultToYes ? '(Y/n)' : '(y/N)'
    readlineInterface.question(`${question} ${suffix}: `, (answer) => {
      readlineInterface.close()
      let normalized = answer.trim().toLowerCase()
      if (normalized === '') {
        resolve(defaultToYes)
      } else {
        resolve(normalized === 'y' || normalized === 'yes')
      }
    })
  })
}
