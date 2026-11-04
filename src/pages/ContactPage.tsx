import React, { useState } from 'react';
import { Mail, MessageSquare, Send, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';
import { submitContactMessage } from '../services/db';

interface ContactPageProps {
  navigate: (path: string) => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ navigate }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      await submitContactMessage({
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
      });
      setSubmitted(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err: any) {
      console.error(err);
      setError('Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#171025] border border-[#9B5CFF]/30 text-xs font-semibold text-[#BB86FF] mb-3">
          <Mail className="w-3.5 h-3.5" />
          <span>We're Here to Help</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white font-['Manrope']">
          Contact DRAFTLY Support
        </h1>
        <p className="text-sm text-[#A59BB8] mt-2">
          Have questions about hiring, custom enterprise contracts, or editor verification? Reach our dedicated team.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
        {/* Contact Form */}
        <div className="md:col-span-7 rounded-3xl bg-[#171025] border border-[#9B5CFF]/30 p-6 sm:p-8 shadow-2xl">
          {submitted ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white">Inquiry Received!</h3>
              <p className="text-xs sm:text-sm text-[#A59BB8] max-w-sm mx-auto">
                Thank you for contacting DRAFTLY. Our support and moderation staff will reply to your email within 24 hours.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-4 px-6 py-2.5 rounded-xl text-xs font-semibold bg-[#251B38] text-white hover:bg-[#32234B]"
              >
                Send Another Inquiry
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-white mb-1">Your Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="David Kelly"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/20 text-white text-xs sm:text-sm focus:border-[#BB86FF]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white mb-1">Your Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="david@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/20 text-white text-xs sm:text-sm focus:border-[#BB86FF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-1">Subject *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Enterprise Creator Inquiries or Editor Vetting"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/20 text-white text-xs sm:text-sm focus:border-[#BB86FF]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-1">Message *</label>
                <textarea
                  rows={5}
                  required
                  placeholder="Describe your inquiry or question in detail..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/20 text-white text-xs sm:text-sm focus:border-[#BB86FF] resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-[#9B5CFF] to-[#7A22FF] hover:brightness-110 shadow-[0_0_20px_rgba(155,92,255,0.4)] transition-all flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <span>Sending Message...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Message</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Sidebar Info & FAQ */}
        <div className="md:col-span-5 space-y-6">
          <div className="p-6 rounded-3xl bg-[#171025] border border-[#9B5CFF]/20 space-y-3">
            <h3 className="text-base font-bold text-white font-['Manrope']">
              Direct Information
            </h3>
            <p className="text-xs text-[#A59BB8] leading-relaxed">
              We monitor customer messages and moderation reports 7 days a week.
            </p>
            <div className="pt-2 space-y-2 text-xs text-white">
              <p>
                <strong className="text-[#BB86FF]">Support Email:</strong> support@draftly.marketplace
              </p>
              <p>
                <strong className="text-[#BB86FF]">Creator Hotline:</strong> creators@draftly.marketplace
              </p>
              <p>
                <strong className="text-[#BB86FF]">Response Window:</strong> Average under 12 hours
              </p>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-[#171025] border border-[#9B5CFF]/20 space-y-4">
            <h3 className="text-base font-bold text-white font-['Manrope'] flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#BB86FF]" />
              <span>Quick FAQ</span>
            </h3>
            <div className="space-y-3 text-xs text-[#A59BB8]">
              <div>
                <p className="font-semibold text-white">How long does editor verification take?</p>
                <p className="mt-0.5">Admin approval takes between 12 to 24 hours.</p>
              </div>
              <div>
                <p className="font-semibold text-white">How do revisions work?</p>
                <p className="mt-0.5">Clients can submit timestamped adjustment notes directly inside the dashboard.</p>
              </div>
              <div>
                <p className="font-semibold text-white">Can I hire for monthly retained work?</p>
                <p className="mt-0.5">Yes, message the editor to define a recurring batch scope.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
