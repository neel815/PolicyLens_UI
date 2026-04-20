'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/auth';

interface Policy {
  id: number;
  file_name: string;
  policy_type: string;
  coverage_score: number;
  created_at: string;
}

interface ChatMessage {
  type: 'user' | 'ai';
  text: string;
  confidence?: number;
  found_in_policy?: boolean;
  related_section?: string;
}

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [selectedPolicyId, setSelectedPolicyId] = useState<number | null>(null);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [asking, setAsking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // STEP 1: Fetch policies on load
  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const response = await apiFetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/policies`
        );
        if (!response.ok) {
          if (response.status === 401) {
            router.push('/login');
            return;
          }
          throw new Error('Failed to fetch policies');
        }
        const data = await response.json();
        const pols = Array.isArray(data) ? data : [];
        setPolicies(pols);
        
        if (pols.length === 0) {
          setLoading(false);
          return;
        }
        
        // Check for policy_id query parameter (with delay to ensure searchParams is ready)
        setTimeout(() => {
          const policyIdParam = searchParams.get('id');
          if (policyIdParam) {
            const paramId = parseInt(policyIdParam);
            const policy = pols.find(p => p.id === paramId);
            if (policy) {
              setSelectedPolicyId(paramId);
              setSelectedPolicy(policy);
            } else {
              setSelectedPolicyId(pols[0].id);
              setSelectedPolicy(pols[0]);
            }
          } else {
            setSelectedPolicyId(pols[0].id);
            setSelectedPolicy(pols[0]);
          }
          setLoading(false);
        }, 0);
      } catch (err) {
        console.error('Policy fetch error:', err);
        setError('Could not load policies. ' + (err instanceof Error ? err.message : 'Unknown error'));
        setLoading(false);
      }
    };
    fetchPolicies();
  }, [router]);

  // STEP 2: Handle policy selection change
  const handlePolicyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = parseInt(e.target.value);
    setSelectedPolicyId(id);
    const policy = policies.find(p => p.id === id);
    if (policy) setSelectedPolicy(policy);
    setMessages([]);
    setQuestion('');
    setError('');
  };

  // STEP 3: Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // STEP 4: Submit question
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!question.trim()) {
      setError('Please enter a question.');
      return;
    }
    if (!selectedPolicyId) {
      setError('Please select a policy.');
      return;
    }
    
    setAsking(true);
    setError('');
    
    // Add user message immediately
    const userMsg: ChatMessage = { type: 'user', text: question.trim() };
    setMessages(prev => [...prev, userMsg]);
    const currentQuestion = question.trim();
    setQuestion('');
    
    try {
      const response = await apiFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/chat-policy`,
        {
          method: 'POST',
          body: JSON.stringify({
            question: currentQuestion,
            policy_id: selectedPolicyId
          })
        }
      );
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to get response');
      }
      
      const data = await response.json();
      const chatData = data.data;
      
      const aiMsg: ChatMessage = {
        type: 'ai',
        text: chatData.answer,
        confidence: chatData.confidence,
        found_in_policy: chatData.found_in_policy,
        related_section: chatData.related_section
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      // Remove user message if failed
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setAsking(false);
    }
  };

  // STEP 5: Handle enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!asking) handleSubmit();
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen p-8" style={{ backgroundColor: '#F7F6F2' }}>
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-8" style={{ color: '#1A3FBE' }}>
            Chat with Your Policy
          </h1>
          <div className="text-center py-12">
            <p className="text-gray-600">Loading your policies...</p>
          </div>
        </div>
      </div>
    );
  }

  // No policies state
  if (policies.length === 0) {
    return (
      <div className="min-h-screen p-8" style={{ backgroundColor: '#F7F6F2' }}>
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-8" style={{ color: '#1A3FBE' }}>
            Chat with Your Policy
          </h1>
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-600 mb-4">No policies analyzed yet.</p>
            <Link
              href="/dashboard"
              className="inline-block px-6 py-2 rounded-lg font-medium"
              style={{ backgroundColor: '#1A3FBE', color: 'white' }}
            >
              Analyze a Policy
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: '#F7F6F2' }}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: '#1A3FBE' }}>
            Chat with Your Policy
          </h1>
          <p className="text-gray-600">Ask questions about your insurance coverage</p>
        </div>

        {/* Policy Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select a Policy
          </label>
          <select
            value={selectedPolicyId || ''}
            onChange={handlePolicyChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': '#1A3FBE' } as any}
          >
            {policies.map(policy => (
              <option key={policy.id} value={policy.id}>
                {policy.file_name} ({policy.policy_type}) - Score: {policy.coverage_score}/10
              </option>
            ))}
          </select>
        </div>

        {/* Messages Container */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6" style={{ minHeight: '400px' }}>
          {messages.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="mb-4">No conversations yet</p>
              <p className="text-sm">Ask a question about your policy to get started</p>
              <div className="mt-6 grid grid-cols-1 gap-3">
                <button
                  onClick={() => {
                    setQuestion('What is covered by this policy?');
                  }}
                  className="text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 text-gray-700 transition"
                >
                  💡 What is covered by this policy?
                </button>
                <button
                  onClick={() => {
                    setQuestion('What are the major exclusions?');
                  }}
                  className="text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 text-gray-700 transition"
                >
                  ⚠️ What are the major exclusions?
                </button>
                <button
                  onClick={() => {
                    setQuestion('What should I be aware of when making a claim?');
                  }}
                  className="text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 text-gray-700 transition"
                >
                  📋 What should I be aware of when making a claim?
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-y-auto" style={{ maxHeight: '500px' }}>
              <div className="p-6 space-y-4">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className="max-w-xs lg:max-w-md px-4 py-3 rounded-lg"
                      style={{
                        backgroundColor: msg.type === 'user' ? '#1A3FBE' : '#F0F0F0',
                        color: msg.type === 'user' ? 'white' : 'black'
                      }}
                    >
                      <p className="text-sm mb-2">{msg.text}</p>
                      {msg.type === 'ai' && (
                        <div className="mt-4 pt-4 border-t" style={{ borderColor: msg.type === 'user' ? 'rgba(255,255,255,0.3)' : '#E0E0E0' }}>
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Confidence:</span>
                              <div className="flex items-center gap-1">
                                <div
                                  className="h-1.5 rounded-full"
                                  style={{
                                    width: '50px',
                                    backgroundColor: msg.confidence! >= 80 ? '#10B981' : msg.confidence! >= 60 ? '#D97706' : '#DC2626'
                                  }}
                                />
                                <span>{msg.confidence}%</span>
                              </div>
                            </div>
                            <div>
                              <span className="font-medium">Found in policy:</span> {msg.found_in_policy ? '✓ Yes' : '✗ Inferred'}
                            </div>
                            <div>
                              <span className="font-medium">Section:</span> {msg.related_section}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about your policy..."
            disabled={asking}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': '#1A3FBE' } as any}
          />
          <button
            type="submit"
            disabled={asking}
            className="px-6 py-3 rounded-lg font-medium transition"
            style={{
              backgroundColor: asking ? '#9CA3AF' : '#1A3FBE',
              color: 'white',
              cursor: asking ? 'not-allowed' : 'pointer'
            }}
          >
            {asking ? 'Thinking...' : 'Ask'}
          </button>
        </form>
      </div>
    </div>
  );
}
