import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const statusLabel = (s: string | null): string => {
  if (s === 'gorusuldu') return 'Görüşüldü'
  if (s === 'teklif_verildi') return 'Teklif Verildi'
  if (s === 'takip_gerekli') return 'Takip Gerekli'
  if (s === 'siparis_alindi') return 'Sipariş Alındı'
  return ''
}

const locationLabel = (s: string | null): string => {
  if (s === 'success') return 'Alındı'
  if (s === 'failed') return 'Alınamadı'
  if (s === 'manual') return 'Manuel Adres'
  return 'Atlandı'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toCSVRow = (cells: any[]): string =>
  cells.map((c) => `"${String(c ?? '').replace(/"/g, '""').replace(/\n/g, ' ')}"`).join(',')

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin yetkisi gereklidir.' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  const PAGE_SIZE = 1000
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allRows: any[] = []
  let page = 0

  while (true) {
    let query = supabase
      .from('visits')
      .select('visit_date, visit_time, company_name_snapshot, status, note, location_status, contact_name, contact_title, profiles(name)')
      .order('visit_date', { ascending: false })
      .order('visit_time', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (from) query = query.gte('visit_date', from)
    if (to)   query = query.lte('visit_date', to)

    const { data, error } = await query
    if (error || !data || data.length === 0) break
    allRows.push(...data)
    if (data.length < PAGE_SIZE) break
    page++
  }

  const header = toCSVRow(['Tarih', 'Saat', 'Personel', 'Firma', 'Görüşülen Kişi', 'Ünvan', 'Ziyaret Durumu', 'Not', 'Konum Durumu'])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = allRows.map((v: any) =>
    toCSVRow([
      v.visit_date,
      v.visit_time?.slice(0, 5) ?? '',
      v.profiles?.name ?? '',
      v.company_name_snapshot,
      v.contact_name ?? '',
      v.contact_title ?? '',
      statusLabel(v.status),
      v.note ?? '',
      locationLabel(v.location_status),
    ])
  )

  const csv = '﻿' + [header, ...rows].join('\n')
  const today = new Date().toISOString().slice(0, 10)

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv;charset=utf-8;',
      'Content-Disposition': `attachment; filename="ziyaretler_${today}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
