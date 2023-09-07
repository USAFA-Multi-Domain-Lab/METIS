// ** interfaces ** //
// Script: used for loading javascript after mount
export interface Script {
  name: string
  lib: boolean
}
export interface Style {
  name: string
  lib: boolean
}
// takes a script and determines the src to fetch from server
export function getSrcScript(script: Script): string {
  return `/js/${script.lib ? 'libs/' : ''}${script.name}.js`
}
export function getHrefStyle(style: Style): string {
  return `/css/${style.lib ? 'libs/' : ''}${style.name}.css`
}
