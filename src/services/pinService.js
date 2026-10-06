export const validatePin = async (enteredPin) => {
  try {
    const response = await fetch('/api/verify-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: enteredPin }),
      signal: AbortSignal.timeout(10000)
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      return { isValid: false, error: result.error || 'Unable to verify PIN. Please try again.' };
    }

    return { isValid: result.isValid === true };
  } catch (err) {
    console.error('Unexpected error during PIN validation:', err);
    return { isValid: false, error: 'Unable to verify PIN. Please try again.' };
  }
};
