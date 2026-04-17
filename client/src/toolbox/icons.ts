const icons = import.meta.glob('../assets/images/icons/**/*.svg', {
  eager: true,
  import: 'default',
}) as Record<string, string>

export function getIconPath(icon: TMetisIcon): string {
  return icons[`../assets/images/icons/${icon}.svg`]
}
