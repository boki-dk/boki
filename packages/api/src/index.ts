import { serve } from '@hono/node-server'
import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get('/about', (c) => {
  return c.text('About page')
})

app.get('/listings/:listingId', (c) => {
  const l = c.req.param('listingId')
  return c.text(`Listing ${l}`)
})

app.get('/listings/:listingId/edit', (c) => {
  const l = c.req.param('listingId')
  return c.text(`Edit listing ${l}`)
})

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`)
  },
)
