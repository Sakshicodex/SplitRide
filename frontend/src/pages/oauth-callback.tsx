// src/pages/oauth-callback.tsx

import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

const OAuthCallbackPage = () => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      height="100vh"
    >
      <CircularProgress />
      <Typography variant="h6" sx={{ mt: 2 }}>
        Processing authentication...
      </Typography>
    </Box>
  );
};

export default OAuthCallbackPage;
