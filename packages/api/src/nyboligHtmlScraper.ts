import '@dotenvx/dotenvx/config'
import { HTMLRewriter } from 'htmlrewriter'

export async function scrapeListing(url: string) {
  const rewriter = new HTMLRewriter()

  const response = await fetch(url)

  const images: { src: string; alt: string | null }[] = []

  rewriter.on('#hero-slider-photo img', {
    element: (el) => {
      const src = el.getAttribute('src')
      const alt = el.getAttribute('alt')

      if (src) {
        images.push({ src, alt })
      }
    },
  })

  const floorplanImages: { src: string; alt: string | null }[] = []

  rewriter.on('#hero-slider-floorplan img', {
    element: (el) => {
      const src = el.getAttribute('src')
      const alt = el.getAttribute('alt')

      if (src) {
        floorplanImages.push({ src, alt })
      }
    },
  })

  let title = ''

  rewriter.on('h2.case-facts__title', {
    text: ({ text }) => {
      title += text
    },
  })

  let description = ''

  rewriter.on('div.wysiwyg.foldable-spot__container p', {
    text: ({ text }) => {
      description += text
    },
  })

  rewriter.on('div.wysiwyg.foldable-spot__container p br', {
    element: () => {
      description += '<br>'
    },
  })

  let type = ''

  rewriter.on('.case-facts__box-title__type', {
    text: ({ text }) => {
      type += text
    },
  })

  let price = ''

  rewriter.on('.case-facts__box-title__price', {
    text: ({ text }) => {
      price += text
    },
  })

  const caseFacts: Record<string, string | null> = {}
  let caseFactsTitle = ''
  let caseFactsValue = ''

  rewriter.on('.case-facts__box-inner-wrap span:first-child ', {
    element: () => {
      caseFactsTitle = ''
    },

    text: ({ text }) => {
      caseFactsTitle += text
    },
  })

  rewriter.on('.case-facts__box-inner-wrap :nth-child(2) ', {
    element: () => {
      caseFactsValue = ''
    },

    text: ({ text, lastInTextNode }) => {
      caseFactsValue += text
      if (lastInTextNode) {
        caseFacts[caseFactsTitle] = caseFactsValue
      }
    },
  })

  let energyClass: string | null = null
  rewriter.on('.case-facts__box-inner-wrap .tile__rating', {
    element: (el) => {
      const className = el.getAttribute('class')
      if (className) {
        energyClass = className.replace('tile__rating -rated-', '')
      }
    },
  })

  const _text = await rewriter.transform(response).text()

  const areaFloor = caseFacts?.['Boligareal: '] ?? null
  const bedrooms = Number(caseFacts?.['Stue/V&#230;relser: ']?.split('/')[1] ?? 0)
  const rooms =
    caseFacts?.['Stue/V&#230;relser: ']
      ?.split('/')
      .map(Number)
      .reduce((acc, val) => acc + val, 0) ?? 0

  const yearBuilt = caseFacts?.['Bygget/Ombygget: ']?.split('/')[0] ?? null
  const yearRenovated = caseFacts?.['Bygget/Ombygget: ']?.split('/')?.[1] ?? null

  const areaLand = caseFacts?.['Grundst&#248;rrelse: '] ?? null

  return {
    images,
    title,
    description,
    floorplanImages,
    type,
    price: Number(price.replace(/\D/g, '')),
    areaFloor: Number(areaFloor?.split(' ')[0].replace(/\D/g, '') ?? 0),
    rooms,
    bedrooms,
    yearBuilt: yearBuilt ? Number(yearBuilt) : null,
    yearRenovated: yearRenovated ? Number(yearRenovated) : null,
    areaLand: Number(areaLand?.split(' ')[0].replace(/\D/g, '') ?? 0),
    energyClass,
  }
}
