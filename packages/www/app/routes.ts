import { type RouteConfig, index, route } from '@react-router/dev/routes'

export default [
  index('routes/home.tsx'),
  route('boliger', 'routes/listings.tsx'),
  route('bolig/:slug', 'routes/listing.tsx'),
] satisfies RouteConfig
