import { Link } from 'react-router'
import { Button } from '~/components/ui/button'

export function Welcome() {
  return (
    <main className="flex items-center justify-center pt-32 pb-4">
      <div className="flex-1 flex flex-col items-center gap-16 min-h-0">
        <div className="max-w-[450px] w-full px-4 grid gap-6">
          <div className="text-9xl text-center">🏗️</div>
          <h1 className="text-4xl font-bold text-center">Her bygger vi Boki 🔨</h1>
          <h2 className="text-lg text-center">Boki samler boliger fra hele landet og hjælper dig med at finde din næste bolig</h2>
          <Link to="/boliger" className="text-center text-lg font-semibold text-blue-600 hover:underline">
            <Button className="w-full">Se boliger</Button>
          </Link>
        </div>
      </div>
    </main>
  )
}
