import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

const Terms = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Terms of Service</h1>
        </div>

        <Card className="p-8">
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <p className="text-muted-foreground mb-8">
              <strong>Last updated:</strong> {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">About AirChatBot</h2>
              <p className="mb-4">
                AirChatBot is an Islamic AI assistant designed to provide guidance based on the Quran and authentic Hadith. 
                Our service aims to support Muslims in their spiritual journey through accessible, accurate Islamic knowledge.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Acceptable Use</h2>
              <p className="mb-4">You agree to use AirChatBot:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>For legitimate Islamic learning and spiritual guidance</li>
                <li>In accordance with Islamic principles and ethics</li>
                <li>Respectfully, without seeking to challenge or mock Islamic teachings</li>
                <li>Not for generating inappropriate or harmful content</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Content Disclaimer</h2>
              <p className="mb-4">
                While AirChatBot strives for accuracy using authentic Islamic sources:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>AI responses are not official religious rulings (fatwas)</li>
                <li>For complex religious matters, consult qualified Islamic scholars</li>
                <li>We continuously improve our content but cannot guarantee 100% accuracy</li>
                <li>Users should verify important religious guidance through traditional Islamic authorities</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Intellectual Property</h2>
              <p className="mb-4">
                The AirChatBot platform, including its AI models and Islamic content database, 
                is protected by intellectual property laws. The Quranic verses and Hadith content 
                remain the sacred texts of Islam and are presented for educational purposes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Limitation of Liability</h2>
              <p className="mb-4">
                AirChatBot is provided "as is" for educational and spiritual support. We are not liable for:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Decisions made based on AI responses</li>
                <li>Spiritual or religious misunderstandings</li>
                <li>Technical service interruptions</li>
                <li>Third-party content or external links</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Islamic Principles</h2>
              <p className="mb-4">
                Our service operates according to Islamic values:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Trustworthiness (Amanah):</strong> We handle your data and questions with care</li>
                <li><strong>Justice (Adl):</strong> We provide balanced and fair Islamic guidance</li>
                <li><strong>Knowledge (Ilm):</strong> We promote authentic Islamic learning</li>
                <li><strong>Responsibility (Mas'uliyyah):</strong> We take responsibility for the content we provide</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Account Termination</h2>
              <p className="mb-4">
                We reserve the right to terminate accounts that violate these terms or engage in:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Disrespectful or inappropriate content</li>
                <li>Attempts to misuse or abuse the service</li>
                <li>Violation of Islamic principles in interactions</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
              <p>
                For questions about these terms, contact us at:{' '}
                <a href="mailto:support@airchatbot.com" className="text-primary hover:underline">
                  support@airchatbot.com
                </a>
              </p>
              <p className="mt-2">
                May Allah guide us all in the right path. Ameen.
              </p>
            </section>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Terms;