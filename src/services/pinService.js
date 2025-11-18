import supabase from '../lib/supabase';

const OVERRIDE_PIN = '9300';

export const validatePin = async (enteredPin) => {
  if (enteredPin === OVERRIDE_PIN) {
    return { isValid: true, isOverride: true };
  }

  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('setting_value')
      .eq('setting_key', 'app_pin')
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('Error fetching PIN from database:', error);
      return { isValid: false, error: 'Unable to verify PIN. Please try again.' };
    }

    if (!data) {
      return { isValid: false, error: 'PIN not configured. Please contact administrator.' };
    }

    const isValid = enteredPin === data.setting_value;
    return { isValid, isOverride: false };
  } catch (err) {
    console.error('Unexpected error during PIN validation:', err);
    return { isValid: false, error: 'An unexpected error occurred.' };
  }
};

export const updatePin = async (newPin, confirmPin) => {
  if (!newPin || newPin.trim() === '') {
    return { success: false, error: 'PIN cannot be empty.' };
  }

  if (newPin !== confirmPin) {
    return { success: false, error: 'PINs do not match.' };
  }

  if (!/^\d+$/.test(newPin)) {
    return { success: false, error: 'PIN must contain only numbers.' };
  }

  if (newPin.length < 4) {
    return { success: false, error: 'PIN must be at least 4 digits.' };
  }

  if (newPin === OVERRIDE_PIN) {
    return { success: false, error: 'This PIN is reserved. Please choose a different one.' };
  }

  try {
    const { error } = await supabase
      .from('app_settings')
      .update({
        setting_value: newPin,
        updated_at: new Date().toISOString()
      })
      .eq('setting_key', 'app_pin');

    if (error) {
      console.error('Error updating PIN:', error);
      return { success: false, error: 'Failed to update PIN. Please try again.' };
    }

    return { success: true };
  } catch (err) {
    console.error('Unexpected error during PIN update:', err);
    return { success: false, error: 'An unexpected error occurred.' };
  }
};

export const getCurrentPin = async () => {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('setting_value')
      .eq('setting_key', 'app_pin')
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('Error fetching current PIN:', error);
      return { success: false, error: 'Unable to fetch current PIN.' };
    }

    if (!data) {
      return { success: false, error: 'PIN not configured.' };
    }

    return { success: true, pin: data.setting_value };
  } catch (err) {
    console.error('Unexpected error fetching PIN:', err);
    return { success: false, error: 'An unexpected error occurred.' };
  }
};
