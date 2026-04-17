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
  id: number;
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
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    fetchPolicies();
  }, [router]);

  async function fetchPolicies() {
    setLoading(true);
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/policies`;
    try {
      const res = await apiFetch(apiUrl);
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }
      const data = await res.json();
      setPolicies(data || []);
    } catch (err) {
      console.error('Failed to fetch policies:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/policies/${id}`, {
        method: 'DELETE',
      });
      setPolicies((prev) => prev.filter((p) => p.id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  }

  async function handleClearAll() {
    try {
      for (const policy of policies) {
        await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/policies/${policy.id}`, {
          method: 'DELETE',
        });
      }
      setPolicies([]);
      setShowClearConfirm(false);
    } catch (err) {
      console.error('Failed to clear all:', err);
    }
  }

  const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getScoreBadge = (score: number) => {
    if (score >= 8) return 'success';
    if (score >= 6) return 'info';
    if (score >= 4) return 'warning';
    return 'danger';
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full border-4 border-border border-t-primary animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading policies...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-12">
        {/* Header */}
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

        {/* Empty State */}
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
            {/* Policies Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              {policies.map((policy, idx) => (
                <motion.div
                  key={policy.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="hover:border-primary/30 hover:shadow-lg group cursor-pointer transition-all duration-200">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                            {policy.file_name}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1">{policy.file_size}</p>
                        </div>
                        <Badge variant="primary" size="md">
                          {policy.policy_type}
                        </Badge>
                      </div>

                      {/* Score */}
                      <div className="p-4 rounded-lg bg-secondary">
                        <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Coverage Score</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold text-foreground">{policy.coverage_score}</span>
                          <span className="text-lg text-muted-foreground">/10</span>
                        </div>
                        <div className="mt-2 w-full bg-border rounded-full h-1.5">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all"
                            style={{ width: `${(policy.coverage_score / 10) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Date & Badge */}
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

                      {/* Actions */}
                      <div className="flex gap-2 pt-2 border-t border-border">
                        <Button
                          variant="secondary"
                          size="sm"
                          fullWidth
                          leftIcon={<Eye className="w-4 h-4" />}
                          onClick={() => {
                            // Navigate to policy detail
                            router.push(`/dashboard/policy/${policy.id}`);
                          }}
                        >
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            setDeleteConfirm(policy.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <Card className="w-full max-w-sm">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Delete Policy?</h3>
                      <p className="text-sm text-muted-foreground mt-2">
                        This action cannot be undone. Are you sure?
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        fullWidth
                        onClick={() => setDeleteConfirm(null)}
                      >
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
                </Card>
              </div>
            )}

            {/* Clear All Confirmation Modal */}
            {showClearConfirm && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <Card className="w-full max-w-sm">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Clear All Policies?</h3>
                      <p className="text-sm text-muted-foreground mt-2">
                        This will permanently delete all {policies.length} saved policies. This action cannot be undone.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        fullWidth
                        onClick={() => setShowClearConfirm(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        fullWidth
                        onClick={handleClearAll}
                      >
                        Delete All
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
