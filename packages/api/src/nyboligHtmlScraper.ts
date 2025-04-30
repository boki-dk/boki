import '@dotenvx/dotenvx/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { ofetch } from 'ofetch'
import { drizzle } from 'drizzle-orm/node-postgres'
import { addressesTable, listingsTable, listingTypesTable, scrapedListingsTable } from './db/schema.js'
import { and, eq, isNull, sql } from 'drizzle-orm'
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

  const _text = await rewriter.transform(response).text()

  return { images, title, description }
}
