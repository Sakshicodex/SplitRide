import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import ChatPage from 'src/sections/chat/ChatPage' 

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {`Chat - ${CONFIG.appName}`}</title>
      </Helmet>

      <ChatPage />
    </>
  );
}
