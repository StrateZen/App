
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Anchor, Mail, CheckCircle2, AlertCircle } from 'lucide-react';

/**
 * Sign-in screen. base44 hosted login on its own domain, so the ejected code
 * had no login UI at all. This replaces it with Supabase magic-link auth.
 *
 * Rendered OUTSIDE the auth gate in App.jsx — otherwise requesting a link
 * would require already being signed in, which is a closed loop.
 */
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [errorMessage, setErrorMessage] = useState('');

  const submit = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setStatus('error');
      setErrorMessage('Enter your email address.');
      return;
    }

    setStatus('sending');
    setErrorMessage('');
    try {
      await base44.auth.login(trimmed);
      setStatus('sent');
    } catch (err) {
      setStatus('error');
      setErrorMessage(err.message || 'Could not send the sign-in link.');
    }
  };

  // Enter should submit; there is only one field.
  const onKeyDown = (e) => {
    if (e.key === 'Enter' && status !== 'sending') submit();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">

          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center mb-3">
              <Anchor className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-slate-900">
              Greater Phoenix Division
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              U.S. Coast Guard Auxiliary
            </p>
          </div>

          {status === 'sent' ? (
            <div className="text-center py-4">
              <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto mb-3" />
              <h2 className="font-medium text-slate-900 mb-2">Check your email</h2>
              <p className="text-sm text-slate-600">
                A sign-in link is on its way to <strong>{email}</strong>.
                Open it on this device.
              </p>
              <button
                onClick={() => { setStatus('idle'); setEmail(''); }}
                className="mt-6 text-sm text-slate-500 underline"
              >
                Use a different address
              </button>
            </div>
          ) : (
            <>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Email address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="you@example.org"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-slate-900
                             focus:border-transparent text-slate-900"
                />
              </div>

              {status === 'error' && (
                <div className="mt-3 flex items-start gap-2 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                onClick={submit}
                disabled={status === 'sending'}
                className="w-full mt-5 bg-slate-900 text-white py-2.5 rounded-lg
                           font-medium hover:bg-slate-800 disabled:opacity-50
                           disabled:cursor-not-allowed transition-colors"
              >
                {status === 'sending' ? 'Sending…' : 'Email me a sign-in link'}
              </button>

              <p className="text-xs text-slate-500 mt-4 text-center">
                No password needed. You'll receive a secure link that signs you in.
              </p>
            </>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Access is limited to members on the Division roster.
        </p>
      </div>
    </div>
  );
}
