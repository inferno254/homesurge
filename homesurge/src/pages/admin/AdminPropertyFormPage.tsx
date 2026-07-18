import { FormEvent, useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Sparkles, Navigation } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { supabase } from '../../lib/supabase'
import { generateHouseDescription } from '../../lib/gemini'
import { useToast } from '../../components/Toast'
import { AIListingParser } from '../../components/admin/ai/AIListingParser'
import { AIImageGate } from '../../components/admin/ai/AIImageGate'
import { AIGeocodeHelper } from '../../components/admin/ai/AIGeocodeHelper'
import { useQueryClient } from '@tanstack/react-query'
import { shouldShowBathrooms } from '../../lib/helpers'

const AMENITIES = ['WiFi', 'Parking', 'Water 24/7', 'Electricity', 'Security', 'CCTV', 'Gym', 'Backup Generator', 'Balcony', 'Rooftop', 'Free water']

const TOWNS_BY_COUNTY: Record<string, string[]> = {
  Nairobi: ['CBD', 'Westlands', 'Kilimani', 'Kileleshwa', 'Lavington', 'Parklands', 'Upper Hill', 'Riverside', 'Spring Valley', 'Muthaiga', 'Gigiri', 'Karen', 'Langata', 'Rongai (Nairobi side)', 'Madaraka', 'South B', 'South C', 'Eastlands', 'Buruburu', 'Umoja', 'Donholm', 'Embakasi', 'Utawala', 'Dandora', 'Kasarani', 'Roysambu', 'Kahawa', 'Githurai', 'Zimmerman', 'Mathare North', 'Pipeline'],
  Kiambu: ['Kiambu Town', 'Thika', 'Ruiru', 'Ruaka', 'Kabete', 'Kikuyu', 'Limuru', 'Tigoni', 'Juja', 'Kinoo', 'Githunguri', 'Ngewa', 'Wangige', 'Nderu', 'Lari', 'Gatundu'],
  Machakos: ['Machakos Town', 'Athi River', 'Kitengela', 'Mavoko', 'Kangundo', 'Tala', 'Matuu', 'Kathiani', 'Masinga', 'Yatta', 'Mwala'],
  Kajiado: ['Ngong', 'Ongata Rongai', 'Kiserian', 'Isinya', 'Kajiado Town', 'Namanga', 'Bissil', 'Shompole', 'Magadi'],
  Kisumu: ['Kisumu City', 'Ahero', 'Muhoroni', 'Koru', 'Kisumu West', 'Nyando', 'Miwani'],
  Mombasa: ['Mombasa Island', 'Nyali', 'Bamburi', 'Likoni', 'Mtwapa', 'Shanzu', 'Tudor', 'Kizingo', 'Mikindani'],
  Nakuru: ['Nakuru Town', 'Naivasha', 'Gilgil', 'Njoro', 'Molo', 'Mau Summit', 'Elementaita', 'Subukia', 'Bahati'],
  Eldoret: ['Eldoret Town', 'Iten', 'Kapsowar', 'Tambach', 'Chepkorio', 'Kabarnet'],
  Nyeri: ['Nyeri Town', 'Karatina', 'Othaya', 'Mukurweini', 'Kieni', 'Mathira', 'Tetu'],
  Meru: ['Meru Town', 'Nkubu', 'Chuka', 'Chogoria', 'Maua', 'Timau', 'Nanyuki'],
  'Uasin Gishu': ['Eldoret', 'Moiben', 'Soy', 'Kapsaret', 'Turbo', 'Ainabkoi'],
  Kilifi: ['Kilifi Town', 'Malindi', 'Watamu', 'Mtwapa (Kilifi side)', 'Mariakani', 'Kaloleni', 'Rabai'],
  Kwale: ['Kwale Town', 'Diani', 'Ukunda', 'Msambweni', 'Lunga Lunga', 'Shimoni'],
  'Taita Taveta': ['Voi', 'Taveta', 'Wundanyi', 'Mwatate', 'Taita'],
  Muranga: ['Muranga Town', 'Kangema', 'Kandara', 'Gatanga', 'Maragua', 'Kigumo'],
  Kirinyaga: ['Kerugoya', 'Kutus', 'Sagana', 'Mwea', 'Gichugu', 'Ndia'],
  Embu: ['Embu Town', 'Runyenjes', 'Siakago', 'Manyatta', 'Kyeni'],
  Makueni: ['Wote', 'Kibwezi', 'Makindu', 'Mtito Andei', 'Sultan Hamud', 'Salama'],
  Kitui: ['Kitui Town', 'Mwingi', 'Mutomo', 'Kwa Vonza', 'Ikutha', 'Kyuso'],
  Nandi: ['Kapsabet', 'Nandi Hills', 'Kobujoi', 'Chepterit', 'Tinderet'],
  Kericho: ['Kericho Town', 'Litein', 'Sotik', 'Buret', 'Londiani', 'Kipkelion'],
  Bomet: ['Bomet Town', 'Sotik', 'Mogogosiek', 'Longisa', 'Chepalungu'],
  'Trans Nzoia': ['Kitale', 'Kiminini', 'Kwanza', 'Endebess', 'Saboti'],
  Bungoma: ['Bungoma Town', 'Webuye', 'Kimilili', 'Sirisia', 'Tongaren', 'Mt Elgon'],
  Busia: ['Busia Town', 'Nambale', 'Port Victoria', 'Funyula', 'Teso North', 'Teso South'],
  Siaya: ['Siaya Town', 'Bondo', 'Ugunja', 'Ukwala', 'Yala', 'Rarieda'],
  'Homa Bay': ['Homa Bay Town', 'Mbita', 'Oyugis', 'Rachuonyo', 'Suba', 'Ndhiwa'],
  Migori: ['Migori Town', 'Kehancha', 'Awendo', 'Rongo', 'Uriri', 'Suna'],
  Kisii: ['Kisii Town', 'Ogembo', 'Nyamache', 'Keroka', 'Tabaka', 'Masimba'],
  Kakamega: ['Kakamega Town', 'Mumias', 'Butere', 'Malava', 'Lurambi', 'Navakholo', 'Matungu', 'Khwisero'],
  Laikipia: ['Nanyuki', 'Nyahururu', 'Rumuruti', 'Marmanet', 'Doldol', 'Kinamba'],
}

