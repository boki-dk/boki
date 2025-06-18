import { useState } from 'react'
import { Image } from '~/components/Image'
import { cn } from '~/lib/utils'

// i'm not sure of the rendering order of the modal. like will the modal be rendered before the image is clicked?

export function ImageEnlargable({
  src,
  alt,
  className,
  lgSrc,
  lgWidth,
  lgHeight,
  ...props
}: {
  src?: string
  alt?: string
  lgSrc: string
  className?: string
  lgWidth?: number
  lgHeight?: number
} & React.ImgHTMLAttributes<HTMLImageElement>) {
  const [showModal, setShowModal] = useState(false)

  const openModal = () => {
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
  }

  if (!src) {
    src = lgSrc
  }

  return (
    <>
      <Image src={src} alt={alt} className={cn(className, 'cursor-pointer')} onClick={openModal} {...props} />

      {showModal && (
        <div onClick={closeModal}>
          <div className="relative" onClick={closeModal}>
            <Image src={lgSrc} alt={alt} className="max-h-250 max-w-250" />
          </div>
        </div>
      )}
    </>
  )
}
