import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
        </div>

        <Card className="p-8">
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <p className="text-muted-foreground mb-8">
              <strong>Last updated:</strong> {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
              <p className="mb-4">
                AirChatBot collects the following information to provide our Islamic AI assistance service:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Account Information:</strong> Email address and display name</li>
                <li><strong>Chat Messages:</strong> Your questions and our AI responses</li>
                <li><strong>Voice Data:</strong> Audio recordings when using voice features (processed and deleted immediately)</li>
                <li><strong>Usage Analytics:</strong> App usage patterns to improve our service</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide personalized Islamic guidance and responses</li>
                <li>Maintain conversation history for your reference</li>
                <li>Improve our AI responses and content accuracy</li>
                <li>Send educational notifications (with your consent)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
              <p className="mb-4">
                We implement industry-standard security measures:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>End-to-end encryption for all communications</li>
                <li>Secure authentication via Supabase</li>
                <li>Regular security audits and monitoring</li>
                <li>Compliance with Islamic principles of privacy (Hifz al-'Awrah)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Your Rights</h2>
              <p className="mb-4">Under GDPR and other privacy laws, you have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access your personal data</li>
                <li>Correct inaccurate information</li>
                <li>Delete your account and data</li>
                <li>Export your conversation history</li>
                <li>Withdraw consent for data processing</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Islamic Privacy Principles</h2>
              <p className="mb-4">
                AirChatBot respects Islamic teachings on privacy and confidentiality:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>We do not share personal spiritual questions with third parties</li>
                <li>Conversations are treated with the same confidentiality as religious counseling</li>
                <li>We do not use your data for advertising or non-educational purposes</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
              <p>
                For privacy concerns or data requests, contact us at:{' '}
                <a href="mailto:privacy@airchatbot.com" className="text-primary hover:underline">
                  privacy@airchatbot.com
                </a>
              </p>
            </section>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Privacy;