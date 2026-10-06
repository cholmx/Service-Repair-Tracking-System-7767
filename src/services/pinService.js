import supabase from '../lib/supabase';

export const validatePin = async (enteredPin) => {
  try {
    const { data, error } = await supabase.rpc('verify_pin', { p_pin: enteredPin });

    if (error) {
      console.error('Error verifying PIN:', error);
      return { isValid: false, error: 'Unable to verify PIN. Please try again.' };
    }

    return { isValid: data?.valid === true, error: data?.error };
  } catch (err) {
    console.error('Unexpected error during PIN validation:', err);
    return { isValid: false, error: 'Unable to verify PIN. Please try again.' };
  }
};
