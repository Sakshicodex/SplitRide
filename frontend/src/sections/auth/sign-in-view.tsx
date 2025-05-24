// src/components/SignInView.tsx

import React, { useState, useCallback } from 'react';
import {
  Box,
  Link,
  Divider,
  TextField,
  IconButton,
  Typography,
  Alert,
  InputAdornment,
} from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Iconify } from 'src/components/iconify';
import { useAuth } from 'src/context/AuthContext';

// ----------------------------------------------------------------------

export function SignInView() {
  const navigate = useNavigate();
  const { login, loading, error } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [localError, setLocalError] = useState<string | null>(null);

  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignIn = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setLocalError(null);

      const { email, password } = formData;

      if (!email || !password) {
        setLocalError('Please enter both email and password.');
        return;
      }

      try {
        await login(email, password);
        navigate('/'); // Redirect to home after successful login
      } catch (err) {
        // Error handling is managed in AuthContext
      }
    },
    [formData, login, navigate]
  );

  return (
    <>
      <Box
        gap={1.5}
        display="flex"
        flexDirection="column"
        alignItems="center"
        sx={{ mb: 5 }}
      >
        <Typography variant="h5">Sign in</Typography>
        <Typography variant="body2" color="text.secondary">
          Don’t have an account?
          <Link
            component={RouterLink}
            to="/sign-up"
            variant="subtitle2"
            sx={{ ml: 0.5 }}
          >
            Get started
          </Link>
        </Typography>
      </Box>

      <Box
        component="form"
        onSubmit={handleSignIn}
        display="flex"
        flexDirection="column"
        alignItems="flex-end"
      >
        {error && (
          <Alert severity="error" sx={{ mb: 2, width: '100%' }}>
            {error}
          </Alert>
        )}
        {localError && (
          <Alert severity="error" sx={{ mb: 2, width: '100%' }}>
            {localError}
          </Alert>
        )}

        <TextField
          fullWidth
          name="email"
          label="Email address"
          placeholder="john.doe@example.com"
          value={formData.email}
          onChange={handleChange}
          InputLabelProps={{ shrink: true }}
          sx={{ mb: 3 }}
          required
          type="email"
        />

        <Link
          component={RouterLink}
          to="/forgot-password"
          variant="body2"
          color="inherit"
          sx={{ mb: 1.5 }}
        >
          Forgot password?
        </Link>

        <TextField
          fullWidth
          name="password"
          label="Password"
          placeholder="Enter your password"
          type={showPassword ? 'text' : 'password'}
          value={formData.password}
          onChange={handleChange}
          InputLabelProps={{ shrink: true }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                  aria-label="toggle password visibility"
                >
                  <Iconify
                    icon={
                      showPassword
                        ? 'solar:eye-bold'
                        : 'solar:eye-closed-bold'
                    }
                  />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{ mb: 3 }}
          required
        />

        <LoadingButton
          fullWidth
          size="large"
          type="submit"
          color="inherit"
          variant="contained"
          loading={loading}
        >
          Sign in
        </LoadingButton>
      </Box>

      <Divider sx={{ my: 3, '&::before, &::after': { borderTopStyle: 'dashed' } }}>
        <Typography
          variant="overline"
          sx={{ color: 'text.secondary', fontWeight: 'fontWeightMedium' }}
        >
          OR
        </Typography>
      </Divider>

      <Box display="flex" justifyContent="center">
      <LoadingButton
  fullWidth
  size="large"
  variant="outlined"
  startIcon={<Iconify icon="logos:microsoft-icon" />}
  sx={{
    borderColor: 'text.secondary',
    color: 'text.secondary',
    textTransform: 'none',
    fontWeight: 'bold',
  }}
  onClick={() => {
    // Redirect to the backend's Microsoft OAuth route
    window.location.href = 'http://localhost:5000/api/users/microsoft';
  }}
>
  Continue with Microsoft
</LoadingButton>

      </Box>
    </>
  );
}
