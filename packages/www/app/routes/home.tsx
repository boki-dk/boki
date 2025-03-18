import type { Route } from './+types/home'
import { Welcome } from '../welcome/welcome'

export function meta({}: Route.MetaArgs) {
  return [{ title: 'Boki' }, { name: 'description', content: 'Find dit næste hjem med Boki' }]
}

export default function Home() {
  return <Welcome />
}
