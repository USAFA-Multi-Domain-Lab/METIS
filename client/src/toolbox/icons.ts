const iconGlob: Record<string, string> = import.meta.glob(
  '../assets/images/icons/*.svg',
  {
    eager: true,
    import: 'default',
  },
)
const iconPaths = Object.fromEntries(
  Object.entries(iconGlob).map(([key, value]) => [
    key.match(/([^/]+)(?=\.svg$)/)?.[0] as TMetisIcon,
    value,
  ]),
) as Record<TMetisIcon, string>

console.log(iconPaths)

export function getIconPath(icon: TMetisIcon): string {
  let path = iconPaths[icon]

  if (!path) {
    console.warn(`Path for icon "${icon}" could not be found.`)
    return ''
  }
  return path
}
