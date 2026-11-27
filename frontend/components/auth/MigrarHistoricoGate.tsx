'use client'

import { useState, useSyncExternalStore } from 'react'
import { migrarHistorico } from '@/lib/api/auth'
import { USE_MOCK } from '@/lib/api/config'
import { encerrarSessao, esquecerVisitante, readVisitanteId } from '@/lib/api/visitanteId'
import { useCurrentUser } from '@/lib/contexts/CurrentUser/CurrentUserContext'
import { Button, Modal, Typography } from '@/components/ui'

const { Paragraph } = Typography
const PENDING_KEY = 'ci_migrar_pending'

function subscribe(): () => void {
  return () => undefined
}

function useMounted(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false)
}

function shouldPromptMigrar(isAuthenticated: boolean, loading: boolean): boolean {
  if (loading || USE_MOCK || !isAuthenticated) return false
  try {
    if (sessionStorage.getItem(PENDING_KEY) !== '1') return false
    return readVisitanteId() !== null
  } catch {
    return false
  }
}

/**
 * Depois do login/cadastro, se havia navegação anônima, pergunta se a pessoa quer levar esse histórico
 * para a conta (consentimento). A resposta vai para POST /api/auth/migrar-historico.
 */
export function MigrarHistoricoGate() {
  const { isAuthenticated, loading } = useCurrentUser()
  const mounted = useMounted()
  const [dismissed, setDismissed] = useState(false)
  const [busy, setBusy] = useState(false)

  const open = mounted && !dismissed && shouldPromptMigrar(isAuthenticated, loading)

  async function responder(aceitar: boolean) {
    setBusy(true)
    try {
      await migrarHistorico(aceitar)
      // Recusou: o histórico foi descartado, e o próximo evento é de outro visitante.
      if (!aceitar) esquecerVisitante()
    } catch {
      // Não respondeu de verdade: pergunta de novo no próximo login.
      encerrarSessao()
    } finally {
      setBusy(false)
      fechar()
    }
  }

  function fechar() {
    try {
      sessionStorage.removeItem(PENDING_KEY)
    } catch {
      /* ignore */
    }
    setDismissed(true)
  }

  /** X ou Esc: nada é levado nem descartado. A sessão é do visitante, então o próximo evento abre uma do usuário. */
  function decidirDepois() {
    encerrarSessao()
    fechar()
  }

  if (!mounted) return null

  return (
    <Modal
      title="Associar histórico de navegação?"
      open={open}
      centered
      onCancel={decidirDepois}
      closable={!busy}
      mask={{ closable: !busy }}
      keyboard={!busy}
      footer={[
        <Button key="nao" id="migrar-nao" disabled={busy} onClick={() => void responder(false)}>
          Não associar
        </Button>,
        <Button key="sim" id="migrar-sim" color="primary" loading={busy} onClick={() => void responder(true)}>
          Sim, associar
        </Button>,
      ]}
    >
      <Paragraph>
        Detectamos navegação anônima neste dispositivo. Associar esse histórico ao seu perfil
        melhora as recomendações (LGPD — só com o seu consentimento).
      </Paragraph>
      <Paragraph>
        Se não associar, esse histórico é apagado. Para decidir depois, feche esta janela.
      </Paragraph>
    </Modal>
  )
}
