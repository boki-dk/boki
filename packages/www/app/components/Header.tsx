import { NavLink } from 'react-router'
import { Icon } from '@iconify/react'

export function Header() {
  return (
    <header className="flex items-center justify-start gap-16 px-4 md:px-8 lg:px-12 py-4 md:py-6 max-w-8xl mx-auto">
      <NavLink
        to="/"
        className="text-3xl font-semibold bg-gradient-to-r from-pink-500 to-red-500 text-transparent bg-clip-text hover:scale-x-105 scale-y-90 transition-transform duration-500 ease-in-out"
      >
        Boki
      </NavLink>
      <nav>
        <ul className="flex gap-4">
          <li>
            <NavLink to="/boliger" className="flex items-center gap-2 hover:text-pink-700 transition-colors duration-200 ease-in-out">
              <Icon icon="mdi:search" />
              Find boliger
            </NavLink>
          </li>
        </ul>
      </nav>
    </header>
  )
}
