import { createClient } from '@/lib/supabase/client'

export async function uploadPhoto(
  file: File,
  bucket: string,
  path: string
): Promise<string | null> {
  const supabase = createClient()

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: true })

  if (error) {
    console.error('Fotoğraf yükleme hatası:', error.message)
    return null
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}
