const { supabaseAdmin } = require('../../_lib/supabaseAdminClient')

module.exports = async (req, res) => {
  const { method } = req
  const id = req.query.id

  if (!id) return res.status(400).json({ error: 'Missing folder id' })

  const authHeader = req.headers['authorization'] || req.headers['Authorization']
  const token = authHeader && authHeader.replace('Bearer ', '')
  let userId = null
  if (token) {
    const { data } = await supabaseAdmin.auth.getUser(token)
    userId = data?.user?.id || null
  }

  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const { data: folderData, error: folderErr } = await supabaseAdmin
    .from('folders')
    .select('id, owner_id')
    .eq('id', id)
    .maybeSingle()

  if (folderErr) {
    console.error(folderErr)
    return res.status(500).json({ error: 'Failed fetching folder' })
  }

  if (!folderData || folderData.owner_id !== userId) return res.status(403).json({ error: 'Forbidden' })

  if (method === 'POST') {
    const { song_id } = req.body
    if (!song_id) return res.status(400).json({ error: 'Missing song_id' })

    const { error } = await supabaseAdmin.from('folder_songs').insert({ folder_id: id, song_id })

    if (error) {
      console.error(error)
      return res.status(500).json({ error: 'Error inserting song to folder' })
    }

    return res.status(200).json({ success: true })
  }

  if (method === 'DELETE') {
    const songId = req.query.songId
    if (!songId) return res.status(400).json({ error: 'Missing songId query' })

    const { error } = await supabaseAdmin.from('folder_songs').delete().match({ folder_id: id, song_id: songId })

    if (error) {
      console.error(error)
      return res.status(500).json({ error: 'Error removing song from folder' })
    }

    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
