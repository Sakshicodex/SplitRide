import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { ProfilePage } from 'src/sections/profile/profile-view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {`Profile - ${CONFIG.appName}`}</title>
      </Helmet>

      <ProfilePage />
    </>
  );
}
