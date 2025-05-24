import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { YourRides } from 'src/sections/rides/view/yourRides';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {`Find Ride - ${CONFIG.appName}`}</title>
      </Helmet>

      <YourRides />
    </>
  );
}
