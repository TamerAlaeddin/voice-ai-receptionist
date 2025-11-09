'use client';

import { useState, useRef, useEffect } from 'react';
import { Phone, PhoneOff, Mic } from 'lucide-react';

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

      const { LiveKitReceptionistClient } = await import('@/lib/livekit-receptionist-client');

      const client = new LiveKitReceptionistClient({
        onMessage: addMessage,
        onStatusChange: setStatus,
      });

      await client.start();
      clientRef.current = client;
      setIsRecording(true);
    } catch (error: any) {
      setStatus('error');
      addMessage('system', `Connection failed: ${error.message}`);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 bg-blue-500/10 rounded-full blur-3xl top-20 -left-20 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-purple-500/10 rounded-full blur-3xl bottom-20 -right-20 animate-pulse delay-700"></div>
      </div>

      <div className="relative w-full max-w-4xl">
        {/* Main Card */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-white/10 p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Phone className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Tri-State Roofing</h1>
                  <p className="text-blue-200 text-sm mt-1">AI Voice Receptionist</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className={`px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm ${
                  status === 'connected'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : status === 'connecting'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                    : status === 'error'
                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                    : 'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                }`}>
                  <span className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      status === 'connected' ? 'bg-emerald-400' :
                      status === 'connecting' ? 'bg-amber-400 animate-ping' :
                      status === 'error' ? 'bg-red-400' : 'bg-slate-400'
                    }`}></span>
                    {status === 'connected' ? 'Live' :
                     status === 'connecting' ? 'Connecting...' :
                     status === 'error' ? 'Error' : 'Ready'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-8">
            {/* Call Controls */}
            <div className="flex items-center justify-center gap-6 mb-8">
              {!isRecording ? (
                <button
                  onClick={startCall}
                  disabled={status === 'connecting'}
                  className="group relative px-12 py-6 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:from-slate-600 disabled:to-slate-700 text-white rounded-2xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
                >
                  <span className="flex items-center gap-3">
                    <Phone className="w-6 h-6" />
                    Start Call
                  </span>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-400 to-emerald-500 blur-xl opacity-50 group-hover:opacity-75 transition-opacity -z-10"></div>
                </button>
              ) : (
                <div className="flex items-center gap-4">
                  <button
                    onClick={endCall}
                    className="group relative px-12 py-6 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-2xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
                  >
                    <span className="flex items-center gap-3">
                      <PhoneOff className="w-6 h-6" />
                      End Call
                    </span>
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-red-400 to-red-500 blur-xl opacity-50 group-hover:opacity-75 transition-opacity -z-10"></div>
                  </button>

                  <div className="flex items-center gap-3 px-6 py-4 bg-red-500/20 border border-red-500/30 rounded-xl backdrop-blur-sm">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50"></div>
                    <Mic className="w-5 h-5 text-red-400" />
                    <span className="font-semibold text-red-300">Recording</span>
                  </div>
                </div>
              )}
            </div>

            {/* Transcript Area */}
            <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  Live Transcript
                </h2>
                {messages.length > 0 && !isRecording && (
                  <button
                    onClick={clearTranscript}
                    className="px-4 py-2 text-sm text-red-300 hover:text-red-200 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div
                ref={transcriptRef}
                className="bg-slate-950/40 backdrop-blur-sm rounded-xl p-6 h-[500px] overflow-y-auto space-y-4 border border-white/5"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(148, 163, 184, 0.3) transparent',
                }}
              >
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mb-4 border border-white/10">
                      <Phone className="w-10 h-10 text-slate-500" />
                    </div>
                    <p className="text-lg font-medium">No active call</p>
                    <p className="text-sm mt-2 text-slate-500">Start a call to begin the conversation</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 p-4 rounded-xl backdrop-blur-sm border transition-all duration-200 hover:scale-[1.01] ${
                        message.role === 'user'
                          ? 'bg-blue-500/10 border-blue-500/30'
                          : message.role === 'ai'
                          ? 'bg-purple-500/10 border-purple-500/30'
                          : 'bg-amber-500/10 border-amber-500/30'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.role === 'user'
                          ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                          : message.role === 'ai'
                          ? 'bg-gradient-to-br from-purple-500 to-purple-600'
                          : 'bg-gradient-to-br from-amber-500 to-amber-600'
                      }`}>
                        <span className="text-lg">
                          {message.role === 'user' ? '👤' : message.role === 'ai' ? '🏠' : 'ℹ️'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-white text-sm">
                            {message.role === 'user' ? 'You' : message.role === 'ai' ? 'Receptionist' : 'System'}
                          </span>
                          <span className="text-xs text-slate-400">
                            {message.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-slate-200 leading-relaxed">{message.text}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-white/5 border-t border-white/10 px-8 py-4">
            <p className="text-center text-sm text-slate-400">
              Powered by Mega Media Management
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
