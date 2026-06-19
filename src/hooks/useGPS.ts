'use client'
import { useState, useCallback } from 'react'
import type { GPSCapture } from '@/types'

interface UseGPSReturn {
  capturing: boolean
  capture: () => Promise<GPSCapture>
}

const gpsErrorMessages: Record<number, string> = {
  1: 'Konum izni reddedildi. Tarayıcı ayarlarından konum iznini açın.',
  2: 'Konum bilgisi alınamadı. Sinyal kontrol edin.',
  3: 'Konum alma zaman aşımına uğradı. Tekrar deneyin.',
}

export function useGPS(): UseGPSReturn {
  const [capturing, setCapturing] = useState(false)

  const capture = useCallback((): Promise<GPSCapture> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({
          status: 'failed',
          reason: 'Bu tarayıcı konum özelliğini desteklemiyor.',
        })
        return
      }

      setCapturing(true)

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCapturing(false)
          resolve({
            status: 'success',
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          })
        },
        (error) => {
          setCapturing(false)
          resolve({
            status: 'failed',
            reason: gpsErrorMessages[error.code] ?? 'Bilinmeyen konum hatası.',
          })
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,       // önbellek kullanma — anlık konum al
        }
      )
    })
  }, [])

  return { capturing, capture }
}
