const MAX_BLOG_LABELS = 10;
const MAX_BLOG_LABEL_LENGTH = 40;

export function getBlogLabels(value: unknown): string[] {
  const labels = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : [];

  const seen = new Set<string>();

  return labels
    .map(label => (typeof label === 'string' ? label.trim() : ''))
    .filter(label => {
      const normalizedLabel = label.toLocaleLowerCase();

      if (!label || seen.has(normalizedLabel)) {
        return false;
      }

      seen.add(normalizedLabel);
      return true;
    });
}

export function parseBlogLabels(value: string): string[] {
  return getBlogLabels(value)
    .slice(0, MAX_BLOG_LABELS)
    .map(label => label.slice(0, MAX_BLOG_LABEL_LENGTH));
}
