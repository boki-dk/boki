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
    element: (el: any) => {
      //   console.log('src', el.getAttribute('src'))
      images.push(el.getAttribute('src'))
    },
  })
  const _text = await rewriter.transform(response).text()
  return images
}
