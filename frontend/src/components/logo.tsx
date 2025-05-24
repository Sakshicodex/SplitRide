// src/components/logo.tsx
import React from 'react';
import { Box, Typography } from '@mui/material';

export function Logo() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1 }}>
      {/* serve straight from public/ */}
      <img src="/favicon.png" alt="SplitRide" width={48} height={48} />
      
    </Box>
  );
}
