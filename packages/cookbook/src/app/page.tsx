'use client';

import React, { useEffect } from 'react';

const Page = () => {
  const [data, setData] = React.useState(null);

  useEffect(() => {
    const getUser = async () => {
      const response = await (
        await fetch(`${process.env.NEXT_PUBLIC_AUTH_URL}/api/user/profile`, {
          credentials: 'include',
        })
      ).json();
      setData(response);
    };

    getUser();
  }, []);

  return (
    <main>
      <a
        href={`${process.env.NEXT_PUBLIC_AUTH_URL}/api/auth/signin/google?redirectUrl=${process.env.NEXT_PUBLIC_BASE_URL}`}
      >
        Login with Google
      </a>
      <hr></hr>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </main>
  );
};

export default Page;
