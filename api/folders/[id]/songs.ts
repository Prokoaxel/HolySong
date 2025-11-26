import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabaseAdmin } from '../../_lib/supabaseAdminClient'

// Handler for POST (add song) and DELETE (remove song) for folder songs
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const {
    query: { id },
    method,
  } = req

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Missing folder id' })
  }

  // Authentication: expect Authorization: Bearer <access_token>
  const authHeader = req.headers['authorization'] || req.headers['Authorization']
  const token = typeof authHeader === 'string' ? authHeader.replace('Bearer ', '') : null
  let userId: string | null = null

  if (token) {
    const { data } = await supabaseAdmin.auth.getUser(token)
    userId = data?.user?.id ?? null
  }

  // Verify folder owner matches user
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { data: folderData, error: folderErr } = await supabaseAdmin
    .from('folders')
    .select('id, owner_id')
    .eq('id', id)
    .maybeSingle()

  if (folderErr) {
    console.error(folderErr)
    return res.status(500).json({ error: 'Failed fetching folder' })
  }

  if (!folderData || folderData.owner_id !== userId) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  if (method === 'POST') {
    // body: { song_id: string }
    const { song_id } = req.body
    if (!song_id) return res.status(400).json({ error: 'Missing song_id' })

    const { error } = await supabaseAdmin
      .from('folder_songs')
      .insert({ folder_id: id, song_id })

    if (error) {
      console.error(error)
      return res.status(500).json({ error: 'Error inserting song to folder' })
    }

    return res.status(200).json({ success: true })
  }

  if (method === 'DELETE') {
    // expecting /api/folders/[id]/songs?songId=...
    const songId = req.query.songId as string | undefined
    if (!songId) return res.status(400).json({ error: 'Missing songId query' })

    const { error } = await supabaseAdmin
      .from('folder_songs')
      .delete()
      .match({ folder_id: id, song_id: songId })

    if (error) {
      console.error(error)
      return res.status(500).json({ error: 'Error removing song from folder' })
    }

    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
