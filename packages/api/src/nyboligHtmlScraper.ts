import '@dotenvx/dotenvx/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { ofetch } from 'ofetch'
import { drizzle } from 'drizzle-orm/node-postgres'
import { addressesTable, listingsTable, listingTypesTable, scrapedListingsTable } from './db/schema.js'
import { and, eq, isNull, sql, sum } from 'drizzle-orm'
import * as schema from './db/schema.js'
import { HTMLRewriter } from 'htmlrewriter'

export async function scrapeListing(url: string) {
  const rewriter = new HTMLRewriter()

  const response = await fetch(url)

  const images: string[] = []

  rewriter.on('#hero-slider-photo img', {
    element: (el) => {
      //   console.log('src', el.getAttribute('src'))

      const src = el.getAttribute('src')
      if (src) {
        images.push(src)
      }
    },
  })

  const floorplanImages: string[] = []

  rewriter.on('#hero-slider-floorplan img', {
    element: (el) => {
      const src = el.getAttribute('src')
      if (src) {
        floorplanImages.push(src)
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
    element: (el) => {
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
    element: (el) => {
      caseFactsTitle = ''
    },

    text: ({ text, lastInTextNode }) => {
      caseFactsTitle += text
      // if (lastInTextNode) {
      //   caseFactsTitle = caseFactsTitle.replace(/&#230;/g, 'æ')
      //   caseFactsTitle = caseFactsTitle.replace(/&#248;/g, 'ø')
      //   caseFactsTitle = caseFactsTitle.replace(/&#229;/g, 'å')
      //   caseFactsTitle = caseFactsTitle.replace(/&#198;/g, 'Æ')
      //   caseFactsTitle = caseFactsTitle.replace(/&#216;/g, 'Ø')
      //   caseFactsTitle = caseFactsTitle.replace(/&#197;/g, 'Å')
      //   caseFactsTitle = caseFactsTitle.replace/&sup2;/g, '²')
      // }
    },
  })

  rewriter.on('.case-facts__box-inner-wrap :nth-child(2) ', {
    element: (el) => {
      caseFactsValue = ''
    },

    text: ({ text, lastInTextNode }) => {
      caseFactsValue += text
      if (lastInTextNode) {
        caseFacts[caseFactsTitle] = caseFactsValue
      }
    },
  })

  const _text = await rewriter.transform(response).text()

  const areaFloor = caseFacts?.['Boligareal: '] ?? null
  const rooms =
    caseFacts?.['Stue/V&#230;relser: ']
      ?.split('/')
      .map(Number)
      .reduce((acc, val) => acc + val, 0) ?? 0
  
  const yearBuilt = caseFacts?.['Bygge&#229;r: '] ?? null

  return {
    //images,
    title,
    description,
    //floorplanImages,
    type,
    price: Number(price.replace(/\D/g, '')),
    caseFacts,
    areaFloor: Number(areaFloor?.split(' ')[0].replace(/\D/g, '') ?? 0),
    rooms,
  }
}
