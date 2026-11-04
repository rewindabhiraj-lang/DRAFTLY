import React, { useState, useEffect, useRef } from 'react';
import { X, Send, User, Clock, CheckCheck } from 'lucide-react';
import { Message } from '../types';
import { subscribeToMessages, sendMessage } from '../services/db';
import { useAuth } from '../contexts/AuthContext';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  recipientId: string;
  recipientName: string;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  onClose,
  conversationId,
  recipientId,
  recipientName,
}) => {
  const { userProfile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !conversationId) return;

    const unsubscribe = subscribeToMessages(conversationId, msgs => {
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [isOpen, conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || sending || !userProfile) return;

    const msg = text.trim();
    setText('');
    setSending(true);

    try {
      await sendMessage(
        conversationId,
        userProfile.id,
        userProfile.displayName || 'User',
        msg,
        recipientId
      );
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg h-[600px] flex flex-col rounded-2xl bg-[#171025] border border-[#9B5CFF]/30 shadow-2xl overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 border-b border-[#251B38] bg-[#100B1C] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#9B5CFF]/20 border border-[#BB86FF]/40 flex items-center justify-center text-[#BB86FF] font-bold">
              {recipientName ? recipientName[0].toUpperCase() : 'U'}
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">{recipientName}</h3>
              <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Direct Project Channel
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#A59BB8] hover:text-white hover:bg-[#251B38] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#080611]/50">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#A59BB8]">
              <div className="w-12 h-12 rounded-2xl bg-[#171025] border border-[#9B5CFF]/30 flex items-center justify-center text-[#BB86FF] mb-3">
                <Send className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-white">Start the conversation</p>
              <p className="text-xs text-[#A59BB8] mt-1 max-w-xs">
                Discuss project timelines, deliverable requirements, format specs, and feedback.
              </p>
            </div>
          ) : (
            messages.map(msg => {
              const isMe = msg.senderId === userProfile?.id;
              const timeString = new Date(msg.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed ${
                      isMe
                        ? 'bg-gradient-to-r from-[#9B5CFF] to-[#7A22FF] text-white rounded-br-none shadow-[0_0_15px_rgba(155,92,255,0.25)]'
                        : 'bg-[#1F1733] border border-[#9B5CFF]/20 text-white rounded-bl-none'
                    }`}
                  >
                    {!isMe && (
                      <span className="block text-[10px] font-bold text-[#BB86FF] mb-0.5">
                        {msg.senderName}
                      </span>
                    )}
                    <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                  </div>
                  <span className="text-[10px] text-[#A59BB8]/70 mt-1 px-1">
                    {timeString}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3 bg-[#100B1C] border-t border-[#251B38] flex items-center gap-2">
          <input
            type="text"
            placeholder={`Message ${recipientName}...`}
            value={text}
            onChange={e => setText(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl bg-[#171025] border border-[#9B5CFF]/20 text-white placeholder-[#A59BB8]/50 text-xs sm:text-sm focus:outline-none focus:border-[#BB86FF] transition-colors"
          />
          <button
            type="submit"
            disabled={!text.trim() || sending}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#9B5CFF] to-[#7A22FF] text-white hover:brightness-110 active:scale-95 disabled:opacity-40 transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
