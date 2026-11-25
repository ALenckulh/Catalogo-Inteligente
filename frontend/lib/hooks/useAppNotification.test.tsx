import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from 'antd'
import { useState } from 'react'
import { afterEach, expect, it } from 'vitest'
import { useAppNotification } from './useAppNotification'

afterEach(cleanup)

function Formulario({ onSair }: { onSair: () => void }) {
  const { api } = useAppNotification()
  return (
    <button
      type="button"
      onClick={() => {
        api.success({ title: 'Produto criado' })
        onSair()
      }}
    >
      salvar
    </button>
  )
}

function Telas() {
  const [lista, setLista] = useState(false)
  return lista ? <p>lista</p> : <Formulario onSair={() => setLista(true)} />
}

it('o aviso continua depois que a tela que o chamou desmonta', async () => {
  render(
    <App>
      <Telas />
    </App>,
  )
  await userEvent.click(screen.getByRole('button', { name: 'salvar' }))
  expect(screen.getByText('lista')).toBeInTheDocument()
  await waitFor(() => expect(screen.getByText('Produto criado')).toBeInTheDocument())
})
