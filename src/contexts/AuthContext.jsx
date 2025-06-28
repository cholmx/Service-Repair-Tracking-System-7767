import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthProvider: Starting authentication check...');
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('AuthProvider: Initial session check:', { session: !!session, error });
      
      if (error) {
        console.error('AuthProvider: Session error:', error);
        setLoading(false);
        return;
      }
      
      setUser(session?.user ?? null);
      if (session?.user) {
        console.log('AuthProvider: User found, fetching profile...');
        fetchUserProfile(session.user.id);
      } else {
        console.log('AuthProvider: No user session found');
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthProvider: Auth state changed:', { event, session: !!session });
        
        setUser(session?.user ?? null);
        if (session?.user) {
          console.log('AuthProvider: User authenticated, fetching profile...');
          await fetchUserProfile(session.user.id);
        } else {
          console.log('AuthProvider: User signed out');
          setUserProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      console.log('AuthProvider: Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId) => {
    try {
      console.log('fetchUserProfile: Fetching profile for user:', userId);
      
      const { data, error } = await supabase
        .from('user_profiles_st847291')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.log('fetchUserProfile: Profile fetch error:', error);
        if (error.code === 'PGRST116') {
          console.log('fetchUserProfile: No profile found, user needs to complete setup');
          // Profile doesn't exist yet, this is okay for new users
        } else {
          console.error('fetchUserProfile: Database error:', error);
        }
      } else if (data) {
        console.log('fetchUserProfile: Profile found:', data);
        setUserProfile(data);
      }
    } catch (error) {
      console.error('fetchUserProfile: Unexpected error:', error);
    } finally {
      setLoading(false);
    }
  };

  const createUserProfile = async (userId, profileData) => {
    try {
      console.log('createUserProfile: Creating profile for user:', userId, profileData);
      
      const profilePayload = {
        user_id: userId,
        email: profileData.email,
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        company_name: profileData.company_name || '',
        subscription_tier: 'free',
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days from now
      };

      const { data, error } = await supabase
        .from('user_profiles_st847291')
        .insert([profilePayload])
        .select()
        .single();

      if (error) {
        console.error('createUserProfile: Insert error:', error);
        throw error;
      }
      
      console.log('createUserProfile: Profile created successfully:', data);
      setUserProfile(data);
      return { data, error: null };
    } catch (error) {
      console.error('createUserProfile: Error creating profile:', error);
      return { data: null, error };
    }
  };

  const signUp = async (email, password, firstName, lastName, companyName = '') => {
    try {
      console.log('signUp: Starting signup process for:', email);
      setLoading(true);
      
      // Sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            company_name: companyName
          }
        }
      });

      console.log('signUp: Auth signup result:', { data: !!data, error });

      if (error) {
        console.error('signUp: Authentication error:', error);
        throw error;
      }

      // Create user profile if user was created
      if (data.user) {
        console.log('signUp: User created, creating profile...');
        await createUserProfile(data.user.id, {
          email,
          first_name: firstName,
          last_name: lastName,
          company_name: companyName
        });
      }

      console.log('signUp: Signup completed successfully');
      return { data, error: null };
    } catch (error) {
      console.error('signUp: Signup failed:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email, password) => {
    try {
      console.log('signIn: Starting signin process for:', email);
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      console.log('signIn: Auth signin result:', { data: !!data, error });

      if (error) {
        console.error('signIn: Authentication error:', error);
        throw error;
      }

      console.log('signIn: Signin completed successfully');
      return { data, error: null };
    } catch (error) {
      console.error('signIn: Signin failed:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      console.log('signOut: Starting signout process');
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('signOut: Signout error:', error);
        throw error;
      }
      
      console.log('signOut: Signout completed successfully');
      setUser(null);
      setUserProfile(null);
      return { error: null };
    } catch (error) {
      console.error('signOut: Signout failed:', error);
      return { error };
    }
  };

  const updateSubscription = async (tier) => {
    try {
      if (!user) throw new Error('No user logged in');

      console.log('updateSubscription: Updating subscription to:', tier);

      const { data, error } = await supabase
        .from('user_profiles_st847291')
        .update({ subscription_tier: tier })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      console.log('updateSubscription: Subscription updated successfully');
      setUserProfile(data);
      return { data, error: null };
    } catch (error) {
      console.error('updateSubscription: Error updating subscription:', error);
      return { data: null, error };
    }
  };

  // Subscription helpers
  const isSubscribed = userProfile?.subscription_tier !== 'free';
  const isPremium = userProfile?.subscription_tier === 'premium';
  const isTrialExpired = userProfile?.trial_ends_at ? 
    new Date(userProfile.trial_ends_at) < new Date() : false;

  const value = {
    user,
    userProfile,
    loading,
    signUp,
    signIn,
    signOut,
    updateSubscription,
    createUserProfile,
    isSubscribed,
    isPremium,
    isTrialExpired
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};