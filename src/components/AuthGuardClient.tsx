'use client';

import { usePathname } from 'next/navigation';
import React from 'react';

export default function AuthGuardClient({ 
  children, 
  isPending, 
  isRejected 
}: { 
  children: React.ReactNode; 
  isPending: boolean; 
  isRejected: boolean; 
}) {
  const pathname = usePathname() || '';

  // Allow access to public routes even if the account is pending/rejected.
  const isPublicRoute = pathname === '/' || pathname.startsWith('/blog') || pathname.startsWith('/team') || pathname.startsWith('/announcements');

  if ((isPending || isRejected) && !isPublicRoute) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {isPending ? 'Account Pending Approval' : 'Account Rejected'}
          </h2>
          <p className="text-gray-600 mb-6">
            {isPending 
              ? 'Your account has been created successfully, but an administrator needs to approve your registration before you can access the platform.'
              : 'Unfortunately, your registration has been rejected by an administrator. Please contact support for more information.'
            }
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
