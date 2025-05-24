import 'src/global.css';


import { LoadScript } from '@react-google-maps/api'; // ✅ IMPORT THIS

import { Router } from 'src/routes/sections';
import { useScrollToTop } from 'src/hooks/use-scroll-to-top';
import { ThemeProvider } from 'src/theme/theme-provider';


// ----------------------------------------------------------------------

const libraries = ['places']; // ✅ You need this for Autocomplete

export default function App() {
  useScrollToTop();


  return (
    <ThemeProvider>
      <LoadScript googleMapsApiKey="AIzaSyB1FL4hF8actfjd_5PgMAyxv9Zz2lN_Imw" libraries={libraries}>
        <Router />
      </LoadScript>
    
    </ThemeProvider>
  );
}
