import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, Copy, RefreshCw, Mail, Globe } from 'lucide-react';
import { getDomainStatus, startVerification, verifyDomain } from '../../api/domain';
import { useAuthStore } from '../../store/authStore';
import { DomainStatus } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';

export const DomainVerification: React.FC = () => {
  const { setOrgVerified } = useAuthStore();
  const [status, setStatus] = useState<DomainStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [startLoading, setStartLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [emailToken, setEmailToken] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const s = await getDomainStatus();
      setStatus(s);
      if (s.verified) setOrgVerified(true);
    } catch {
      setError('Failed to load domain status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStatus(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStartDns = async () => {
    setStartLoading(true);
    setError('');
    try {
      const res = await startVerification('dns');
      setMessage(res.message);
      await fetchStatus();
    } catch (e: unknown) {
      setError((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed to start verification');
    } finally {
      setStartLoading(false);
    }
  };

  const handleStartEmail = async () => {
    setStartLoading(true);
    setError('');
    try {
      const res = await startVerification('email');
      setMessage(res.message);
      await fetchStatus();
    } catch (e: unknown) {
      setError((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed to start verification');
    } finally {
      setStartLoading(false);
    }
  };

  const handleVerify = async () => {
    setVerifyLoading(true);
    setError('');
    try {
      const res = await verifyDomain(
        status?.verificationMethod === 'email' ? emailToken : undefined
      );
      if (res.verified) {
        setOrgVerified(true);
        setMessage('Domain verified! You now have full access.');
        await fetchStatus();
      } else {
        setError('Verification not confirmed yet.');
      }
    } catch (e: unknown) {
      setError((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Verification failed');
    } finally {
      setVerifyLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-400 text-sm">Loading…</div>;
  }

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      {/* Status header */}
      <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 bg-white">
        {status?.verified ? (
          <CheckCircle size={24} className="text-green-500 shrink-0" />
        ) : (
          <AlertCircle size={24} className="text-yellow-500 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900">
            {status?.domain ?? 'Unknown domain'}
          </p>
          <p className="text-sm text-gray-500">
            {status?.verified
              ? `Verified ${status.verifiedAt ? new Date(status.verifiedAt).toLocaleDateString() : ''} via ${status.verificationMethod?.toUpperCase()}`
              : 'Domain not yet verified'}
          </p>
        </div>
        <Badge variant={status?.verified ? 'green' : 'yellow'}>
          {status?.verified ? 'Verified' : 'Pending'}
        </Badge>
      </div>

      {message && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          {message}
        </div>
      )}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {!status?.verified && (
        <>
          {/* Option A: DNS */}
          <section className="border border-gray-200 rounded-xl p-4 bg-white flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Globe size={18} className="text-brand-600" />
              <h3 className="font-semibold text-gray-800">Option A — DNS TXT Record</h3>
            </div>
            <p className="text-sm text-gray-600">
              Add a TXT record to your domain's DNS settings. DNS changes can take up to 48 hours
              to propagate.
            </p>

            {status?.verificationMethod === 'dns' && status.txtRecord && (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-gray-500">Add this TXT record to your DNS:</p>
                <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
                  <code className="flex-1 text-xs text-gray-800 break-all">{status.txtRecord}</code>
                  <button
                    onClick={() => copyToClipboard(status.txtRecord!)}
                    className="text-gray-400 hover:text-brand-600 shrink-0"
                    title="Copy"
                  >
                    <Copy size={14} />
                  </button>
                </div>
                {copied && <span className="text-xs text-green-600">Copied!</span>}

                <Button
                  onClick={handleVerify}
                  loading={verifyLoading}
                  icon={<RefreshCw size={14} />}
                  variant="secondary"
                  size="sm"
                >
                  Check DNS record
                </Button>
              </div>
            )}

            <Button
              onClick={handleStartDns}
              loading={startLoading}
              size="sm"
              variant={status?.verificationMethod === 'dns' ? 'secondary' : 'primary'}
            >
              {status?.verificationMethod === 'dns' ? 'Regenerate DNS token' : 'Use DNS verification'}
            </Button>
          </section>

          {/* Option B: Email */}
          <section className="border border-gray-200 rounded-xl p-4 bg-white flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Mail size={18} className="text-brand-600" />
              <h3 className="font-semibold text-gray-800">Option B — Email Verification</h3>
            </div>
            <p className="text-sm text-gray-600">
              We will send a verification code to{' '}
              <code className="text-xs bg-gray-100 px-1 rounded">
                admin@{status?.domain}
              </code>.
            </p>

            {status?.verificationMethod === 'email' && (
              <div className="flex flex-col gap-2">
                <Input
                  label="Enter the code from the email"
                  value={emailToken}
                  onChange={(e) => setEmailToken(e.target.value)}
                  placeholder="Verification code"
                />
                <Button
                  onClick={handleVerify}
                  loading={verifyLoading}
                  size="sm"
                  disabled={!emailToken}
                >
                  Verify code
                </Button>
              </div>
            )}

            <Button
              onClick={handleStartEmail}
              loading={startLoading}
              size="sm"
              variant={status?.verificationMethod === 'email' ? 'secondary' : 'primary'}
            >
              {status?.verificationMethod === 'email' ? 'Resend verification email' : 'Use email verification'}
            </Button>
          </section>
        </>
      )}

      <button
        onClick={fetchStatus}
        className="text-xs text-brand-600 hover:underline self-start"
      >
        Refresh status
      </button>
    </div>
  );
};
