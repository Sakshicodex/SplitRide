import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { TripDetailsPage } from 'src/sections/rides/view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {`Find Ride - ${CONFIG.appName}`}</title>
      </Helmet>

      <TripDetailsPage />
    </>
  );
}
