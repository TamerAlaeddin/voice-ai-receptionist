'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, Phone, PhoneOff, FileText, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

type Message = {
  id: string;
  role: 'user' | 'ai' | 'system';
  text: string;
  timestamp: Date;
};

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export default function Home() {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<any>(null);

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [messages]);

  const addMessage = (role: Message['role'], text: string) => {
    const newMessage: Message = {
      id: `${Date.now()}-${Math.random()}`,
      role,
      text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const startCall = async () => {
    try {
      setStatus('connecting');
      addMessage('system', 'Connecting to receptionist...');

      const { ReceptionistClient } = await import('@/lib/receptionist-client');
      
      const client = new ReceptionistClient({
        onMessage: addMessage,
        onStatusChange: setStatus,
      });

      await client.start();
      clientRef.current = client;
      setIsRecording(true);
      addMessage('system', 'Connected! Start speaking.');
    } catch (error: any) {
      setStatus('error');
      addMessage('system', `Error: ${error.message}`);
      setIsRecording(false);
    }
  };

  const endCall = async () => {
    if (clientRef.current) {
      await clientRef.current.stop();
      clientRef.current = null;
    }
    setIsRecording(false);
    setStatus('disconnected');
    addMessage('system', 'Call ended. Transcript saved.');
  };

  const clearTranscript = () => {
    if (!isRecording && confirm('Clear all messages?')) {
      setMessages([]);
    }
  };

  const getStatusBadge = () => {
    const variants: Record<ConnectionStatus, { label: string; className: string }> = {
      disconnected: { label: 'Ready', className: 'bg-slate-500 text-white' },
      connecting: { label: 'Connecting...', className: 'bg-amber-500 text-white animate-pulse' },
      connected: { label: 'Live', className: 'bg-emerald-600 text-white' },
      error: { label: 'Error', className: 'bg-red-600 text-white' },
    };
    const { label, className } = variants[status];
    return <Badge className={className}>{label}</Badge>;
  };

  const getMessageIcon = (role: Message['role']) => {
    switch (role) {
      case 'user':
        return '👤';
      case 'ai':
        return '🏠';
      case 'system':
        return 'ⓘ';
    }
  };

  const getMessageLabel = (role: Message['role']) => {
    switch (role) {
      case 'user':
        return 'You';
      case 'ai':
        return 'Receptionist';
      case 'system':
        return 'System';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Professional Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🏠</div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Tri-State Roofing</h1>
                <p className="text-sm text-slate-600">AI Voice Receptionist</p>
              </div>
            </div>
            {getStatusBadge()}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="shadow-lg border border-slate-200">
          {/* Controls */}
          <div className="p-6 bg-white">
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {!isRecording ? (
                <Button
                  onClick={startCall}
                  disabled={status === 'connecting'}
                  size="lg"
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-base py-6 px-8 shadow-md hover:shadow-lg transition-all"
                >
                  <Phone className="w-5 h-5" />
                  Start Call
                </Button>
              ) : (
                <Button
                  onClick={endCall}
                  size="lg"
                  variant="destructive"
                  className="w-full sm:w-auto gap-2 text-base py-6 px-8 shadow-md hover:shadow-lg transition-all"
                >
                  <PhoneOff className="w-5 h-5" />
                  End Call
                </Button>
              )}

              {isRecording && (
                <div className="flex items-center gap-2 text-red-600">
                  <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
                  <Mic className="w-5 h-5" />
                  <span className="font-semibold">Recording</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Transcript */}
          <div className="p-6 bg-slate-50">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-700" />
                <h2 className="text-lg font-semibold text-slate-900">Call Transcript</h2>
              </div>
              {messages.length > 0 && !isRecording && (
                <Button
                  onClick={clearTranscript}
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-slate-600 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear
                </Button>
              )}
            </div>

            <div
              ref={transcriptRef}
              className="bg-white rounded-lg border border-slate-200 p-4 h-[500px] overflow-y-auto space-y-3 custom-scrollbar"
            >
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-center">
                  <div>
                    <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                      <Phone className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-base font-medium">No active call</p>
                    <p className="text-sm mt-1">Start a call to see the transcript</p>
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-4 rounded-lg border-l-4 animate-slide-in ${
                      message.role === 'user'
                        ? 'bg-blue-50 border-blue-500'
                        : message.role === 'ai'
                        ? 'bg-slate-50 border-slate-700'
                        : 'bg-amber-50 border-amber-500'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl">{getMessageIcon(message.role)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-slate-900 text-sm">
                            {getMessageLabel(message.role)}
                          </span>
                          <span className="text-xs text-slate-500">
                            {message.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-slate-700 leading-relaxed text-sm">{message.text}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}