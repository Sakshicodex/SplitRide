// frontend/src/app.tsx
import { LoadScript } from '@react-google-maps/api';
import type { Library } from '@googlemaps/js-api-loader';
import { Router } from 'src/routes/sections';
import { useScrollToTop } from 'src/hooks/use-scroll-to-top';
import { ThemeProvider } from 'src/theme/theme-provider';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const libraries: Library[] = ['places'];

export default function App() {
  useScrollToTop();

  return (
    <ThemeProvider>
      <LoadScript
        googleMapsApiKey={GOOGLE_MAPS_API_KEY}
        libraries={libraries}
      >
        <Router />
      </LoadScript>
    </ThemeProvider>
  );
}
