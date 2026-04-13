export type Role = 'admin' | 'personel'
export type LocationStatus = 'success' | 'failed' | 'skipped' | 'manual'

export interface Profile {
  id: string
  name: string
  email: string
  role: Role
  active: boolean
  created_at: string
}

export interface Company {
  id: string
  name: string
  address: string | null
  phone: string | null
  note: string | null
  created_at: string
}

export interface Visit {
  id: string
  user_id: string
  company_id: string | null
  company_name_snapshot: string
  note: string | null
  visit_date: string
  visit_time: string
  latitude: number | null
  longitude: number | null
  accuracy: number | null
  location_status: LocationStatus
  address: string | null
  created_at: string
}

export interface VisitWithProfile extends Visit {
  profiles: Pick<Profile, 'id' | 'name' | 'email'>
}

export interface GPSSuccess {
  status: 'success'
  latitude: number
  longitude: number
  accuracy: number
}

export interface GPSFailure {
  status: 'failed'
  reason: string
}

export type GPSCapture = GPSSuccess | GPSFailure

export interface VisitFilters {
  staffId?: string
  companyId?: string
  from?: string
  to?: string
  page?: number
}
