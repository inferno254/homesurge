import { useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, Navigate } from 'react-router-dom'
import {
  User, Heart, MessageSquare, Home, LogOut, ChevronRight, Search, Star,
  Camera, Save, X, Loader2, Calendar
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useFavorites } from '../hooks/useFavorites'
import { PropertyCard } from '../components/PropertyCard'
import { FadeIn } from '../components/FadeIn'
import type { PublicPropertyRow } from '../types/property'

async function fetchMyInquiries(userId: string): Promise<any[]> {
  if (!supabase) return []
  const { data } = await supabase
    .from('property_inquiries')
    .select('*, properties(title, listing_reference, town, county)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10)
  return data ?? []
}

async function fetchPublicProperties(): Promise<PublicPropertyRow[]> {
  if (!supabase) return []
  const { data } = await supabase.rpc('fetch_public_properties')
  return (data ?? []) as PublicPropertyRow[]
}

export function CustomerDashboard() {
  const { user, fullName, signOut, role } = useAuth()
  const { favorites, count: favCount } = useFavorites()
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState(fullName || '')
  const fileRef = useRef<HTMLInputElement>(null)

  const propertiesQ = useQuery({
    queryKey: ['public-properties-all'],
    queryFn: fetchPublicProperties,
    enabled: Boolean(supabase),
  })

  const inquiriesQ = useQuery({
    queryKey: ['my-inquiries', user?.id],
    queryFn: () => fetchMyInquiries(user!.id),
    enabled: Boolean(user?.id && supabase),
  })

  const savedProperties = (propertiesQ.data ?? []).filter((p) => favorites.includes(p.id))

  if (role === 'admin' || role === 'updater') {
    return <Navigate to="/admin" replace />
  }

  const displayName = fullName || user?.email?.split('@')[0] || 'there'
  const avatarUrl = (user?.user_metadata as any)?.avatar_url || null

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user || !supabase) return

    setUploading(true)
    try {
      const path = `avatars/${user.id}/${crypto.randomUUID()}-${file.name.replace(/\s+/g, '_')}`
      const { error: upErr } = await supabase.storage.from('profile-avatars').upload(path, file)
      if (upErr) throw upErr

      const { data: pub } = supabase.storage.from('profile-avatars').getPublicUrl(path)
      const publicUrl = pub.publicUrl

      await supabase.auth.updateUser({ data: { avatar_url: publicUrl } })
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id)

      window.location.reload()
    } catch (err) {
      console.error('Upload failed:', err)
    } finally {
      setUploading(false)
    }
  }

  const handleSaveName = async () => {
    if (!user || !nameValue.trim() || !supabase) return
    setSaving(true)
    try {
      await supabase.from('profiles').update({ full_name: nameValue.trim() }).eq('id', user.id)
      setEditingName(false)
      window.location.reload()
    } catch (err) {
      console.error('Save failed:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveAvatar = async () => {
    if (!user || !supabase) return
    setUploading(true)
    try {
      await supabase.auth.updateUser({ data: { avatar_url: null } })
      await supabase.from('profiles').update({ avatar_url: null }).eq('id', user.id)
      window.location.reload()
    } catch (err) {
      console.error('Remove failed:', err)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      {/* Profile Hero */}
      <FadeIn>
        <div className="relative rounded-3xl border border-white/[0.08] bg-trace-card overflow-hidden mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-trace-cyan/5 via-transparent to-trace-violet/5" />
          <div className="relative p-8 md:p-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex items-center gap-5">
                {/* Avatar */}
                <div className="relative group">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-trace-cyan to-trace-violet shadow-glow overflow-hidden">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-10 w-10 text-trace-dusk" />
                    )}
                  </div>
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="Change photo"
                  >
                    {uploading ? (
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    ) : (
                      <Camera className="h-6 w-6 text-white" />
                    )}
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </div>

                <div>
                  {editingName ? (
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="text"
                        value={nameValue}
                        onChange={(e) => setNameValue(e.target.value)}
                        className="glass-input px-3 py-1.5 text-sm w-48"
                        placeholder="Your name"
                      />
                      <button
                        onClick={handleSaveName}
                        disabled={saving}
                        className="btn-primary rounded-lg px-3 py-1.5 text-xs"
                      >
                        {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                      </button>
                      <button
                        onClick={() => setEditingName(false)}
                        className="btn-ghost rounded-lg px-2 py-1.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="font-display text-3xl md:text-4xl font-bold text-white">
                        Hi, {displayName}
                      </h1>
                      <button
                        onClick={() => setEditingName(true)}
                        className="text-zinc-500 hover:text-white transition-colors"
                        title="Edit name"
                      >
                        <Camera className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                  <p className="text-sm text-zinc-500">
                    {user?.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {avatarUrl && (
                  <button
                    onClick={handleRemoveAvatar}
                    disabled={uploading}
                    className="btn-ghost rounded-xl text-xs"
                  >
                    <X className="h-3.5 w-3.5" />
                    Remove photo
                  </button>
                )}
                <button
                  onClick={signOut}
                  className="btn-ghost rounded-xl text-xs"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Quick Actions */}
      <FadeIn delay={100}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { to: '/browse', icon: Search, label: 'Browse', desc: 'Find homes', color: 'cyan' },
            { to: '/saved', icon: Heart, label: 'Saved', desc: `${favCount} listings`, color: 'rose' },
            { to: '/compare', icon: Star, label: 'Compare', desc: 'Side by side', color: 'violet' },
            { to: '/browse', icon: Home, label: 'Listings', desc: `${propertiesQ.data?.length ?? 0} available`, color: 'amber' },
          ].map((item, i) => (
            <Link
              key={i}
              to={item.to}
              className="group relative flex flex-col items-center gap-3 rounded-2xl border border-white/[0.08] bg-trace-card p-6 text-center transition-all duration-300 hover:border-white/[0.15] hover:shadow-card-hover hover:-translate-y-0.5"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-colors ${
                item.color === 'cyan' ? 'bg-trace-cyan/10 text-trace-cyan group-hover:bg-trace-cyan/15' :
                item.color === 'rose' ? 'bg-rose-400/10 text-rose-400 group-hover:bg-rose-400/15' :
                item.color === 'violet' ? 'bg-trace-violet/10 text-trace-violet group-hover:bg-trace-violet/15' :
                'bg-amber-400/10 text-amber-400 group-hover:bg-amber-400/15'
              }`}>
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{item.label}</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </FadeIn>

      {/* Stats */}
      <FadeIn delay={150}>
        <div className="grid gap-4 sm:grid-cols-3 mb-8">
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-400/10 border border-rose-400/20">
                <Heart className="h-4.5 w-4.5 text-rose-400" />
              </div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Saved</p>
            </div>
            <p className="font-display text-3xl font-bold text-white">{favCount}</p>
            <p className="text-xs text-zinc-600 mt-1">Listings saved</p>
          </div>
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/10 border border-cyan-400/20">
                <MessageSquare className="h-4.5 w-4.5 text-cyan-400" />
              </div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Inquiries</p>
            </div>
            <p className="font-display text-3xl font-bold text-white">{inquiriesQ.data?.length ?? 0}</p>
            <p className="text-xs text-zinc-600 mt-1">Total sent</p>
          </div>
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-400/10 border border-violet-400/20">
                <Calendar className="h-4.5 w-4.5 text-trace-violet" />
              </div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Member since</p>
            </div>
            <p className="font-display text-lg font-bold text-white">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-KE', { month: 'short', year: 'numeric' }) : '—'}
            </p>
          </div>
        </div>
      </FadeIn>

      {/* Saved listings */}
      {savedProperties.length > 0 && (
        <FadeIn delay={200}>
          <div className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl font-bold text-white">Your saved homes</h2>
              <Link to="/saved" className="text-sm text-trace-cyan hover:text-trace-cyan-light transition-colors flex items-center gap-1">
                View all <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {savedProperties.slice(0, 3).map((p, i) => (
                <FadeIn key={p.id} delay={i * 80}>
                  <PropertyCard property={p} />
                </FadeIn>
              ))}
            </div>
          </div>
        </FadeIn>
      )}

      {/* Recent inquiries */}
      {inquiriesQ.data && inquiriesQ.data.length > 0 && (
        <FadeIn delay={300}>
          <div className="mb-10">
            <h2 className="font-display text-xl font-bold text-white mb-6">Recent inquiries</h2>
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="divide-y divide-white/[0.05]">
                {inquiriesQ.data.slice(0, 5).map((inq: any) => (
                  <div key={inq.id} className="px-5 py-4 hover:bg-white/[0.015] transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-white">
                          {inq.properties?.title ?? 'Unknown property'}
                        </p>
                        <p className="text-xs text-zinc-500 mt-1">
                          {inq.properties?.town ?? ''} {inq.properties?.county ?? ''}
                        </p>
                        <p className="text-xs text-zinc-600 mt-1">
                          {new Date(inq.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-1 rounded-lg ${
                        inq.resolved
                          ? 'bg-emerald-400/10 text-emerald-300 border border-emerald-400/20'
                          : 'bg-amber-400/10 text-amber-300 border border-amber-400/20'
                      }`}>
                        {inq.resolved ? 'Resolved' : 'Pending'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </FadeIn>
      )}

      {/* Empty state */}
      {favCount === 0 && (!inquiriesQ.data || inquiriesQ.data.length === 0) && (
        <FadeIn delay={200}>
          <div className="glass-card rounded-3xl p-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.03] border border-white/[0.06] mx-auto mb-5">
              <Home className="h-7 w-7 text-zinc-600" />
            </div>
            <p className="text-zinc-400 mb-2 text-lg font-medium">Your home search starts here</p>
            <p className="text-sm text-zinc-600 mb-8 max-w-sm mx-auto">
              Browse listings, save your favorites, and send inquiries — all in one place.
            </p>
            <Link
              to="/browse"
              className="btn-primary rounded-2xl px-6 py-3 text-sm inline-flex"
            >
              <Search className="h-4 w-4" />
              Start browsing
            </Link>
          </div>
        </FadeIn>
      )}
    </div>
  )
}
