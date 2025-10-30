export function getIconPath(icon: TMetisIcon): string {
  return new URL(`../assets/images/icons/${icon}.svg`, import.meta.url).href
}
