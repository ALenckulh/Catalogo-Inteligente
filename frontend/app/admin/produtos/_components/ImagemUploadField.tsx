'use client'

import { useState } from 'react'
import { PictureOutlined, UploadOutlined } from '@ant-design/icons'
import { uploadImagem } from '@/lib/api/admin'
import { toApiError } from '@/lib/api/client'
import { imagemSrc } from '@/lib/api/config'
import { Button, Flex, Image, Upload } from '@/components/ui'

const THUMB = 64
const ACCEPT = 'image/jpeg,image/png,image/webp'

interface Props {
  /** Injetados pelo FormItem. */
  value?: string
  onChange?: (url: string) => void
  id: string
  onError: (mensagem: string) => void
}

/** Campo de imagem do produto: comprime no navegador, envia ao backend (BLOB) e guarda a referência. */
export function ImagemUploadField({ value, onChange, id, onError }: Props) {
  const [enviando, setEnviando] = useState(false)

  async function enviar(file: File) {
    if (!ACCEPT.split(',').includes(file.type)) {
      onError('Formato não suportado. Envie JPEG, PNG ou WebP')
      return
    }
    setEnviando(true)
    try {
      // Import sob demanda: a lib só é baixada quando o admin envia uma foto.
      const { default: imageCompression } = await import('browser-image-compression')
      const comprimida = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1600,
        fileType: 'image/webp',
        useWebWorker: true,
      })
      const { url } = await uploadImagem(comprimida)
      onChange?.(url)
    } catch (e) {
      onError(toApiError(e).message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Flex gap="small" align="center">
      <Flex
        align="center"
        justify="center"
        style={{
          width: THUMB,
          height: THUMB,
          flex: 'none',
          background: 'var(--surface-neutral-subtle)',
          borderRadius: 'var(--radius-default)',
          color: 'var(--icon-subtle)',
          overflow: 'hidden',
        }}
      >
        {value ? (
          <Image
            src={imagemSrc(value)}
            alt="Pré-visualização da imagem"
            styles={{
              root: { width: '100%', height: '100%' },
              image: { width: '100%', height: '100%', objectFit: 'cover' },
            }}
          />
        ) : (
          <PictureOutlined aria-hidden />
        )}
      </Flex>
      <Upload
        accept={ACCEPT}
        beforeUpload={(file) => {
          void enviar(file)
          return false
        }}
      >
        <Button id={id} icon={<UploadOutlined />} loading={enviando}>
          {value ? 'Trocar foto' : 'Enviar foto'}
        </Button>
      </Upload>
    </Flex>
  )
}
