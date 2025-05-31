// frontend/src/components/SignUpView.tsx
import React, { useState, useCallback } from 'react';
import {
  Box,
  Link,
  Divider,
  TextField,
  IconButton,
  Typography,
  InputAdornment,
  Modal,
  Fade,
  Backdrop,
  Button,
} from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';
import { useRouter } from 'src/routes/hooks';
import { Iconify } from 'src/components/iconify';
import { signup, verifyOtp } from 'src/utils/api';

// Styles for the OTP Modal
const modalStyle = {
  position: 'absolute' as const,
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 300,
  bgcolor: 'background.paper',
  borderRadius: 2,
  boxShadow: 24,
  p: 4,
};

export function SignUpView() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otp, setOtp] = useState('');
  const [userId, setUserId] = useState('');
  const [error, setError] = useState('');

  // Handle input changes with proper typing
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle form submission with event typing
  const handleSignUp = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setLoading(true);
      setError('');

      const { name, email, password, confirmPassword } = formData;

      if (password !== confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }

      try {
        const data = await signup(name, email, password);
        setUserId(data.userId);
        setOtpModalOpen(true);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Signup failed');
      } finally {
        setLoading(false);
      }
    },
    [formData]
  );

  const handleVerifyOtp = async () => {
    setLoading(true);
    setError('');

    try {
      await verifyOtp(formData.email, otp);
      setOtpModalOpen(false);
      router.push('/'); // Redirect after successful OTP verification
    } catch (err: any) {
      setError(err.response?.data?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const renderForm = (
    <Box
      component="form"
      onSubmit={handleSignUp}
      display="flex"
      flexDirection="column"
      alignItems="flex-end"
    >
      <TextField
        fullWidth
        name="name"
        label="Name"
        placeholder="John Doe"
        value={formData.name}
        onChange={handleChange}
        InputLabelProps={{ shrink: true }}
        sx={{ mb: 3 }}
        required
      />
      <TextField
        fullWidth
        name="email"
        label="Email Address"
        placeholder="john.doe@example.com"
        type="email"
        value={formData.email}
        onChange={handleChange}
        InputLabelProps={{ shrink: true }}
        sx={{ mb: 3 }}
        required
      />
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
                <Iconify icon={showPassword ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{ mb: 3 }}
        required
      />
      <TextField
        fullWidth
        name="confirmPassword"
        label="Confirm Password"
        placeholder="Re-enter your password"
        type={showConfirmPassword ? 'text' : 'password'}
        value={formData.confirmPassword}
        onChange={handleChange}
        InputLabelProps={{ shrink: true }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                edge="end"
                aria-label="toggle confirm password visibility"
              >
                <Iconify icon={showConfirmPassword ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{ mb: 3 }}
        required
      />
      {error && (
        <Typography color="error" sx={{ mb: 2, alignSelf: 'center' }}>
          {error}
        </Typography>
      )}
      <LoadingButton
        fullWidth
        size="large"
        type="submit"
        color="inherit"
        variant="contained"
        loading={loading}
      >
        Sign up
      </LoadingButton>
    </Box>
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
        <Typography variant="h5">Sign up</Typography>
        <Typography variant="body2" color="text.secondary">
          Already have an account?
          <Link href="/sign-in" variant="subtitle2" sx={{ ml: 0.5 }}>
            Sign in
          </Link>
        </Typography>
      </Box>

      {renderForm}

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
            // Add your Microsoft login logic here
          }}
        >
          Continue with Microsoft
        </LoadingButton>
      </Box>

      {/* OTP Verification Modal */}
      <Modal
        open={otpModalOpen}
        onClose={() => setOtpModalOpen(false)}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
        }}
        aria-labelledby="otp-verification-modal"
      >
        <Fade in={otpModalOpen}>
          <Box sx={modalStyle}>
            <Typography id="otp-verification-modal" variant="h6" component="h2" sx={{ mb: 2 }}>
              Enter OTP
            </Typography>
            <TextField
              fullWidth
              label="OTP"
              placeholder="Enter the 6-digit OTP"
              value={otp}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOtp(e.target.value)}
              sx={{ mb: 3 }}
              required
            />
            {error && (
              <Typography color="error" sx={{ mb: 2 }}>
                {error}
              </Typography>
            )}
            <Button
              variant="contained"
              fullWidth
              onClick={handleVerifyOtp}
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </Button>
          </Box>
        </Fade>
      </Modal>
    </>
  );
}
