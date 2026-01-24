export const checkPasswordStrength = (password) => {
    let strength = 0;

    // 1. Length check (usually 8-12 is the sweet spot)
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++; // Bonus point for extra length

    // 2. Character variety checks
    if (/[A-Z]/.test(password)) strength++;       // Uppercase
    if (/[a-z]/.test(password)) strength++;       // Lowercase
    if (/[0-9]/.test(password)) strength++;       // Numbers
    if (/[^A-Za-z0-9]/.test(password)) strength++; // Symbols

    // Map the score to a descriptive state or value
    // Max score here is 6
    return strength;
};