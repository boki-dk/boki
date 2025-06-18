import { useState } from 'react'
import { Image } from '~/components/Image'

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
    <div className="overflow-visible">
      <div onClick={openModal}>
        <Image src={src} />
      </div>
      {showModal && (
        <div onClick={closeModal}>
          <Image src="https://placehold.co/600x400/orange/white" alt={alt} onClick={closeModal} />
          <button className="absolute top-2 right-2 text-white">X</button>
        </div>
      )}
    </div>
  )
}
