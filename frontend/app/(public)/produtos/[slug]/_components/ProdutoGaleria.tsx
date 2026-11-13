'use client'

import { useState } from 'react'
import { imagemSrc } from '@/lib/api/config'
import type { ProdutoImagem } from '@/lib/types'
import { Button, Flex, Image } from '@/components/ui'

const THUMB = 64

interface ProdutoGaleriaProps {
  /** Já ordenadas por `ordem`. */
  imagens: ProdutoImagem[]
  nomeProduto: string
}

export function ProdutoGaleria({ imagens, nomeProduto }: ProdutoGaleriaProps) {
  const [ativa, setAtiva] = useState(0)
  const principal = imagens[ativa] ?? imagens[0]

  return (
    <Flex vertical gap="small">
      <Flex
        align="center"
        justify="center"
        style={{
          width: '100%',
          aspectRatio: '4 / 3',
          maxHeight: 'min(60vh, 480px)',
          background: 'var(--surface-neutral-subtle)',
          borderRadius: 'var(--radius-default)',
          overflow: 'hidden',
        }}
      >
        {principal && (
          <Image.PreviewGroup
            items={imagens.map((i) => imagemSrc(i.url))}
            preview={{ current: ativa, onChange: setAtiva }}
          >
            <Image
              src={imagemSrc(principal.url)}
              alt={principal.altText ?? nomeProduto}
              styles={{
                root: { width: '100%', height: '100%' },
                image: { width: '100%', height: '100%', objectFit: 'contain' },
              }}
            />
          </Image.PreviewGroup>
        )}
      </Flex>

      {imagens.length > 1 && (
        <Flex gap="small" wrap="wrap">
          {imagens.map((img, i) => (
            <Button
              key={img.id}
              variant={i === ativa ? 'outlined' : 'text'}
              color={i === ativa ? 'primary' : 'default'}
              aria-label={`Ver foto ${i + 1} de ${imagens.length}`}
              aria-pressed={i === ativa}
              onClick={() => setAtiva(i)}
              style={{ width: THUMB, height: THUMB, padding: 2, overflow: 'hidden' }}
            >
              <Image
                src={imagemSrc(img.url)}
                alt=""
                preview={false}
                styles={{
                  root: { width: '100%', height: '100%' },
                  image: { width: '100%', height: '100%', objectFit: 'cover' },
                }}
              />
            </Button>
          ))}
        </Flex>
      )}
    </Flex>
  )
}
