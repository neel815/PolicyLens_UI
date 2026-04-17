'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, isAuthenticated } from '@/lib/auth';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Section } from '@/components/Section';
import { EmptyState } from '@/components/EmptyState';
import { Trash2, FileText, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardPolicy {
  id: number;              // integer from DB (not UUID string)
  file_name: string;
  file_size: string;
  policy_type: string;
  coverage_score: number;
  created_at: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [policies, setPolicies] = useState<DashboardPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    // Check auth on mount
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    fetchPolicies();
  }, [router]);

  async function fetchPolicies() {
    setLoading(true);
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/policies`;
    console.log('📍 Fetching from:', apiUrl);
    
    try {
      const res = await apiFetch(apiUrl);
      
      // Log response status for debugging
      console.log('✅ Response status:', res.status, res.statusText);
      
      if (!res.ok) {
        const errorData = await res.text();
        console.error('❌ API Error:', {
          status: res.status,
          statusText: res.statusText,
          body: errorData
        });
        throw new Error(`API error: ${res.status} ${res.statusText} - ${errorData}`);
      }
      
      const data = await res.json();
      console.log('✅ Data received:', data);
      setPolicies(data || []);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Request failed:', errorMsg);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await apiFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/policies/${id}`,
        { method: 'DELETE' }
      );
      setPolicies(prev => prev.filter(p => p.id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  }

  async function handleClearAll() {
    try {
      // Delete all policies one by one or make a bulk delete endpoint
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/policies`;
      await Promise.all(
        policies.map(p =>
          apiFetch(`${apiUrl}/${p.id}`, { method: 'DELETE' })
        )
      );
      setPolicies([]);
      setShowClearConfirm(false);
    } catch (err) {
      console.error('Failed to clear all:', err);
    }
  }

  // Helper function to format file size in MB (same as landing page)
  function formatFileSize(bytes: number | string): string {
    let numBytes: number;

    // Handle string input (already formatted like "1.5 MB" or just the number as string)
    if (typeof bytes === 'string') {
      // If it already has "MB" in it, return as is
      if (bytes.includes('MB')) {
        return bytes;
      }
      numBytes = parseFloat(bytes);
    } else {
      numBytes = bytes;
    }

    // If it's already in a reasonable range (0.001 to 1000), assume it's already in MB
    if (numBytes > 0.001 && numBytes < 1000) {
      if (numBytes < 0.01) {
        return numBytes.toFixed(3) + " MB";
      } else {
        return numBytes.toFixed(2) + " MB";
      }
    }

    // Otherwise, convert from bytes
    const mb = numBytes / (1024 * 1024);
    if (mb < 0.01) {
      return mb.toFixed(3) + " MB";
    } else {
      return mb.toFixed(2) + " MB";
    }
  }

  const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getScoreColor = (score: number): { text: string; bg: string } => {
    if (score >= 8) return { text: '#ffffff', bg: '#059669' };
    if (score >= 6) return { text: '#ffffff', bg: '#1A3FBE' };
    if (score >= 4) return { text: '#ffffff', bg: '#D97706' };
    return { text: '#ffffff', bg: '#DC2626' };
  };

  const getScoreBarColor = (score: number): string => {
    if (score >= 8) return '#059669';
    if (score >= 6) return '#1A3FBE';
    if (score >= 4) return '#D97706';
    return '#DC2626';
  };

  const getScoreBadge = (score: number): 'success' | 'primary' | 'warning' | 'danger' => {
    if (score >= 8) return 'success';
    if (score >= 6) return 'primary';
    if (score >= 4) return 'warning';
    return 'danger';
  };

  const getPolicyIcon = (type: string) => {
    switch (type) {
      case 'Health':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9h-2.5V9.5h-2v3.5H8v2h3.5v3.5h2v-3.5h3.5v-2z" />
          </svg>
        );
      case 'Car':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm11 0c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM5 11l1.5-4.5h11L19 11H5z" />
          </svg>
        );
      case 'Home':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
        );
      case 'Life':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
          </svg>
        );
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-12">
        <Section
          title="My Policies"
          subtitle={`You have ${policies.length} saved polic${policies.length === 1 ? 'y' : 'ies'}`}
          rightElement={
            policies.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => setShowClearConfirm(true)}>
                Clear All
              </Button>
            )
          }
          spacing="relaxed"
        />

        {policies.length === 0 ? (
          <Card className="mt-8">
            <EmptyState
              icon={<FileText className="w-6 h-6" />}
              title="No policies yet"
              description="Upload and analyze your first insurance policy to get started"
              action={{
                label: 'Upload Policy',
                onClick: () => router.push('/'),
              }}
            />
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              {policies.map((policy, idx) => (
                <motion.div
                  key={policy.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="hover:border-primary/30 hover:shadow-lg cursor-pointer transition-all">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate hover:text-primary transition-colors">
                            {policy.file_name}
                          </h3>
                          <p className="text-sm font-medium text-foreground/70 mt-1">{formatFileSize(policy.file_size)}</p>
                        </div>
                        <Badge variant="primary" size="md">
                          {policy.policy_type}
                        </Badge>
                      </div>

                      <div className="p-4 rounded-lg bg-secondary">
                        <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">
                          Coverage Score
                        </p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold text-foreground">{policy.coverage_score}</span>
                          <span className="text-lg text-muted-foreground">/10</span>
                        </div>
                        <div className="mt-2 w-full bg-border rounded-full h-1.5">
                          <div
                            className="h-full rounded-full bg-linear-to-r from-primary to-accent"
                            style={{ width: `${(policy.coverage_score / 10) * 100}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{formatDate(policy.created_at)}</span>
                        <Badge variant={getScoreBadge(policy.coverage_score)} size="sm">
                          {policy.coverage_score >= 8
                            ? 'Excellent'
                            : policy.coverage_score >= 6
                              ? 'Good'
                              : policy.coverage_score >= 4
                                ? 'Fair'
                                : 'Limited'}
                        </Badge>
                      </div>

                      <div className="flex gap-2 pt-2 border-t border-border">
                        <Button
                          variant="secondary"
                          size="sm"
                          fullWidth
                          leftIcon={<Eye className="w-4 h-4" />}
                          onClick={() => router.push(`/dashboard/policy/${policy.id}`)}
                        >
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirm(policy.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>

            {deleteConfirm && (
              <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                <div className="modal-card-enhanced w-full max-w-sm p-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Delete Policy?</h3>
                      <p className="text-sm text-muted-foreground mt-2">
                        This action cannot be undone. Are you sure?
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" size="sm" fullWidth onClick={() => setDeleteConfirm(null)}>
                        Cancel
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        fullWidth
                        onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {showClearConfirm && (
              <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                <div className="modal-card-enhanced w-full max-w-sm p-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Clear All Policies?</h3>
                      <p className="text-sm text-muted-foreground mt-2">
                        This will permanently delete all {policies.length} saved policies.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" size="sm" fullWidth onClick={() => setShowClearConfirm(false)}>
                        Cancel
                      </Button>
                      <Button variant="danger" size="sm" fullWidth onClick={handleClearAll}>
                        Delete All
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
