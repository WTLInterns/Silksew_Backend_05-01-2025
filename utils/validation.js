// utils/validation.js

// Function to validate email format
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  // Function to validate password strength (min length: 6 characters)
  const validatePassword = (password) => {
    return password.length >= 6;
  };
  
  module.exports = { validateEmail, validatePassword };
  