# Complete Refactored Page Code - Ready to Copy/Paste

## Dashboard Page (`app/dashboard/page.tsx`)

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Trash2, Eye } from 'lucide-react';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Badge from '@/components/Badge';
import Section from '@/components/Section';
import EmptyState from '@/components/EmptyState';
import { getAuthHeader } from '@/lib/auth';

interface Policy {
  id: number;
  file_name: string;
  file_size: number;
  policy_type: string;
  coverage_score: number;
  created_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPolicyId, setSelectedPolicyId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }
      await fetchPolicies();
    };
    checkAuth();
  }, [router]);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/policies', {
        headers: getAuthHeader(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch policies');
      }

      const data = await response.json();
      setPolicies(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPolicyId) return;

    try {
      setIsDeleting(true);
      const response = await fetch(
        `http://localhost:8000/api/policies/${selectedPolicyId}`,
        {
          method: 'DELETE',
          headers: getAuthHeader(),
        }
      );

      if (!response.ok) throw new Error('Failed to delete policy');

      setPolicies(policies.filter((p) => p.id !== selectedPolicyId));
      setShowDeleteModal(false);
      setSelectedPolicyId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearAll = async () => {
    try {
      setIsDeleting(true);
      const response = await fetch('http://localhost:8000/api/policies/clear', {
        method: 'DELETE',
        headers: getAuthHeader(),
      });

      if (!response.ok) throw new Error('Failed to clear policies');

      setPolicies([]);
      setShowClearModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear');
    } finally {
      setIsDeleting(false);
    }
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 8) return 'success';
    if (score >= 6) return 'primary';
    if (score >= 4) return 'warning';
    return 'danger';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 p-4 bg-danger/10 border border-danger/20 rounded-xl text-danger">
            {error}
          </div>
        )}

        <Section
          title="My Policies"
          subtitle={`You have ${policies.length} policy file${policies.length !== 1 ? 's' : ''}`}
          rightElement={
            policies.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowClearModal(true)}
              >
                Clear All
              </Button>
            )
          }
        />

        {policies.length === 0 ? (
          <EmptyState
            title="No policies yet"
            description="Upload your first insurance policy PDF to get started with AI-powered analysis"
            action={{
              label: 'Upload Policy',
              onClick: () => router.push('/'),
            }}
          />
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {policies.map((policy) => (
              <motion.div key={policy.id} variants={item}>
                <Card className="hover:border-primary/30 hover:shadow-lg cursor-pointer transition-all h-full flex flex-col">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-foreground line-clamp-2 flex-1">
                        {policy.file_name}
                      </h3>
                      <Badge variant="primary" size="md">
                        {policy.policy_type}
                      </Badge>
                    </div>

                    {/* Meta Info */}
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Size: {formatFileSize(policy.file_size)}</p>
                      <p>
                        Added:{' '}
                        {new Date(policy.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Score Card */}
                    <div className="p-4 rounded-lg bg-secondary border border-border">
                      <div className="flex items-end gap-3 mb-3">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            Coverage Score
                          </p>
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-bold text-foreground">
                              {policy.coverage_score}
                            </span>
                            <span className="text-lg text-muted-foreground">
                              /10
                            </span>
                          </div>
                        </div>
                        <Badge
                          variant={getScoreBadgeColor(
                            policy.coverage_score
                          )}
                          size="sm"
                        >
                          {policy.coverage_score >= 8
                            ? 'Excellent'
                            : policy.coverage_score >= 6
                              ? 'Good'
                              : policy.coverage_score >= 4
                                ? 'Fair'
                                : 'Poor'}
                        </Badge>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-border rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all"
                          style={{
                            width: `${Math.min(
                              (policy.coverage_score / 10) * 100,
                              100
                            )}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 mt-auto pt-4">
                      <Button
                        variant="primary"
                        size="sm"
                        fullWidth
                        onClick={() => router.push(`/dashboard/policy/${policy.id}`)}
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedPolicyId(policy.id);
                          setShowDeleteModal(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="max-w-md w-full">
              <h2 className="text-xl font-semibold mb-2">Delete Policy?</h2>
              <p className="text-muted-foreground mb-6">
                This action cannot be undone. The policy will be permanently
                deleted.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  fullWidth
                  isLoading={isDeleting}
                  onClick={handleDelete}
                >
                  Delete
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Clear All Modal */}
        {showClearModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="max-w-md w-full">
              <h2 className="text-xl font-semibold mb-2">Clear All Policies?</h2>
              <p className="text-muted-foreground mb-6">
                This will delete all {policies.length} policies. This action
                cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => setShowClearModal(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  fullWidth
                  isLoading={isDeleting}
                  onClick={handleClearAll}
                >
                  Clear All
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## Battle Page (`app/battle/page.tsx`)

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, Zap } from 'lucide-react';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Badge from '@/components/Badge';
import Select from '@/components/Select';
import Section from '@/components/Section';
import EmptyState from '@/components/EmptyState';
import { getAuthHeader } from '@/lib/auth';

interface Policy {
  id: number;
  file_name: string;
  policy_type: string;
  coverage_score: number;
}

interface BattleResult {
  policy_a_id: number;
  policy_b_id: number;
  policy_a_name: string;
  policy_b_name: string;
  final_score_a: number;
  final_score_b: number;
  winner: string;
  rounds: Array<{
    round_number: number;
    criteria: string;
    score_a: number;
    score_b: number;
    winner: string;
  }>;
}

export default function BattlePage() {
  const router = useRouter();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [battling, setBattling] = useState(false);
  const [selectedPolicyA, setSelectedPolicyA] = useState<string>('');
  const [selectedPolicyB, setSelectedPolicyB] = useState<string>('');
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }
      await fetchPolicies();
    };
    checkAuth();
  }, [router]);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/policies', {
        headers: getAuthHeader(),
      });

      if (!response.ok) throw new Error('Failed to fetch policies');

      const data = await response.json();
      setPolicies(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch policies');
    } finally {
      setLoading(false);
    }
  };

  const handleBattle = async () => {
    if (!selectedPolicyA || !selectedPolicyB) {
      setError('Please select two policies to battle');
      return;
    }

    if (selectedPolicyA === selectedPolicyB) {
      setError('Please select two different policies');
      return;
    }

    try {
      setBattling(true);
      setError(null);

      const response = await fetch('http://localhost:8000/api/battle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          policy_a_id: parseInt(selectedPolicyA),
          policy_b_id: parseInt(selectedPolicyB),
        }),
      });

      if (!response.ok) throw new Error('Failed to start battle');

      const data = await response.json();
      setBattleResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Battle failed');
    } finally {
      setBattling(false);
    }
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 8) return 'success';
    if (score >= 6) return 'primary';
    if (score >= 4) return 'warning';
    return 'danger';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 p-4 bg-danger/10 border border-danger/20 rounded-xl text-danger">
            {error}
          </div>
        )}

        <Section
          title="Policy Battle"
          subtitle="Compare two policies to see which one offers better coverage"
        />

        {policies.length < 2 ? (
          <EmptyState
            title="Not enough policies"
            description="You need at least 2 policies to battle. Upload another policy to get started."
            action={{
              label: 'Upload Policy',
              onClick: () => router.push('/'),
            }}
          />
        ) : (
          <>
            {/* Selection Cards */}
            <motion.div
              className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Policy A Selector */}
              <Card>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Shield className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold">Policy A</h3>
                  </div>

                  <Select
                    label="Select first policy"
                    value={selectedPolicyA}
                    onChange={setSelectedPolicyA}
                    options={policies
                      .filter((p) => p.id !== parseInt(selectedPolicyB))
                      .map((p) => ({
                        value: p.id.toString(),
                        label: `${p.file_name} (${p.policy_type})`,
                      }))}
                  />

                  {selectedPolicyA && (
                    <div className="p-4 rounded-lg bg-secondary border border-border">
                      {(() => {
                        const policy = policies.find(
                          (p) => p.id === parseInt(selectedPolicyA)
                        );
                        return policy ? (
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                              Coverage Score
                            </p>
                            <div className="flex items-end gap-2">
                              <span className="text-2xl font-bold">
                                {policy.coverage_score}
                              </span>
                              <span className="text-muted-foreground">/10</span>
                            </div>
                            <Badge
                              variant={getScoreBadgeColor(
                                policy.coverage_score
                              )}
                              size="sm"
                            >
                              {policy.coverage_score >= 8
                                ? 'Excellent'
                                : 'Good'}
                            </Badge>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  )}
                </div>
              </Card>

              {/* Policy B Selector */}
              <Card>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Shield className="w-6 h-6 text-accent" />
                    </div>
                    <h3 className="text-xl font-semibold">Policy B</h3>
                  </div>

                  <Select
                    label="Select second policy"
                    value={selectedPolicyB}
                    onChange={setSelectedPolicyB}
                    options={policies
                      .filter((p) => p.id !== parseInt(selectedPolicyA))
                      .map((p) => ({
                        value: p.id.toString(),
                        label: `${p.file_name} (${p.policy_type})`,
                      }))}
                  />

                  {selectedPolicyB && (
                    <div className="p-4 rounded-lg bg-secondary border border-border">
                      {(() => {
                        const policy = policies.find(
                          (p) => p.id === parseInt(selectedPolicyB)
                        );
                        return policy ? (
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                              Coverage Score
                            </p>
                            <div className="flex items-end gap-2">
                              <span className="text-2xl font-bold">
                                {policy.coverage_score}
                              </span>
                              <span className="text-muted-foreground">/10</span>
                            </div>
                            <Badge
                              variant={getScoreBadgeColor(
                                policy.coverage_score
                              )}
                              size="sm"
                            >
                              {policy.coverage_score >= 8
                                ? 'Excellent'
                                : 'Good'}
                            </Badge>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>

            {/* Battle Button */}
            <div className="mb-8">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                isLoading={battling}
                onClick={handleBattle}
                disabled={!selectedPolicyA || !selectedPolicyB}
              >
                <Zap className="w-5 h-5" />
                Start Battle
              </Button>
            </div>

            {/* Results */}
            {battleResult && (
              <motion.div
                className="space-y-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {/* Winner */}
                <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30">
                  <div className="text-center space-y-4">
                    <h2 className="text-2xl font-bold">
                      🎉{' '}
                      {battleResult.policy_a_name.split('/')[0] ===
                      battleResult.winner
                        ? 'Policy A'
                        : 'Policy B'}{' '}
                      Wins!
                    </h2>
                    <p className="text-muted-foreground">
                      {battleResult.winner} offers better overall coverage and
                      protection.
                    </p>
                  </div>
                </Card>

                {/* Final Scores */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">
                        {battleResult.policy_a_name}
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Final Score
                          </span>
                          <span className="text-3xl font-bold text-primary">
                            {battleResult.final_score_a}
                          </span>
                        </div>
                        <div className="w-full bg-border rounded-full h-3">
                          <div
                            className="bg-primary h-3 rounded-full transition-all"
                            style={{
                              width: `${Math.min(
                                (battleResult.final_score_a / 100) * 100,
                                100
                              )}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card>
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">
                        {battleResult.policy_b_name}
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Final Score
                          </span>
                          <span className="text-3xl font-bold text-accent">
                            {battleResult.final_score_b}
                          </span>
                        </div>
                        <div className="w-full bg-border rounded-full h-3">
                          <div
                            className="bg-accent h-3 rounded-full transition-all"
                            style={{
                              width: `${Math.min(
                                (battleResult.final_score_b / 100) * 100,
                                100
                              )}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Round Details */}
                <Card>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Round Breakdown</h3>
                    <div className="space-y-3">
                      {battleResult.rounds.map((round, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-lg bg-secondary border border-border space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">
                              Round {round.round_number}:{' '}
                              {round.criteria}
                            </span>
                            <Badge
                              variant={
                                round.winner === 'A'
                                  ? 'primary'
                                  : 'accent'
                              }
                              size="sm"
                            >
                              {round.winner === 'A'
                                ? 'Policy A'
                                : 'Policy B'}
                            </Badge>
                          </div>
                          <div className="flex gap-4">
                            <div className="flex-1">
                              <p className="text-xs text-muted-foreground mb-1">
                                Policy A
                              </p>
                              <div className="w-full bg-border rounded-full h-2">
                                <div
                                  className="bg-primary h-2 rounded-full"
                                  style={{
                                    width: `${Math.min(
                                      (round.score_a / 10) * 100,
                                      100
                                    )}%`,
                                  }}
                                ></div>
                              </div>
                              <p className="text-xs text-foreground mt-1">
                                {round.score_a}/10
                              </p>
                            </div>
                            <div className="flex-1">
                              <p className="text-xs text-muted-foreground mb-1">
                                Policy B
                              </p>
                              <div className="w-full bg-border rounded-full h-2">
                                <div
                                  className="bg-accent h-2 rounded-full"
                                  style={{
                                    width: `${Math.min(
                                      (round.score_b / 10) * 100,
                                      100
                                    )}%`,
                                  }}
                                ></div>
                              </div>
                              <p className="text-xs text-foreground mt-1">
                                {round.score_b}/10
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>

                {/* Actions */}
                <div className="flex gap-4">
                  <Button variant="secondary" size="lg" fullWidth>
                    Battle Again
                  </Button>
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    onClick={() => router.push('/dashboard')}
                  >
                    View All Policies
                  </Button>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
```

---

## Simulate Page (`app/simulate/page.tsx`)

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Sparkles } from 'lucide-react';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Badge from '@/components/Badge';
import Select from '@/components/Select';
import Section from '@/components/Section';
import EmptyState from '@/components/EmptyState';
import { getAuthHeader } from '@/lib/auth';

interface Policy {
  id: number;
  file_name: string;
  policy_type: string;
  coverage_score: number;
}

interface SimulateResult {
  policy_id: number;
  policy_name: string;
  claim_scenario: string;
  is_covered: boolean;
  coverage_percentage: number;
  explanation: string;
  covered_aspects: string[];
  not_covered_aspects: string[];
}

export default function SimulatePage() {
  const router = useRouter();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<string>('');
  const [scenario, setScenario] = useState('');
  const [simulateResult, setSimulateResult] = useState<SimulateResult | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }
      await fetchPolicies();
    };
    checkAuth();
  }, [router]);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/policies', {
        headers: getAuthHeader(),
      });

      if (!response.ok) throw new Error('Failed to fetch policies');

      const data = await response.json();
      setPolicies(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch policies');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulate = async () => {
    if (!selectedPolicy || !scenario.trim()) {
      setError('Please select a policy and describe a scenario');
      return;
    }

    try {
      setSimulating(true);
      setError(null);

      const response = await fetch('http://localhost:8000/api/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          policy_id: parseInt(selectedPolicy),
          claim_scenario: scenario,
        }),
      });

      if (!response.ok) throw new Error('Simulation failed');

      const data = await response.json();
      setSimulateResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Simulation failed');
    } finally {
      setSimulating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 p-4 bg-danger/10 border border-danger/20 rounded-xl text-danger">
            {error}
          </div>
        )}

        <Section
          title="Simulate a Claim"
          subtitle="Test how your policy handles different scenarios"
        />

        {policies.length === 0 ? (
          <EmptyState
            title="No policies yet"
            description="Upload an insurance policy to test claim scenarios"
            action={{
              label: 'Upload Policy',
              onClick: () => router.push('/'),
            }}
          />
        ) : (
          <>
            {/* Input Section */}
            <motion.div
              className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Policy Selector */}
              <Card>
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">1</span>
                    </div>
                    Select Policy
                  </h3>

                  <Select
                    label="Choose policy"
                    value={selectedPolicy}
                    onChange={setSelectedPolicy}
                    options={policies.map((p) => ({
                      value: p.id.toString(),
                      label: `${p.file_name}`,
                    }))}
                  />

                  {selectedPolicy && (
                    <div className="p-3 rounded-lg bg-secondary border border-border">
                      {(() => {
                        const policy = policies.find(
                          (p) => p.id === parseInt(selectedPolicy)
                        );
                        return policy ? (
                          <div className="text-sm space-y-1">
                            <p className="text-muted-foreground">Type</p>
                            <p className="font-medium">{policy.policy_type}</p>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  )}
                </div>
              </Card>

              {/* Scenario Input */}
              <Card className="lg:col-span-2">
                <div className="space-y-4 h-full flex flex-col">
                  <h3 className="font-semibold flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-accent">2</span>
                    </div>
                    Describe Claim Scenario
                  </h3>

                  <textarea
                    value={scenario}
                    onChange={(e) => setScenario(e.target.value)}
                    placeholder="E.g., 'I was in a car accident on the highway. My car has moderate damage to the front bumper and headlights. No injuries occurred. The damage estimate is around $3,500.'"
                    className="flex-1 p-4 rounded-lg border border-border bg-secondary text-foreground placeholder-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  />

                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    isLoading={simulating}
                    onClick={handleSimulate}
                    disabled={!selectedPolicy || !scenario.trim()}
                  >
                    <Sparkles className="w-5 h-5" />
                    Simulate Claim
                  </Button>
                </div>
              </Card>
            </motion.div>

            {/* Results */}
            {simulateResult && (
              <motion.div
                className="space-y-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {/* Coverage Status */}
                <Card
                  className={`bg-gradient-to-r ${
                    simulateResult.is_covered
                      ? 'from-success/10 to-primary/10 border-success/30'
                      : 'from-danger/10 to-warning/10 border-danger/30'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {simulateResult.is_covered ? (
                      <CheckCircle className="w-16 h-16 text-success flex-shrink-0" />
                    ) : (
                      <XCircle className="w-16 h-16 text-danger flex-shrink-0" />
                    )}
                    <div>
                      <h2 className="text-2xl font-bold mb-2">
                        {simulateResult.is_covered ? 'Claim Covered' : 'Not Covered'}
                      </h2>
                      <p className="text-muted-foreground">
                        {simulateResult.coverage_percentage}% coverage of the
                        claim
                      </p>
                      <div className="mt-3 w-48 bg-border rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            simulateResult.is_covered ? 'bg-success' : 'bg-danger'
                          }`}
                          style={{
                            width: `${simulateResult.coverage_percentage}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Scenario Summary */}
                <Card>
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Scenario</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {simulateResult.claim_scenario}
                    </p>
                  </div>
                </Card>

                {/* Analysis */}
                <Card>
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Analysis</h3>
                    <p className="text-foreground leading-relaxed">
                      {simulateResult.explanation}
                    </p>
                  </div>
                </Card>

                {/* Covered & Not Covered */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Covered Aspects */}
                  <Card className="border-success/30">
                    <div className="space-y-4">
                      <h3 className="font-semibold flex items-center gap-2 text-success">
                        <CheckCircle className="w-5 h-5" />
                        Covered Aspects
                      </h3>
                      <div className="space-y-2">
                        {simulateResult.covered_aspects.length > 0 ? (
                          simulateResult.covered_aspects.map((aspect, idx) => (
                            <div
                              key={idx}
                              className="p-3 rounded-lg bg-success/10 border border-success/20 flex items-start gap-2"
                            >
                              <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{aspect}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No covered aspects
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>

                  {/* Not Covered Aspects */}
                  <Card className="border-danger/30">
                    <div className="space-y-4">
                      <h3 className="font-semibold flex items-center gap-2 text-danger">
                        <XCircle className="w-5 h-5" />
                        Not Covered Aspects
                      </h3>
                      <div className="space-y-2">
                        {simulateResult.not_covered_aspects.length > 0 ? (
                          simulateResult.not_covered_aspects.map(
                            (aspect, idx) => (
                              <div
                                key={idx}
                                className="p-3 rounded-lg bg-danger/10 border border-danger/20 flex items-start gap-2"
                              >
                                <XCircle className="w-4 h-4 text-danger mt-0.5 flex-shrink-0" />
                                <span className="text-sm">{aspect}</span>
                              </div>
                            )
                          )
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            All aspects covered
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                  <Button
                    variant="secondary"
                    size="lg"
                    fullWidth
                    onClick={() => {
                      setScenario('');
                      setSimulateResult(null);
                    }}
                  >
                    Simulate Again
                  </Button>
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    onClick={() => router.push('/dashboard')}
                  >
                    View All Policies
                  </Button>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
```

---

## Summary

All three pages follow the same design patterns:

✅ **Consistent Component Usage**: Button, Card, Badge, Select, Section
✅ **Framer Motion Animations**: Smooth entrance animations
✅ **Modern Card Layouts**: Grid-based responsive design
✅ **Error Handling**: User-friendly error messages
✅ **Loading States**: Spinners and disabled buttons
✅ **Empty States**: Call-to-action prompts
✅ **Authentication**: JWT token management
✅ **Dark Mode Ready**: Uses CSS variables

Simply copy and paste these into your respective files to complete the UI refactoring!