const RONGAI_AREAS = [
  'Maasai Lodge',
  'Kandisi',
  'Rimpa',
  'Nkoroi',
  'Merisho',
  'Olekasasi',
  'Tuala',
  'Rangau',
  'Kware',
  'Gataka',
  'Matasia',
  'Nairobi National Park area',
  'Ngong Hills view',
  'Magadi Road corridor',
]

type FormShape = {
  title: string
  description: string
  admin_description: string
  price: string
  price_type: string
  bedrooms: string
  bathrooms: string
  property_type: string
  county: string
  town: string
  area_label: string
  estate: string
  address: string
  latitude: string
  longitude: string
  owner_phone: string
  is_available: boolean
  is_published: boolean
  furnished: boolean
  size_sqm: string
  amenities: string[]
  deposit_amount: string
  water_deposit: string
  electricity_deposit: string
  water_price_per_unit: string
  has_balcony: boolean
  has_rooftop: boolean
}

const EMPTY_FORM: FormShape = {
  title: '',
  description: '',
  admin_description: '',
  price: '',
  price_type: 'monthly',
  bedrooms: '',
  bathrooms: '',
  property_type: 'apartment',
  county: '',
  town: '',
  area_label: '',
  estate: '',
  address: '',
  latitude: '',
  longitude: '',
  owner_phone: '',
  is_available: true,
  is_published: false,
  furnished: false,
  size_sqm: '',
  amenities: [],
  deposit_amount: '',
  water_deposit: '',
  electricity_deposit: '',
  water_price_per_unit: '',
  has_balcony: false,
  has_rooftop: false,
}

