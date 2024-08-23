export default function loader({ src, width, quality }) {
  const url = new URL(src);
  url.searchParams.set('w', width.toString());
  url.searchParams.set('q', (quality || 'auto').toString());
  url.searchParams.set('f', 'auto');
  return url.toString();
}
