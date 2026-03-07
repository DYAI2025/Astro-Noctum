'use client'

import dynamic from 'next/dynamic'

const CelestialOrrery = dynamic(
  () => import('../components/CelestialOrrery'),
  { ssr: false }
)

export default function Home() {
  return <CelestialOrrery />
}
