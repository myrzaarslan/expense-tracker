'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MapPin, Search, Loader2 } from 'lucide-react'

type NearbyPlace = {
  id: string
  displayName: {
    text: string
    languageCode: string
  }
  location: {
    latitude: number
    longitude: number
  }
  types: string[]
  primaryType: string
  formattedAddress: string
}

type NearbySearchProps = {
  onPlaceSelect: (place: { placeId: string; label: string; lat: number; lng: number }) => void
  center?: { lat: number; lng: number }
  onRadiusChange?: (radius: number) => void
}

const PLACE_TYPES = [
  'restaurant',
  'cafe',
  'store',
  'gas_station',
  'bank',
  'pharmacy',
  'hospital',
  'school',
  'park',
  'movie_theater',
  'gym',
  'shopping_mall'
]

export default function NearbySearch({ onPlaceSelect, center, onRadiusChange }: NearbySearchProps) {
  const [searchRadius, setSearchRadius] = useState(1000)
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [permissionAsked, setPermissionAsked] = useState(false)
  const [showManualInput, setShowManualInput] = useState(false)
  const [manualLat, setManualLat] = useState('')
  const [manualLng, setManualLng] = useState('')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const getUserLocation = useCallback(() => {
    setLocationLoading(true)
    setError(null)
    setSuccessMessage(null)
    setPermissionAsked(true)
    
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser. Please use a modern browser or manually set your location.')
      setLocationLoading(false)
      return
    }
    
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'denied') {
          setError('Location permission is permanently denied. Please enable it in your browser settings.')
          setLocationLoading(false)
          return
        }
      }).catch(() => {
      })
    }
    
    const options = {
      enableHighAccuracy: true,
      timeout: 10000, 
      maximumAge: 60000
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setUserLocation({ lat: latitude, lng: longitude })
        setLocationLoading(false)
      },
      (error) => {
        let errorMessage = 'Error getting location'
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location access in your browser settings.'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable. Please try again.'
            break
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please try again.'
            break
          default:
            errorMessage = `Location error: ${error.message || 'Unknown error'}. Please try again.`
        }
        
        setError(errorMessage)
        setLocationLoading(false)
      },
      options
    )
  }, [])

  const searchNearby = useCallback(async () => {
    const searchCenter = userLocation || center
    if (!searchCenter) {
      setError('No location available. Please enable location access or use the map center.')
      return
    }

    setLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const response = await fetch('/api/places/nearby', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: searchCenter.lat,
          longitude: searchCenter.lng,
          radius: searchRadius,
          includedTypes: selectedTypes,
          maxResultCount: 20,
          rankPreference: 'DISTANCE'
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Search failed')
      }

      setNearbyPlaces(data.places || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
      setNearbyPlaces([])
    } finally {
      setLoading(false)
    }
  }, [userLocation, center, searchRadius, selectedTypes])

  const handleTypeToggle = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  const handlePlaceSelect = (place: NearbyPlace) => {
    onPlaceSelect({
      placeId: place.id,
      label: place.displayName.text,
      lat: place.location.latitude,
      lng: place.location.longitude
    })
    setNearbyPlaces([]) // Clear results after selection
  }

  const handleManualLocationSubmit = () => {
    const lat = parseFloat(manualLat)
    const lng = parseFloat(manualLng)
    
    if (isNaN(lat) || isNaN(lng)) {
      setError('Please enter valid coordinates')
      return
    }
    
    if (lat < -90 || lat > 90) {
      setError('Latitude must be between -90 and 90')
      return
    }
    
    if (lng < -180 || lng > 180) {
      setError('Longitude must be between -180 and 180')
      return
    }
    
    setUserLocation({ lat, lng })
    setShowManualInput(false)
    setManualLat('')
    setManualLng('')
    setError(null)
    setSuccessMessage('Location set successfully! You can now search for nearby places.')
    
    setTimeout(() => setSuccessMessage(null), 5000)
  }

  const testCoordinates = () => {
    if (!manualLat || !manualLng) {
      setError('Please enter coordinates first')
      return
    }
    
    const lat = parseFloat(manualLat)
    const lng = parseFloat(manualLng)
    
    if (isNaN(lat) || isNaN(lng)) {
      setError('Please enter valid coordinates')
      return
    }
    
    setLoading(true)
    setError(null)
    
    fetch('/api/places/nearby', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        latitude: lat,
        longitude: lng,
        radius: 100, 
        maxResultCount: 1
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        setError(`Test failed: ${data.error}`)
      } else {
        setError(null)
        setManualLat('')
        setManualLng('')
        setShowManualInput(false)
        setUserLocation({ lat, lng })
        setSuccessMessage('Coordinates verified successfully! Location set and ready for search.')
        
        setTimeout(() => setSuccessMessage(null), 5000)
      }
    })
    .catch(() => {
      setError('Test failed: Could not connect to the server')
    })
    .finally(() => {
      setLoading(false)
    })
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Nearby Search
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Search Location:</span>
            <Button
              onClick={getUserLocation}
              disabled={locationLoading}
              variant="outline"
              size="sm"
            >
              {locationLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MapPin className="h-4 w-4" />
              )}
              {userLocation ? 'Update Location' : permissionAsked ? 'Try Again' : 'Get My Location'}
            </Button>
          </div>
          
          {!userLocation && !permissionAsked && (
            <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
              💡 Click Get My Location to allow location access and find places near you
            </div>
          )}
          
          {userLocation && (
            <div className="text-xs text-green-600 bg-green-50 p-2 rounded flex items-center justify-between">
              <span>📍 Using your location: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}</span>
              <Button
                onClick={() => {
                  setUserLocation(null)
                  setSuccessMessage(null)
                }}
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
              >
                Clear
              </Button>
            </div>
          )}
          
          {!userLocation && center && (
            <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
              🗺️ Using map center: {center.lat.toFixed(4)}, {center.lng.toFixed(4)}
            </div>
          )}
        </div>

        {/* Radius Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Search Radius:</label>
          <Select 
            value={searchRadius.toString()} 
            onValueChange={(value) => {
              const newRadius = Number(value)
              setSearchRadius(newRadius)
              onRadiusChange?.(newRadius)
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="500">500m</SelectItem>
              <SelectItem value="1000">1km</SelectItem>
              <SelectItem value="2000">2km</SelectItem>
              <SelectItem value="5000">5km</SelectItem>
              <SelectItem value="10000">10km</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <span className="text-sm font-medium">Place Types:</span>
          <div className="flex flex-wrap gap-2">
            {PLACE_TYPES.map(type => (
              <Badge
                key={type}
                variant={selectedTypes.includes(type) ? "default" : "outline"}
                className="cursor-pointer hover:opacity-80"
                onClick={() => handleTypeToggle(type)}
              >
                {type.replace('_', ' ')}
              </Badge>
            ))}
          </div>
        </div>

        <Button
          onClick={searchNearby}
          disabled={loading || (!userLocation && !center)}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Searching...
            </>
          ) : (
            <>
              <Search className="h-4 w-4 mr-2" />
              Search Nearby Places
            </>
          )}
        </Button>
        
        {!userLocation && !center && (
          <div className="text-xs text-gray-500 text-center">
            💡 Set a location first to search for nearby places
          </div>
        )}

        {error && (
          <div className="space-y-2">
            <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">
              {error}
            </div>
            {error.includes('permission denied') && (
              <div className="text-xs text-gray-600 text-center">
                💡 Tip: Check your browsers location permissions and try again
              </div>
            )}
            <div className="flex gap-2">
              <Button
                onClick={getUserLocation}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Retry Location
              </Button>
              <Button
                onClick={() => setShowManualInput(!showManualInput)}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                📍 Manual Input
              </Button>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="text-green-600 text-sm text-center bg-green-50 p-2 rounded">
            ✅ {successMessage}
          </div>
        )}

        {showManualInput && (
          <div className="space-y-3 p-3 border rounded-lg bg-gray-50">
            <div className="text-sm font-medium text-center">Enter Coordinates Manually</div>
            <div className="text-xs text-gray-600 text-center">
              💡 You can find coordinates on Google Maps by right-clicking on a location
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-600">Latitude</label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g., 37.7749"
                  value={manualLat}
                  onChange={(e) => setManualLat(e.target.value)}
                  className="w-full p-2 text-sm border rounded"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600">Longitude</label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g., -122.4194"
                  value={manualLng}
                  onChange={(e) => setManualLng(e.target.value)}
                  className="w-full p-2 text-sm border rounded"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleManualLocationSubmit}
                size="sm"
                className="flex-1"
              >
                Set Location
              </Button>
              <Button
                onClick={testCoordinates}
                variant="outline"
                size="sm"
                className="flex-1"
                disabled={loading || !manualLat || !manualLng}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Test'}
              </Button>
              <Button
                onClick={() => setShowManualInput(false)}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {nearbyPlaces.length > 0 && (
          <div className="space-y-3">
            <div className="text-sm font-medium text-center">
              Found {nearbyPlaces.length} places:
            </div>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {nearbyPlaces.map((place) => (
                <div
                  key={place.id}
                  onClick={() => handlePlaceSelect(place)}
                  className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium">{place.displayName.text}</div>
                  <div className="text-sm text-gray-600">{place.formattedAddress}</div>
                  <div className="text-xs text-gray-500">
                  {place.primaryType ? place.primaryType.replace('_', ' ') : '—'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 