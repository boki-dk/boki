export function Image({ src, alt, className, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { src: string; alt?: string }) {
  const transformedSrc = new URL('https://images.boki.dk')
  transformedSrc.searchParams.set('url', src)
  transformedSrc.searchParams.set('output', 'webp')
  transformedSrc.searchParams.set('q', '80')
  transformedSrc.searchParams.set('fit', 'cover')

  if (props.width) {
    transformedSrc.searchParams.set('w', String(props.width))
  }
  if (props.height) {
    transformedSrc.searchParams.set('h', String(props.height))
  }

  return (
    <img
      src={transformedSrc.href}
      alt={alt}
      className={className}
      srcSet={props.width || props.height ? `${transformedSrc.href} 1x, ${transformedSrc.href}&dpr=2 2x` : undefined}
      {...props}
    />
  )
}
