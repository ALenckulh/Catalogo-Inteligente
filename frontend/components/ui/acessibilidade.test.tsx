import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { Button, Form, FormItem, Input, Select } from '@/components/ui'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))

afterEach(cleanup)

it('o rótulo aponta para o campo que tem id próprio, e para o name quando não tem', () => {
  render(
    <Form>
      <FormItem name="email" label="E-mail">
        <Input id="cadastro-email" />
      </FormItem>
      <FormItem name="nome" label="Nome">
        <Input />
      </FormItem>
      <FormItem name="senha" label="Senha">
        <Input.Password id="cadastro-senha" />
      </FormItem>
      <FormItem name="cat" label="Categoria">
        <Select id="cadastro-cat" options={[]} />
      </FormItem>
    </Form>,
  )
  expect(screen.getByLabelText('E-mail')).toHaveAttribute('id', 'cadastro-email')
  expect(screen.getByLabelText('Nome')).toBeInTheDocument()
  expect(screen.getByLabelText('Senha')).toHaveAttribute('id', 'cadastro-senha')
  expect(screen.getByLabelText('Categoria')).toHaveAttribute('id', 'cadastro-cat')
})

it('botão só com ícone usa o tooltip como nome; com texto, o texto', () => {
  render(
    <>
      <Button icon={<i aria-label="edit" />} tooltip="Editar produto" />
      <Button icon={<i />} tooltip="Dica longa">
        Salvar
      </Button>
      <Button icon={<i />} tooltip="Remover" aria-label="Remover foto 2" />
    </>,
  )
  expect(screen.getByRole('button', { name: 'Editar produto' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Salvar' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Remover foto 2' })).toBeInTheDocument()
})

it('busca e seleção com nomes em português', () => {
  render(
    <>
      <Input.Search allowClear defaultValue="x" />
      <Select allowClear value="a" options={[{ value: 'a', label: 'A' }]} aria-label="Tipo" />
    </>,
  )
  expect(screen.getByRole('button', { name: 'Buscar' })).toBeInTheDocument()
  expect(screen.getAllByRole('button', { name: 'Limpar' })).toHaveLength(2)
  expect(screen.queryByRole('button', { name: /search|close|clear/i })).toBeNull()
})
