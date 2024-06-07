'use client';

import React from 'react';

import { Input } from './input';
import { Button } from './button';
import { Eye, EyeOff } from 'lucide-react';

type Props = {} & React.InputHTMLAttributes<HTMLInputElement>;

export const Password = React.forwardRef<HTMLInputElement, Props>(
  ({ ...props }, ref) => {
    const [show, setShow] = React.useState(false);

    return (
      <div className='flex items-center space-x-2'>
        <Input type={show ? 'text' : 'password'} ref={ref} {...props} />
        <Button
          type='button'
          variant='outline'
          size='icon'
          onClick={() => setShow(!show)}
          tabIndex={-1}
        >
          {show ? (
            <EyeOff className='size-4'></EyeOff>
          ) : (
            <Eye className='size-4' />
          )}
        </Button>
      </div>
    );
  }
);

Password.displayName = 'Password';
