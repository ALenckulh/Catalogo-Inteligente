'use client'

import { useState, useSyncExternalStore } from 'react'
import { migrarHistorico } from '@/lib/api/auth'
import { USE_MOCK } from '@/lib/api/config'
import { toApiError } from '@/lib/api/client'
import { encerrarSessao, readVisitanteId } from '@/lib/api/visitanteId'
import { useCurrentUser } from '@/lib/contexts/CurrentUser/CurrentUserContext'
import { Modal, Typography } from '@/components/ui'

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

  async function finish(aceitar: boolean) {
    setBusy(true)
    try {
      await migrarHistorico(aceitar)
    } catch (e) {
      void toApiError(e)
    } finally {
      // Sem migração, a sessão continua do visitante: o próximo evento abre uma do usuário.
      if (!aceitar) encerrarSessao()
      try {
        sessionStorage.removeItem(PENDING_KEY)
      } catch {
        /* ignore */
      }
      setBusy(false)
      setDismissed(true)
    }
  }

  if (!mounted) return null

  return (
    <Modal
      title="Associar histórico de navegação?"
      open={open}
      centered
      confirmLoading={busy}
      okText="Sim, associar"
      cancelText="Não associar"
      onOk={() => void finish(true)}
      onCancel={() => void finish(false)}
      closable={!busy}
      mask={{ closable: !busy }}
    >
      <Paragraph>
        Detectamos navegação anônima neste dispositivo. Associar esse histórico ao seu perfil
        melhora as recomendações (LGPD — só com o seu consentimento).
      </Paragraph>
    </Modal>
  )
}
