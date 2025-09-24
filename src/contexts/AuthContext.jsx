import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    console.log('AuthProvider: Starting authentication check...')
    
    // For NoCode Backend, we'll use a simple local storage based auth
    // since we don't have built-in authentication like Supabase
    const initializeAuth = async () => {
      try {
        // Check for existing session in localStorage
        const savedUser = localStorage.getItem('servicetracker_user')
        const savedProfile = localStorage.getItem('servicetracker_profile')
        
        if (savedUser && savedProfile) {
          console.log('AuthProvider: Found saved session')
          setUser(JSON.parse(savedUser))
          setUserProfile(JSON.parse(savedProfile))
        } else {
          console.log('AuthProvider: No saved session found')
        }
      } catch (err) {
        console.error('AuthProvider: Initialization error:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const createUserProfile = async (userData, profileData) => {
    try {
      console.log('createUserProfile: Creating profile for user:', userData.email, profileData)

      const profilePayload = {
        user_id: userData.id,
        email: profileData.email,
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        company_name: profileData.company_name || '',
        subscription_tier: 'free',
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days from now
      }

      // For NoCode Backend, we would need to implement user profile storage
      // For now, we'll store it locally
      setUserProfile(profilePayload)
      localStorage.setItem('servicetracker_profile', JSON.stringify(profilePayload))

      console.log('createUserProfile: Profile created successfully:', profilePayload)
      return { data: profilePayload, error: null }

    } catch (error) {
      console.error('createUserProfile: Error creating profile:', error)
      return { data: null, error }
    }
  }

  const signUp = async (email, password, firstName, lastName, companyName = '') => {
    try {
      console.log('signUp: Starting signup process for:', email)
      setLoading(true)

      // For NoCode Backend, implement your own user registration logic
      // This is a simplified version using localStorage
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const userData = {
        id: userId,
        email,
        created_at: new Date().toISOString()
      }

      // Save user data
      setUser(userData)
      localStorage.setItem('servicetracker_user', JSON.stringify(userData))

      // Create user profile
      await createUserProfile(userData, {
        email,
        first_name: firstName,
        last_name: lastName,
        company_name: companyName
      })

      console.log('signUp: Signup completed successfully')
      return { data: { user: userData }, error: null }

    } catch (error) {
      console.error('signUp: Signup failed:', error)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email, password) => {
    try {
      console.log('signIn: Starting signin process for:', email)
      setLoading(true)
      setError(null)

      // For NoCode Backend, implement your own authentication logic
      // This is a simplified version that accepts any email/password
      const userData = {
        id: `user_${email.replace('@', '_').replace('.', '_')}`,
        email,
        created_at: new Date().toISOString()
      }

      // Save user data
      setUser(userData)
      localStorage.setItem('servicetracker_user', JSON.stringify(userData))

      // Create a basic profile if none exists
      const existingProfile = localStorage.getItem('servicetracker_profile')
      if (!existingProfile) {
        await createUserProfile(userData, {
          email,
          first_name: email.split('@')[0],
          last_name: 'User',
          company_name: ''
        })
      } else {
        setUserProfile(JSON.parse(existingProfile))
      }

      console.log('signIn: Signin completed successfully')
      return { data: { user: userData }, error: null }

    } catch (error) {
      console.error('signIn: Signin failed:', error)
      setError(error.message)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      console.log('signOut: Starting signout process')
      setLoading(true)

      // Clear local storage
      localStorage.removeItem('servicetracker_user')
      localStorage.removeItem('servicetracker_profile')

      // Clear state
      setUser(null)
      setUserProfile(null)

      console.log('signOut: Signout completed successfully')
      return { error: null }

    } catch (error) {
      console.error('signOut: Signout failed:', error)
      setError(error.message)
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const updateSubscription = async (tier) => {
    try {
      if (!user) throw new Error('No user logged in')
      
      console.log('updateSubscription: Updating subscription to:', tier)

      const updatedProfile = {
        ...userProfile,
        subscription_tier: tier
      }

      setUserProfile(updatedProfile)
      localStorage.setItem('servicetracker_profile', JSON.stringify(updatedProfile))

      console.log('updateSubscription: Subscription updated successfully')
      return { data: updatedProfile, error: null }

    } catch (error) {
      console.error('updateSubscription: Error updating subscription:', error)
      setError(error.message)
      return { data: null, error }
    }
  }

  // Subscription helpers
  const isSubscribed = userProfile?.subscription_tier !== 'free'
  const isPremium = userProfile?.subscription_tier === 'premium'
  const isTrialExpired = userProfile?.trial_ends_at 
    ? new Date(userProfile.trial_ends_at) < new Date() 
    : false

  const value = {
    user,
    userProfile,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    updateSubscription,
    createUserProfile,
    isSubscribed,
    isPremium,
    isTrialExpired
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}