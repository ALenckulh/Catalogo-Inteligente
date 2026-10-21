import { Hero } from './_components/Hero'
import { About } from './_components/About'
import { ScoringEngine } from './_components/ScoringEngine'
import { ModelsTable } from './_components/ModelsTable'
import { Timeline } from './_components/Timeline'
import { Footer } from './_components/Footer'

export default function Home() {
  return (
    <>
      <a href="#main-content" className="skip-link">
        Pular para o conteúdo
      </a>
      <main id="main-content">
        <Hero />
        <About />
        <ScoringEngine />
        <ModelsTable />
        <Timeline />
      </main>
      <Footer />
    </>
  )
}
