// src/layouts/components/AccountPopover.tsx
import type { IconButtonProps } from '@mui/material/IconButton';
import { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Button,
  Avatar,
  Popover,
  Divider,
  MenuList,
  MenuItem,
  Typography,
  IconButton,
  ListItemIcon
} from '@mui/material';
import { Iconify } from 'src/components/iconify';
import { useAuth } from 'src/context/AuthContext';

export function AccountPopover(props: IconButtonProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  if (!user) return null;

  const open = Boolean(anchorEl);
  const handleOpen = useCallback((e) => setAnchorEl(e.currentTarget), []);
  const handleClose = useCallback(() => setAnchorEl(null), []);
  const handleNav = (path: string) => {
    handleClose();
    if (path === '/logout') {
      logout();
      navigate('/sign-in', { replace: true });
    } else {
      navigate(path);
    }
  };

  return (
    <>
      <IconButton onClick={handleOpen} sx={{ p: 0, width: 40, height: 40 }} {...props}>
        <Avatar src={user.photoURL} alt={user.name} sx={{ width: 1, height: 1 }}>
          {user.name[0].toUpperCase()}
        </Avatar>
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { width: 220 } }}
      >
        <Box sx={{ p: 2, pb: 1.5 }}>
          <Typography variant="subtitle1" fontWeight="bold" noWrap>
            {user.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {user.email}
          </Typography>
        </Box>

        <Divider sx={{ borderStyle: 'dashed' }} />

        <MenuList disablePadding sx={{ p: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <MenuItem selected={location.pathname === '/'} onClick={() => handleNav('/')}>
            <ListItemIcon><Iconify icon="eva:home-fill" className="w-5 h-5" /></ListItemIcon>
            Home
          </MenuItem>
          <MenuItem selected={location.pathname === '/profile'} onClick={() => handleNav('/profile')}>
            <ListItemIcon><Iconify icon="eva:person-fill" className="w-5 h-5" /></ListItemIcon>
            Profile
          </MenuItem>
        </MenuList>

        <Divider sx={{ borderStyle: 'dashed' }} />

        <Box sx={{ p: 1 }}>
          <Button
            fullWidth
            color="error"
            startIcon={<Iconify icon="eva:log-out-outline" className="w-5 h-5" />}
            onClick={() => handleNav('/logout')}
          >
            Logout
          </Button>
        </Box>
      </Popover>
    </>
  );
}
