import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, username: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Don't attempt to get session if Supabase is not properly configured
    if (!import.meta.env.VITE_SUPABASE_URL?.includes('.supabase.co')) {
      setLoading(false)
      return
    }

    let isMounted = true
    let subscription: any = null

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (isMounted) {
          setSession(session)
          setUser(session?.user ?? null)
        }
      } catch (error: any) {
        if (error?.message?.includes('Failed to fetch')) {
          console.debug('Supabase connection unavailable during initialization')
        } else {
          console.error('Error getting session:', error)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    initAuth()

    // Listen for auth changes
    try {
      const result = supabase.auth.onAuthStateChange((_event, session) => {
        if (isMounted) {
          setSession(session)
          setUser(session?.user ?? null)
          setLoading(false)
        }
      })
      subscription = result.data?.subscription
    } catch (error) {
      console.debug('Could not set up auth subscription')
    }

    return () => {
      isMounted = false
      subscription?.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    if (!import.meta.env.VITE_SUPABASE_URL?.includes('.supabase.co')) {
      throw new Error('Supabase is not configured. Please add valid VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.')
    }
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
    } catch (error: any) {
      if (error.message?.includes('Failed to fetch')) {
        throw new Error('Unable to connect to Supabase. Please check your configuration in .env file.')
      }
      throw error
    }
  }

  const signUp = async (email: string, password: string, username: string) => {
    if (!import.meta.env.VITE_SUPABASE_URL?.includes('.supabase.co')) {
      throw new Error('Supabase is not configured. Please add valid VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.')
    }
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
        },
      })
      if (error) throw error
    } catch (error: any) {
      if (error.message?.includes('Failed to fetch')) {
        throw new Error('Unable to connect to Supabase. Please check your configuration in .env file.')
      }
      throw error
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}