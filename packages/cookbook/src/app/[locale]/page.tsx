'use client';

import React from 'react';
import { Link } from '@/navigation';
import { useTranslations } from 'next-intl';

const Page = () => {
  const t = useTranslations('Index');
  const [data, setData] = React.useState(null);

  React.useEffect(() => {
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
      <h1>{t('title')}</h1>
      <Link
        href={`${process.env.NEXT_PUBLIC_AUTH_URL}/api/auth/signin/google?redirectUrl=${process.env.NEXT_PUBLIC_BASE_URL}`}
      >
        Login with Google
      </Link>
      <hr></hr>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </main>
  );
};

export default Page;
