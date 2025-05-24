import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Button,
  TextField,
  Grid,
  Paper,
  CircularProgress,
  Avatar,
} from '@mui/material';
import { Icon } from '@iconify/react';
import api from 'src/utils/api';
import { useAuth } from 'src/context/AuthContext';

export function ProfilePage() {
  const { updateUser } = useAuth();

  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    profilePicture: '',
  });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [errors, setErrors] = useState<any>({});
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const BACKEND_BASE_URL =
    import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:5000';

  // fetch profile
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/profile');
        setProfileData({
          name: data.name || '',
          email: data.email || '',
          phoneNumber: data.phoneNumber || '',
          profilePicture: data.profilePicture || '',
        });
      } catch {
        setSubmitError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData((p) => ({ ...p, [name]: value }));
  };

  // handle image pick
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = (ev) =>
      setProfileData((p) => ({
        ...p,
        profilePicture: ev.target?.result as string,
      }));
    reader.readAsDataURL(file);
  };

  // simple validation
  const validate = () => {
    const temp: any = {};
    temp.name = profileData.name.trim() ? '' : 'Name is required';
    temp.email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)
      ? ''
      : 'Invalid email';
    temp.phoneNumber =
      profileData.phoneNumber === '' ||
      /^\d{10}$/.test(profileData.phoneNumber)
        ? ''
        : 'Invalid phone number';
    setErrors(temp);
    return Object.values(temp).every((x) => x === '');
  };

  // submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const fd = new FormData();
      fd.append('name', profileData.name);
      fd.append('email', profileData.email);
      fd.append('phoneNumber', profileData.phoneNumber);
      if (selectedImage) fd.append('profilePicture', selectedImage);

      const res = await api.put('/profile', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const u = res.data.user;
      const pic = u.profilePicture.startsWith('http')
        ? u.profilePicture
        : `${BACKEND_BASE_URL}${u.profilePicture}`;

      // update local
      setProfileData({
        name: u.name,
        email: u.email,
        phoneNumber: u.phoneNumber,
        profilePicture: pic,
      });

      // update global auth
      updateUser({ photoURL: pic, name: u.name, email: u.email });

      setSubmitSuccess('Profile updated successfully');
      setEditing(false);
      setSelectedImage(null);
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || 'Failed to update');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          minHeight: '60vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4, background: '#f0f2f5', minHeight: '100vh' }}>
      <Paper sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
        <Typography variant="h5" align="center" gutterBottom>
          Profile
        </Typography>

        {submitError && <Typography color="error">{submitError}</Typography>}
        {submitSuccess && (
          <Typography color="primary">{submitSuccess}</Typography>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2} justifyContent="center">
            {/* Avatar */}
            <Grid item xs={12} textAlign="center">
              <Avatar
                src={
                  profileData.profilePicture.startsWith('http')
                    ? profileData.profilePicture
                    : `${BACKEND_BASE_URL}${profileData.profilePicture}`
                }
                sx={{ width: 100, height: 100, mx: 'auto' }}
              />
              {editing && (
                <Box mt={1}>
                  <label htmlFor="upload-avatar">
                    <input
                      id="upload-avatar"
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={handleImageChange}
                    />
                    <Icon
                      icon="mdi:camera"
                      style={{ fontSize: 24, cursor: 'pointer' }}
                    />
                  </label>
                </Box>
              )}
            </Grid>

            {/* Fields */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Name"
                name="name"
                value={profileData.name}
                onChange={handleChange}
                fullWidth
                disabled={!editing}
                error={!!errors.name}
                helperText={errors.name}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Email"
                name="email"
                type="email"
                value={profileData.email}
                onChange={handleChange}
                fullWidth
                disabled={!editing}
                error={!!errors.email}
                helperText={errors.email}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Phone Number"
                name="phoneNumber"
                value={profileData.phoneNumber}
                onChange={handleChange}
                fullWidth
                disabled={!editing}
                error={!!errors.phoneNumber}
                helperText={errors.phoneNumber}
                required
              />
            </Grid>

            {/* Actions */}
            <Grid item xs={12} textAlign="center">
              {!editing ? (
                <Button variant="contained" onClick={() => setEditing(true)}>
                  Edit Profile
                </Button>
              ) : (
                <Box display="inline-flex" gap={2}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={submitting}
                  >
                    {submitting ? 'Saving…' : 'Save Changes'}
                  </Button>
                  <Button variant="outlined" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                </Box>
              )}
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
}
