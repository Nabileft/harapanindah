import { DaftarFitur } from '../fitur/DaftarFitur'
import { HeroHeader } from './components/HeroHeader'
import { Sapaan } from './components/Sapaan'

export function DashboardPage() {
  return (
    <>
      <Sapaan />
      {/* layout="fullscreen": foto memenuhi layar. Ganti ke "framed" untuk foto utuh di tengah. */}
      <HeroHeader layout="fullscreen" />
      <DaftarFitur />
    </>
  )
}
