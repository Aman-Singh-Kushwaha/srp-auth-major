import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { generateClientEphemeral, computeClientProof } from '../utils/srp';

const API_URL = 'http://localhost:3000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(() => localStorage.getItem('sessionId'));

  // Set up axios interceptor for authentication
  useEffect(() => {
    const interceptor = api.interceptors.request.use(
      (config) => {
        if (sessionId) {
          config.headers.Authorization = sessionId;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    return () => {
      api.interceptors.request.eject(interceptor);
    };
  }, [sessionId]);

  // Try to restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      if (sessionId && !userData) {
        try {
          console.log('Attempting to restore session:', { sessionId });
          const response = await api.get('/protected');
          console.log('Session restored successfully:', response.data);
          setUserData(response.data);
        } catch (err) {
          console.log('Session restoration failed:', err.message);
          localStorage.removeItem('sessionId');
          setSessionId(null);
        }
      }
    };
    restoreSession();
  }, [sessionId, userData]);

  const register = useCallback(async (username, password) => {
      setIsLoading(true);
      setError(null);
      console.log('Starting registration process...');

      try {
          const response = await api.post('/register', {
              username,
              password,
          });

          if (response.data.success) {
              console.log('Registration successful');
              return true;
          }
          return false;
      } catch (err) {
          console.error('Registration error:', err);
          setError(err.response?.data?.error || 'Registration failed');
          return false;
      } finally {
          setIsLoading(false);
      }
  }, []);

  const login = useCallback(async (username, password) => {
      setIsLoading(true);
      setError(null);
      console.log('Starting login process...');

      try {
          // Step 1: Initialize login
          const initResponse = await api.post('/login/init', { username });
          const { salt, serverPublicEphemeral, sessionId: newSessionId } = initResponse.data;
          console.log('Login initialized:', { salt, newSessionId });

          // Step 2: Generate client ephemeral and compute session key
          const clientEphemeral = generateClientEphemeral();
          console.log('Generated client ephemeral:', {
              publicKey: clientEphemeral.publicKey
          });

          const clientProof = computeClientProof(
              username,
              password,
              salt,
              clientEphemeral,
              serverPublicEphemeral
          );
          console.log('Computed client proof');

          // Step 3: Verify login
          const verifyResponse = await api.post('/login/verify', {
              sessionId: newSessionId,
              clientPublicEphemeral: clientEphemeral.publicKey,
              clientProof,
          });

          if (verifyResponse.data.success) {
              console.log('Login verification successful');
              
              // Store session ID
              localStorage.setItem('sessionId', newSessionId);
              setSessionId(newSessionId);

              // Step 4: Get protected data
              const protectedResponse = await api.get('/protected', {
                  headers: { Authorization: newSessionId }
              });
              console.log('Protected data retrieved:', protectedResponse.data);
              
              setUserData(protectedResponse.data);
              return true;
          }
          return false;
      } catch (err) {
          console.error('Login error:', err);
          setError(err.response?.data?.error || 'Login failed');
          return false;
      } finally {
          setIsLoading(false);
      }
  }, []);

  const logout = useCallback(() => {
      localStorage.removeItem('sessionId');
      setSessionId(null);
      setUserData(null);
      console.log('Logged out successfully');
  }, []);

  return {
      isLoading,
      error,
      userData,
      register,
      login,
      logout,
      isAuthenticated: !!userData
  };
} 