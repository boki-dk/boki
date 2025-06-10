import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router'

import type { Route } from './+types/root'
import './app.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Header } from './components/Header'
import { Footer } from './components/Footer'

export const links: Route.LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap',
  },
]

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <link
  rel="icon"
  type="image/svg+xml"
  href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cdefs%3E%3ClinearGradient id='myGradient' x1='0%25' y1='0%25' x2='100%25' y2='0%25'%3E%3Cstop offset='0%25' style='stop-color:%23ff23de;' /%3E%3Cstop offset='14.28%25' style='stop-color:%23ff00c3;' /%3E%3Cstop offset='28.56%25' style='stop-color:%23ff00a6;' /%3E%3Cstop offset='42.84%25' style='stop-color:%23ff0088;' /%3E%3Cstop offset='57.12%25' style='stop-color:%23ff006a;' /%3E%3Cstop offset='71.4%25' style='stop-color:%23ff004c;' /%3E%3Cstop offset='85.68%25' style='stop-color:%23ff002e;' /%3E%3Cstop offset='100%25' style='stop-color:%23ff0000;' /%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath fill='url(%23myGradient)' d='M19.31 18.9c.44-.69.69-1.52.69-2.4c0-2.5-2-4.5-4.5-4.5S11 14 11 16.5s2 4.5 4.5 4.5c.87 0 1.69-.25 2.38-.68L21 23.39L22.39 22zm-3.81.1a2.5 2.5 0 0 1 0-5a2.5 2.5 0 0 1 0 5M5 20v-8H2l10-9l10 9h-1.82c-1.18-1.23-2.84-2-4.68-2c-3.58 0-6.5 2.92-6.5 6.5c0 1.29.38 2.5 1.03 3.5z' stroke-width='0.7' stroke='%23fbf7f7'/%3E%3C/svg%3E"
  />
  </head>
      <body>
        <Header />
        {children}
        <Footer />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  )
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = 'Oops!'
  let details = 'An unexpected error occurred.'
  let stack: string | undefined

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : 'Error'
    details = error.status === 404 ? 'The requested page could not be found.' : error.statusText || details
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message
    stack = error.stack
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  )
}
