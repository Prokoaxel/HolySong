import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabaseAdmin } from '../../_lib/supabaseAdminClient'

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const folderId = req.query.id
  const { method } = req

  if (method !== 'POST' && method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!folderId || typeof folderId !== 'string') {
    return res.status(400).json({ error: 'Missing folder id' })
  }
  if (!UUID_REGEX.test(folderId)) {
    return res.status(400).json({ error: 'Invalid folder id' })
  }

  const authHeader = req.headers.authorization
  const tokenMatch = typeof authHeader === 'string' ? authHeader.match(/^Bearer\s+(.+)$/i) : null
  const token = tokenMatch?.[1]?.trim() || null
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !authData.user) {
    return res.status(401).json({ error: 'Invalid token' })
  }
  const userId = authData.user.id

  const { data: folderData, error: folderErr } = await supabaseAdmin
    .from('folders')
    .select('id, owner_id')
    .eq('id', folderId)
    .maybeSingle()

  if (folderErr) {
    console.error('[folders] fetch folder error:', folderErr)
    return res.status(500).json({ error: 'Failed fetching folder' })
  }
  if (!folderData || folderData.owner_id !== userId) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  if (method === 'POST') {
    const songId = req.body?.song_id
    if (!songId || typeof songId !== 'string') {
      return res.status(400).json({ error: 'Missing song_id' })
    }
    if (!UUID_REGEX.test(songId)) {
      return res.status(400).json({ error: 'Invalid song_id' })
    }

    const { error } = await supabaseAdmin.from('folder_songs').insert({ folder_id: folderId, song_id: songId })
    if (error) {
      const code = (error as any)?.code || ''
      console.error('[folders] insert error:', error)
      if (code === '23505') {
        return res.status(200).json({ success: true, info: 'already exists' })
      }
      return res.status(500).json({ error: 'Error inserting song to folder' })
    }

    return res.status(200).json({ success: true })
  }

  const songId = req.query.songId
  if (!songId || typeof songId !== 'string') {
    return res.status(400).json({ error: 'Missing songId query' })
  }
  if (!UUID_REGEX.test(songId)) {
    return res.status(400).json({ error: 'Invalid songId query' })
  }

  const { error } = await supabaseAdmin.from('folder_songs').delete().match({ folder_id: folderId, song_id: songId })
  if (error) {
    console.error('[folders] remove error:', error)
    return res.status(500).json({ error: 'Error removing song from folder' })
  }

  return res.status(200).json({ success: true })
}