export function AdminPropertyFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { toast } = useToast()
  const [searchParams] = useSearchParams()
  const [busy, setBusy] = useState(false)
  const [aiBusy, setAiBusy] = useState(false)
  const [loadingData, setLoadingData] = useState(isEdit)
  const queryClient = useQueryClient()

  const mapLat = searchParams.get('lat')
  const mapLng = searchParams.get('lng')

  const [form, setForm] = useState<FormShape>(() => {
    if (!isEdit && (mapLat || mapLng)) {
      return { ...EMPTY_FORM, latitude: mapLat ?? '', longitude: mapLng ?? '' }
    }
    return EMPTY_FORM
  })
  const [files, setFiles] = useState<FileList | null>(null)
  const [aiText, setAiText] = useState('')
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [detectingLocation, setDetectingLocation] = useState(false)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const leafletMapRef = useRef<L.Map | null>(null)
  const currentMarkerRef = useRef<L.CircleMarker | null>(null)
  const pickedMarkerRef = useRef<L.Marker | null>(null)

  useEffect(() => {
    if (!id || !supabase) return
    ;(async () => {
      const { data: prop, error } = await supabase
        .from('properties')
        .select('*, property_images(image_url, is_cover), amenities(name)')
        .eq('id', id)
        .single()
      if (error || !prop) {
        toast('Failed to load property for editing', 'error')
        navigate('/admin')
        return
      }
      setForm({
        title: prop.title ?? '',
        description: prop.description ?? '',
        admin_description: (prop as any).admin_description ?? '',
        price: String(prop.price ?? ''),
        price_type: prop.price_type ?? 'monthly',
        bedrooms: prop.bedrooms != null ? String(prop.bedrooms) : '',
        bathrooms: prop.bathrooms != null ? String(prop.bathrooms) : '',
        property_type: prop.property_type ?? 'apartment',
        county: prop.county ?? '',
        town: prop.town ?? '',
        area_label: prop.area_label ?? '',
        estate: prop.estate ?? '',
        address: prop.address ?? '',
        latitude: prop.latitude != null ? String(prop.latitude) : '',
        longitude: prop.longitude != null ? String(prop.longitude) : '',
        owner_phone: prop.owner_phone ?? '',
        is_available: prop.is_available ?? true,
        is_published: prop.is_published ?? false,
        furnished: prop.furnished ?? false,
        size_sqm: prop.size_sqm != null ? String(prop.size_sqm) : '',
        amenities: (prop.amenities as { name: string }[] | undefined)?.map((a) => a.name) ?? [],
        deposit_amount: prop.deposit_amount != null ? String(prop.deposit_amount) : '',
        water_deposit: prop.water_deposit != null ? String(prop.water_deposit) : '',
        electricity_deposit: prop.electricity_deposit != null ? String(prop.electricity_deposit) : '',
        water_price_per_unit: prop.water_price_per_unit != null ? String(prop.water_price_per_unit) : '',
        has_balcony: prop.has_balcony ?? false,
        has_rooftop: prop.has_rooftop ?? false,
      })
      setAiText(prop.ai_generated_description ?? '')
      setExistingImages(
        (prop.property_images as { image_url: string }[] | undefined)?.map((i) => i.image_url) ?? [],
      )
      setLoadingData(false)
    })()
  }, [id, navigate, toast])

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
        headers: { 'User-Agent': 'homesurge-web/1.0' },
      })
      if (!res.ok) return null
      const data = await res.json()
      const addr = data.address as Record<string, string> | undefined
      if (!addr) return null
      const county = addr.state || addr.county || addr.region || ''
      const town = addr.city || addr.town || addr.municipality || addr.village || ''
      const road = addr.road || ''
      const houseNumber = addr.house_number || ''
      const suburb = addr.suburb || addr.neighbourhood || ''
      const fullAddress = [houseNumber, road, suburb, town, county].filter(Boolean).join(', ')
      return { county, town, fullAddress, display: [road, suburb, town, county].filter(Boolean).join(', ') }
    } catch {
      return null
    }
  }, [])

  const autoDetectLocation = useCallback(async (map?: L.Map | null) => {
    if (!navigator.geolocation) {
      toast('Geolocation not supported by your browser', 'error')
      return
    }
    setDetectingLocation(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        const geo = await reverseGeocode(lat, lng)

        const confirmed = window.confirm(
          geo?.display
            ? `Is this your current location?\n\n${geo.display}`
            : `Is this your current location?\n\n${lat.toFixed(6)}, ${lng.toFixed(6)}`
        )

        if (confirmed) {
          setCurrentLocation({ lat, lng })
          setForm((f) => ({
            ...f,
            latitude: String(lat),
            longitude: String(lng),
            ...(geo ? { county: geo.county, town: geo.town, address: geo.fullAddress } : {}),
          }))
          if (map) {
            try {
              const container = map.getContainer?.()
              if (container && container.offsetWidth > 0 && container.offsetHeight > 0) {
                map.setView([lat, lng], 16)
              }
            } catch {}
            if (pickedMarkerRef.current) {
              pickedMarkerRef.current.setLatLng([lat, lng])
            } else {
              pickedMarkerRef.current = L.marker([lat, lng], {
                icon: L.icon({
                  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
                  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
                  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
                  iconSize: [25, 41],
                  iconAnchor: [12, 41],
                  popupAnchor: [1, -34],
                  shadowSize: [41, 41],
                }),
              }).addTo(map)
            }
            if (currentMarkerRef.current) {
              currentMarkerRef.current.setLatLng([lat, lng])
            } else {
              currentMarkerRef.current = L.circleMarker([lat, lng], {
                radius: 8,
                fillColor: '#3B82F6',
                color: '#fff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8,
              }).addTo(map)
            }
          }
        }
        setDetectingLocation(false)
      },
      (err) => {
        console.warn('Geolocation error:', err)
        setDetectingLocation(false)
        toast('Location access denied or unavailable. Pin the location manually on the map.', 'error')
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }, [reverseGeocode, toast])

  const handleDetectLocation = useCallback(() => {
    autoDetectLocation(leafletMapRef.current)
  }, [autoDetectLocation])

  useEffect(() => {
    if (!mapContainerRef.current || leafletMapRef.current) return

    const map = L.map(mapContainerRef.current, {
      center: form.latitude && form.longitude ? [Number(form.latitude), Number(form.longitude)] : [-1.286389, 36.817223],
      zoom: form.latitude && form.longitude ? 16 : 12,
    })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
    }).addTo(map)
    leafletMapRef.current = map

    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng
      setForm((f) => ({ ...f, latitude: String(lat), longitude: String(lng) }))
      if (pickedMarkerRef.current) {
        pickedMarkerRef.current.setLatLng([lat, lng])
      } else {
        pickedMarkerRef.current = L.marker([lat, lng], {
          icon: L.icon({
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41],
          }),
        }).addTo(map)
      }
    })

    if (form.latitude && form.longitude) {
      pickedMarkerRef.current = L.marker([Number(form.latitude), Number(form.longitude)], {
        icon: L.icon({
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        }),
      }).addTo(map)
    }

    if (!isEdit) {
      autoDetectLocation(map)
    }

    return () => {
      map.remove()
      leafletMapRef.current = null
      currentMarkerRef.current = null
      pickedMarkerRef.current = null
    }
  }, [isEdit, autoDetectLocation])

  useEffect(() => {
    if (!currentLocation || !leafletMapRef.current) return
    if (currentMarkerRef.current) {
      currentMarkerRef.current.setLatLng([currentLocation.lat, currentLocation.lng])
    } else {
      currentMarkerRef.current = L.circleMarker([currentLocation.lat, currentLocation.lng], {
        radius: 8,
        fillColor: '#3B82F6',
        color: '#fff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8,
      }).addTo(leafletMapRef.current)
    }
  }, [currentLocation])

  useEffect(() => {
    if (!currentLocation || !leafletMapRef.current) return
    if (currentMarkerRef.current) {
      currentMarkerRef.current.setLatLng([currentLocation.lat, currentLocation.lng])
    } else {
      currentMarkerRef.current = L.circleMarker([currentLocation.lat, currentLocation.lng], {
        radius: 8,
        fillColor: '#3B82F6',
        color: '#fff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8,
      }).addTo(leafletMapRef.current)
    }
  }, [currentLocation])

  const toggleAmenity = (a: string) => {
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(a) ? f.amenities.filter((x) => x !== a) : [...f.amenities, a],
    }))
  }

  const runGemini = async () => {
    setAiBusy(true)
    try {
      const text = await generateHouseDescription({
        property_type: form.property_type,
        bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
        bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
        county: form.county,
        town: form.town,
        area_label: form.area_label || null,
        price: Number(form.price) || 0,
        price_type: form.price_type,
        amenities: form.amenities,
      })
      setAiText(text)
    } catch (e) {
      toast((e as Error).message, 'error')
    } finally {
      setAiBusy(false)
    }
  }

  const removeExistingImage = async (url: string) => {
    setExistingImages((prev) => prev.filter((u) => u !== url))
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!supabase) return
    if (!form.title.trim() || !Number(form.price)) {
      toast('Title and numeric price required.', 'error')
      return
    }
    setBusy(true)
    try {
      console.log('Saving property with is_available:', form.is_available, 'is_published:', form.is_published)
      const row = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        admin_description: form.admin_description.trim() || null,
        ai_generated_description: aiText || null,
        price: Number(form.price),
        price_type: form.price_type,
        bedrooms: form.bedrooms === '' ? null : Number(form.bedrooms),
        bathrooms: form.bathrooms === '' ? null : Number(form.bathrooms),
        property_type: form.property_type,
        county: form.county.trim(),
        town: form.town.trim(),
        area_label: form.area_label.trim() || null,
        estate: form.estate.trim() || null,
        address: form.address.trim() || null,
        latitude: form.latitude === '' ? null : Number(form.latitude),
        longitude: form.longitude === '' ? null : Number(form.longitude),
        owner_phone: form.owner_phone.trim() || null,
        is_available: form.is_available,
        is_published: form.is_published,
        furnished: form.furnished,
        size_sqm: form.size_sqm === '' ? null : Number(form.size_sqm),
        deposit_amount: form.deposit_amount === '' ? null : Number(form.deposit_amount),
        water_deposit: form.water_deposit === '' ? null : Number(form.water_deposit),
        electricity_deposit: form.electricity_deposit === '' ? null : Number(form.electricity_deposit),
        water_price_per_unit: form.water_price_per_unit === '' ? null : Number(form.water_price_per_unit),
        has_balcony: form.has_balcony,
        has_rooftop: form.has_rooftop,
      }

      let pid: string

      if (isEdit && id) {
        const { error: upErr } = await supabase.from('properties').update(row).eq('id', id)
        if (upErr) throw upErr
        pid = id

        if (form.amenities.length) {
          await supabase.from('amenities').delete().eq('property_id', pid)
          await supabase.from('amenities').insert(form.amenities.map((name) => ({ property_id: pid, name })))
        }
      } else {
        const { data: prop, error: pe } = await supabase.from('properties').insert(row).select('id').single()
        if (pe || !prop) throw pe ?? new Error('Insert failed')
        pid = prop.id as string

        if (form.amenities.length) {
          await supabase.from('amenities').insert(form.amenities.map((name) => ({ property_id: pid, name })))
        }
      }

      const uploadedUrls: string[] = []
      if (files?.length) {
        for (const file of Array.from(files)) {
          const path = `${pid}/${crypto.randomUUID()}-${file.name.replace(/\s+/g, '_')}`
          const { error: upErr } = await supabase.storage.from('property-images').upload(path, file)
          if (upErr) throw upErr
          const { data: pub } = supabase.storage.from('property-images').getPublicUrl(path)
          uploadedUrls.push(pub.publicUrl)
        }
      }

      const allImages = [...existingImages, ...uploadedUrls]

      if (isEdit && id) {
        if (uploadedUrls.length > 0) {
          await supabase.from('property_images').insert(
            uploadedUrls.map((image_url, i) => ({
              property_id: pid,
              image_url,
              is_cover: allImages.length === uploadedUrls.length ? i === 0 : false,
              sort_order: existingImages.length + i,
            })),
          )
        }
        if (allImages.length > 0) {
          await supabase.from('properties').update({ cover_image_url: allImages[0] }).eq('id', pid)
        }
      } else {
        if (uploadedUrls.length > 0) {
          await supabase.from('property_images').insert(
            uploadedUrls.map((image_url, i) => ({
              property_id: pid,
              image_url,
              is_cover: i === 0,
              sort_order: i,
            })),
          )
          await supabase.from('properties').update({ cover_image_url: uploadedUrls[0] }).eq('id', pid)
        }
      }

      toast(isEdit ? 'Property updated' : 'Property listed successfully!', 'success')
      queryClient.invalidateQueries({ queryKey: ['public-properties'] })
      queryClient.invalidateQueries({ queryKey: ['public-properties-all'] })
      queryClient.invalidateQueries({ queryKey: ['properties'] })
      navigate('/admin')
    } catch (err) {
      toast((err as Error).message, 'error')
    } finally {
      setBusy(false)
    }
  }

  if (loadingData) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-[600px] w-full" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">{isEdit ? 'Edit property' : 'Ingress a listing'}</h1>
        <p className="text-sm text-zinc-500 mt-2">
          {isEdit
            ? 'Update fields below. Images can be added or removed.'
            : 'Public cards show only county / town / area_label. Estate, address, coords &amp; owner phone stay admin-only.'}
        </p>
      </div>

      <form onSubmit={onSubmit} className="glass-card space-y-4 p-6">
        <input
          className="input-ht"
          placeholder="Marketing title"
          value={form.title}
          required
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <input
            type="number"
            className="input-ht"
            placeholder="Price (KSh)"
            required
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
          />
          <select
            className="input-ht"
            value={form.price_type}
            onChange={(e) => setForm({ ...form, price_type: e.target.value })}
          >
            <option value="monthly">Monthly rent</option>
            <option value="sale">Sale</option>
            <option value="negotiable">Negotiable anchor</option>
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <input
            className="input-ht"
            placeholder="Bedrooms"
            type="number"
            value={form.bedrooms}
            onChange={(e) => setForm({ ...form, bedrooms: e.target.value })}
          />
          {shouldShowBathrooms(form.bedrooms ? Number(form.bedrooms) : null, form.property_type) && (
            <input
              className="input-ht"
              placeholder="Bathrooms"
              type="number"
              value={form.bathrooms}
              onChange={(e) => setForm({ ...form, bathrooms: e.target.value })}
            />
          )}
        </div>

        <select
          className="input-ht capitalize"
          value={form.property_type}
          onChange={(e) => {
            const val = e.target.value
            setForm({ ...form, property_type: val, ...(shouldShowBathrooms(form.bedrooms ? Number(form.bedrooms) : null, val) ? {} : { bathrooms: '' }) })
          }}
        >
          {['apartment', 'bedsitter', 'bungalow', 'maisonette', 'studio', 'townhouse', 'bnb', 'land', 'commercial'].map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer hover:text-white transition-colors">
            <input type="checkbox" checked={form.furnished} onChange={(e) => setForm({ ...form, furnished: e.target.checked })} className="accent-cyan-500" />
            Furnished
          </label>
          <input
            type="number"
            className="input-ht"
            placeholder="Size (m²)"
            value={form.size_sqm}
            onChange={(e) => setForm({ ...form, size_sqm: e.target.value })}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <select
            className="input-ht"
            required
            value={form.county}
            onChange={(e) => setForm({ ...form, county: e.target.value, town: '' })}
          >
            <option value="">Select county</option>
            {['Nairobi', 'Kiambu', 'Machakos', 'Kajiado', 'Kisumu', 'Mombasa', 'Nakuru', 'Eldoret', 'Nyeri', 'Meru', 'Tharaka Nithi', 'Laikipia', 'Uasin Gishu', 'Kilifi', 'Kwale', 'Taita Taveta', 'Muranga', 'Kirinyaga', 'Embu', 'Makueni', 'Kitui', 'Nandi', 'Kericho', 'Bomet', 'Trans Nzoia', 'Bungoma', 'Busia', 'Siaya', 'Homa Bay', 'Migori', 'Kisii', 'Nyamira', 'Vihiga', 'Kakamega', 'Lamu', 'Garissa', 'Wajir', 'Mandera', 'Marsabit', 'Turkana', 'Samburu', 'Isiolo', 'West Pokot', 'Elgeyo Marakwet', 'Narok', 'Tana River', 'Lamu', 'Taita Taveta'].sort().filter((v, i, a) => a.indexOf(v) === i).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            className="input-ht capitalize"
            required
            value={form.town}
            onChange={(e) => setForm({ ...form, town: e.target.value })}
          >
            <option value="">Select town/area</option>
            {TOWNS_BY_COUNTY[form.county]?.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select
            className="input-ht"
            value={form.area_label}
            onChange={(e) => setForm({ ...form, area_label: e.target.value })}
          >
            <option value="">{form.town === 'Ongata Rongai' ? 'Select Rongai area' : 'Area label / corridor'}</option>
            {form.town === 'Ongata Rongai'
              ? RONGAI_AREAS.map((a) => <option key={a} value={a}>{a}</option>)
              : [form.area_label].filter(Boolean).map((a) => <option key={a} value={a}>{a}</option>)
            }
          </select>
        </div>

        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
          <p className="text-xs font-semibold text-amber-200 uppercase tracking-wider">Internal only</p>
          <input
            className="input-ht bg-black/35"
            placeholder="Estate / neighbourhood"
            value={form.estate}
            onChange={(e) => setForm({ ...form, estate: e.target.value })}
          />
          <input
            className="input-ht bg-black/35"
            placeholder="Full address memo"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDetectLocation}
              disabled={detectingLocation}
              className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-100 hover:bg-cyan-500/20 transition-colors disabled:opacity-50"
            >
              <Navigation className="h-3.5 w-3.5" />
              {detectingLocation ? 'Detecting...' : 'Use my current location'}
            </button>
            {currentLocation && (
              <span className="text-[11px] text-zinc-500">
                Blue dot = your position. Click map to pin property.
              </span>
            )}
          </div>
          <div
            ref={mapContainerRef}
            className="h-[220px] w-full rounded-lg border border-white/10 overflow-hidden"
          />
        <div className={`grid gap-4 ${shouldShowBathrooms(form.bedrooms ? Number(form.bedrooms) : null, form.property_type) ? 'sm:grid-cols-2' : 'sm:grid-cols-1'}`}>
          <input
            className="input-ht"
            placeholder="Bedrooms"
            type="number"
            value={form.bedrooms}
            onChange={(e) => {
              const val = e.target.value
              setForm({ ...form, bedrooms: val, ...(shouldShowBathrooms(val ? Number(val) : null, form.property_type) ? {} : { bathrooms: '' }) })
            }}
          />
          {shouldShowBathrooms(form.bedrooms ? Number(form.bedrooms) : null, form.property_type) && (
            <input
              className="input-ht"
              placeholder="Bathrooms"
              type="number"
              value={form.bathrooms}
              onChange={(e) => setForm({ ...form, bathrooms: e.target.value })}
            />
          )}
        </div>
          <AIGeocodeHelper
            onSelect={(r) => setForm({ ...form, latitude: String(r.lat), longitude: String(r.lng) })}
            currentValue={[form.estate, form.address, form.area_label, form.town].filter(Boolean).join(', ')}
          />
          <input
            className="input-ht bg-black/35"
            placeholder="Owner / agent phone"
            value={form.owner_phone}
            onChange={(e) => setForm({ ...form, owner_phone: e.target.value })}
          />
        </div>

        <textarea
          className="input-ht min-h-[100px]"
          placeholder="Manual description shown to buyers (stay high-level)."
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.03] p-4 space-y-2">
          <p className="text-xs font-semibold text-violet-300 uppercase tracking-wider">Admin note (internal)</p>
          <textarea
            className="input-ht min-h-[80px]"
            placeholder="Internal notes for the team: owner quirks, access instructions, preferred agents, etc."
            value={form.admin_description}
            onChange={(e) => setForm({ ...form, admin_description: e.target.value })}
          />
        </div>
        
        <AIListingParser
          onParsed={(data) => {
            const updates: Record<string, unknown> = {}
            if (data.title) updates.title = data.title
            if (data.price) updates.price = String(data.price)
            if (data.price_type) updates.price_type = data.price_type
            if (data.bedrooms != null) updates.bedrooms = String(data.bedrooms)
            if (data.bathrooms != null) updates.bathrooms = String(data.bathrooms)
            if (data.property_type) updates.property_type = data.property_type
            if (data.county) updates.county = data.county
            if (data.town) updates.town = data.town
            if (data.area_label) updates.area_label = data.area_label
            if (data.estate) updates.estate = data.estate
            if (data.address) updates.address = data.address
            if (data.owner_phone) updates.owner_phone = data.owner_phone
            if (data.description) updates.description = data.description
            if (data.amenities) updates.amenities = data.amenities
            if (data.furnished != null) updates.furnished = data.furnished
            setForm((f) => ({ ...f, ...updates }))
          }}
        />

        <div>
          <p className="text-xs text-zinc-500 mb-2">Amenity chips</p>
          <div className="flex flex-wrap gap-2">
            {AMENITIES.map((a) => (
              <button
                key={a}
                type="button"
                className={`rounded-full px-3 py-1 text-xs border transition-all duration-150 ${
                  form.amenities.includes(a)
                    ? 'bg-violet-500/30 border-violet-400/50 text-white'
                    : 'border-white/10 text-zinc-400 hover:border-white/30'
                }`}
                onClick={() => toggleAmenity(a)}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Financials section */}
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] p-4 space-y-3">
          <p className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">Financials & utilities</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Deposit amount (KSh)</label>
              <input
                type="number"
                className="input-ht"
                placeholder="e.g. 50000"
                value={form.deposit_amount}
                onChange={(e) => setForm({ ...form, deposit_amount: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Water price per unit (KSh)</label>
              <input
                type="number"
                className="input-ht"
                placeholder="e.g. 120"
                value={form.water_price_per_unit}
                onChange={(e) => setForm({ ...form, water_price_per_unit: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Water deposit (KSh)</label>
              <input
                type="number"
                className="input-ht"
                placeholder="e.g. 3000"
                value={form.water_deposit}
                onChange={(e) => setForm({ ...form, water_deposit: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Electricity deposit (KSh)</label>
              <input
                type="number"
                className="input-ht"
                placeholder="e.g. 5000"
                value={form.electricity_deposit}
                onChange={(e) => setForm({ ...form, electricity_deposit: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Existing images */}
        {existingImages.length > 0 && (
          <div>
            <p className="text-xs text-zinc-500 mb-2">Current images ({existingImages.length})</p>
            <div className="flex flex-wrap gap-2">
              {existingImages.map((url) => (
                <div key={url} className="relative group">
                  <img src={url} alt="" className="h-16 w-16 rounded-lg object-cover" />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(url)}
                    className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                  <AIImageGate url={url} />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border border-white/10 rounded-xl p-4 space-y-2">
          <p className="text-xs text-zinc-500 mb-2">
            {isEdit ? 'Add more images' : 'Imagery uploads (Supabase bucket `property-images`)'}
          </p>
          <input
            type="file"
            accept="image/*"
            multiple
            className="text-xs text-zinc-400 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:text-white hover:file:bg-white/20 transition file:cursor-pointer"
            onChange={(e) => setFiles(e.target.files)}
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={aiBusy}
            className="inline-flex items-center gap-2 rounded-xl border border-violet-400/40 bg-violet-500/10 px-4 py-2 text-sm text-violet-100 hover:bg-violet-500/20 transition-colors"
            onClick={() => runGemini()}
          >
            <Sparkles className="h-4 w-4" /> {aiBusy ? 'Drafting narrative...' : 'Gemini prose layer'}
          </button>
          {aiText && <span className="text-xs text-zinc-500 self-center">{aiText.length} chars drafted</span>}
        </div>
        {aiText && <textarea readOnly value={aiText} className="input-ht min-h-[120px]" />}

        <div className="flex flex-wrap gap-6 text-sm">
          <label className="flex items-center gap-2 text-zinc-300 cursor-pointer hover:text-white transition-colors">
            <input type="checkbox" checked={form.is_available} onChange={(e) => setForm({ ...form, is_available: e.target.checked })} className="accent-cyan-500" />
            Available for rent
          </label>
          <label className="flex items-center gap-2 text-zinc-300 cursor-pointer hover:text-white transition-colors">
            <input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} className="accent-violet-500" />
            Publish to public listings
          </label>
        </div>

        <div className="flex gap-3">
          <button
            disabled={busy}
            type="submit"
            className="flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 py-3 text-sm font-bold text-trace-dusk disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {busy ? 'Saving...' : isEdit ? 'Update property' : 'Save listing'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="rounded-xl border border-white/15 px-6 py-3 text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
      <style>{`
        .input-ht {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgb(255 255 255 / 0.1);
          background: rgb(0 0 0 / 0.35);
          padding: 0.65rem 0.85rem;
          font-size: 0.875rem;
          color: #f8fafc;
          transition: border-color 0.2s;
        }
        .input-ht:focus {
          outline: none;
          border-color: rgb(34 211 238 / 0.5);
        }
        .input-ht::placeholder { color: rgb(161 161 170); }
      `}</style>
    </div>
  )
}
