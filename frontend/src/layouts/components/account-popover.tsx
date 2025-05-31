// frontend/src/layouts/components/AccountPopover.tsx
import React, { useState, useCallback, type MouseEvent } from 'react';
import type { IconButtonProps } from '@mui/material/IconButton';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Divider,
  Avatar,
  Popover,
  MenuList,
  MenuItem,
  Typography,
  IconButton,
  ListItemIcon
} from '@mui/material';
import { Iconify } from 'src/components/iconify';
import { useAuth } from 'src/context/AuthContext';

// Define menu item structure
type AccountMenuItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

// Extend IconButtonProps to accept optional menu data
interface AccountPopoverProps extends IconButtonProps {
  data?: AccountMenuItem[];
}

export function AccountPopover({ data, ...props }: AccountPopoverProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  if (!user) return null;

  const open = Boolean(anchorEl);
  const handleOpen = useCallback((e: MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget), []);
  const handleClose = useCallback(() => setAnchorEl(null), []);
  const handleNav = (href: string) => {
    handleClose();
    if (href === '/logout') {
      logout();
      navigate('/sign-in', { replace: true });
    } else {
      navigate(href);
    }
  };

  const defaultItems: AccountMenuItem[] = [
    { label: 'Home', href: '/', icon: <Iconify icon="eva:home-fill" /> },
    { label: 'Profile', href: '/profile', icon: <Iconify icon="eva:person-fill" /> },
    { label: 'Logout', href: '/logout', icon: <Iconify icon="eva:log-out-outline" /> }
  ];

  const menuItems = data ?? defaultItems;
  const userInitial = user.name.charAt(0).toUpperCase();

  return (
    <>
      <IconButton onClick={handleOpen} sx={{ p: 0, width: 40, height: 40 }} {...props}>
        <Avatar sx={{ width: 1, height: 1 }}>{userInitial}</Avatar>
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
          {menuItems.map((item) => (
            <MenuItem
              key={item.href}
              selected={location.pathname === item.href}
              onClick={() => handleNav(item.href)}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
              {item.label}
            </MenuItem>
          ))}
        </MenuList>
      </Popover>
    </>
  );
}
