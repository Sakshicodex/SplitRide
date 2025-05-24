import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { styled, alpha } from '@mui/material/styles';
import { Iconify } from 'src/components/iconify';
import { DashboardContent } from 'src/layouts/dashboard';
import { AnalyticsWidgetSummary } from '../analytics-widget-summary';
import { useNavigate } from 'react-router-dom';

// ----------------------------------------------------------------------
const StyledWelcomeBanner = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  marginBottom: theme.spacing(5),
  backgroundImage: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(
    theme.palette.primary.dark,
    0.2
  )})`,
  [theme.breakpoints.up('md')]: {
    padding: theme.spacing(6),
  },
}));


export function OverviewAnalyticsView() {
    const navigate = useNavigate();
  // Dummy data for statistics
  const statistics = {
    ridesPosted: 5,
    ridesJoined: 12,
    totalDistance: 350, // in kilometers (optional)
    costSaved: 150,      // in dollars (optional)
  };

  return (
    <DashboardContent maxWidth="lg">
      {/* Welcome Section */}
      <StyledWelcomeBanner elevation={0}>
        <Typography variant="h3" gutterBottom sx={{ mb: 2 }}>
          Hi, Welcome back! 👋
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
          Manage your rides and connect with fellow students effortlessly.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Iconify icon="mdi:car-outline" />}
            onClick={() => navigate('/post-ride')}  // ← navigate
          >
            Create Ride
          </Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<Iconify icon="mdi:account-plus-outline" />}
            onClick={() => navigate('/rides')}         // ← navigate
          >
            Join Ride
          </Button>
          
        </Box>
      </StyledWelcomeBanner>


      {/* Statistics Overview */}
      <Box sx={{ mb: 5 }}>
        <Typography variant="h5" gutterBottom>
          Statistics Overview
        </Typography>
        <Grid container spacing={3}>
          {/* Rides Posted */}
          <Grid xs={12} sm={6} md={3}>
            <AnalyticsWidgetSummary
              title="Rides Posted"
              percent={10.5}
              total={statistics.ridesPosted}
              icon={<Iconify icon="mdi:car-hatchback" />}
              chart={{
                categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                series: [1, 2, 1, 1, 0, 0, 0],
              }}
              color="primary"
            />
          </Grid>

          {/* Rides Joined */}
          <Grid xs={12} sm={6} md={3}>
            <AnalyticsWidgetSummary
              title="Rides Joined"
              percent={-5.2}
              total={statistics.ridesJoined}
              icon={<Iconify icon="mdi:car-plus" />}
              chart={{
                categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                series: [2, 1, 2, 1, 1, 2, 3],
              }}
              color="secondary"
            />
          </Grid>

          {/* Total Distance Traveled (Optional) */}
          <Grid xs={12} sm={6} md={3}>
            <AnalyticsWidgetSummary
              title="Total Distance"
              percent={8.3}
              total={statistics.totalDistance}
              icon={<Iconify icon="mdi:road" />}
              chart={{
                categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
                series: [50, 60, 55, 70, 80, 65, 75, 90],
              }}
              color="success"
            />
          </Grid>

          {/* Cost Saved (Optional) */}
          <Grid xs={12} sm={6} md={3}>
            <AnalyticsWidgetSummary
              title="Cost Saved"
              percent={12.7}
              total={statistics.costSaved}
              icon={<Iconify icon="mdi:cash" />}
              chart={{
                categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
                series: [100, 120, 110, 130, 150, 140, 160, 180],
              }}
              color="warning"
            />
          </Grid>
        </Grid>
      </Box>
    </DashboardContent>
  );
}
