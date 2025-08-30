'use client'
import { Map, useMap } from '@vis.gl/react-google-maps'
import { useEffect } from 'react'

export default function Google3DMap() {
  const center = { lat: 40.758, lng: -73.985 }
  return (
    <div style={{ height: '70vh', width: '100%', maxWidth: 1000, margin: '0 auto' }}>
      <Map
        defaultCenter={center}
        defaultZoom={15}
        mapId='58b63f31f3dbc89919298e51'
      >
        <TiltTo3D />
      </Map>
    </div>
  )
}

function TiltTo3D() {
  const map = useMap()
  useEffect(() => {
    if (!map) return
    map.setTilt(67.5)
    map.setHeading(20)
    map.setOptions({ disableDefaultUI: false, gestureHandling: 'greedy' })
  }, [map])
  return null
}
