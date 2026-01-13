import React, { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Briefcase, PlusCircle, LayoutDashboard, Ticket, MessageSquare, Trophy, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Dashboard from './components/Dashboard';
import CreateJob from './components/CreateJob';
import JobsList from './components/JobsList';
import NFTGallery from './components/NFTGallery';
import Chat from './components/Chat';
import Leaderboard from './components/Leaderboard';
import Portfolio from './components/Portfolio';
import TermsOfService from './components/TermsOfService';
import PrivacyPolicy from './components/PrivacyPolicy';
import { NotificationManager } from './components/NotificationManager';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAccount, useBalance } from 'wagmi';

function App() {
  const { address } = useAccount();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [portfolioAddress, setPortfolioAddress] = useState(null);
  const [chatPeerAddress, setChatPeerAddress] = useState(null);
  const [isGasless, setIsGasless] = useState(false);

  const onSelectChat = (peer) => {
    setChatPeerAddress(peer);
    setActiveTab('chat');
  };

  const renderContent = () => {
    if (portfolioAddress) {
      return <Portfolio address={portfolioAddress} onBack={() => setPortfolioAddress(null)} />;
    }

    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'jobs': return <JobsList gasless={isGasless} onUserClick={(addr) => setPortfolioAddress(addr)} onSelectChat={onSelectChat} />;
      case 'create': return <CreateJob gasless={isGasless} onJobCreated={() => setActiveTab('jobs')} />;
      case 'nfts': return <NFTGallery />;
      case 'chat': return <Chat initialPeerAddress={chatPeerAddress} onClearedAddress={() => setChatPeerAddress(null)} />;
      case 'leaderboard': return <Leaderboard />;
      case 'tos': return <TermsOfService onBack={() => setActiveTab('dashboard')} />;
      case 'privacy': return <PrivacyPolicy onBack={() => setActiveTab('dashboard')} />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Decorative Background Elements */}
      <motion.div
        animate={{
          x: [0, 100, 0],
          y: [0, 50, 0],
          scale: [1, 1.2, 1]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="bg-glow"
        style={{ top: '-10%', left: '-10%' }}
      />
      <motion.div
        animate={{
          x: [0, -80, 0],
          y: [0, 120, 0],
          scale: [1, 1.1, 1]
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="bg-glow"
        style={{ bottom: '-10%', right: '-10%', background: 'radial-gradient(circle, rgba(236, 72, 153, 0.2) 0%, transparent 70%)' }}
      />

      <ToastContainer position="top-right" autoClose={5000} theme="dark" hideProgressBar={false} />
      <NotificationManager />
      <ConnectionBanner />

      <nav className="glass-nav">
        <div className="brand" onClick={() => setActiveTab('dashboard')} style={{ cursor: 'pointer' }}>
          <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30">
            <Briefcase size={22} className="text-primary active-icon" />
          </div>
          <span className="gradient-text font-bold text-2xl tracking-tighter">PolyLance</span>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
            >
              <LayoutDashboard size={18} /> Dashboard
            </button>
            <button
              onClick={() => setActiveTab('jobs')}
              className={`nav-link ${activeTab === 'jobs' ? 'active' : ''}`}
            >
              <Briefcase size={18} /> Markets
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`nav-link ${activeTab === 'create' ? 'active' : ''}`}
            >
              <PlusCircle size={18} /> Post Job
            </button>
            <button
              onClick={() => setActiveTab('nfts')}
              className={`nav-link ${activeTab === 'nfts' ? 'active' : ''}`}
            >
              <Ticket size={18} /> Gallery
            </button>
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`nav-link ${activeTab === 'leaderboard' ? 'active' : ''}`}
            >
              <Trophy size={18} /> Leaders
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`nav-link ${activeTab === 'chat' ? 'active' : ''}`}
            >
              <MessageSquare size={18} /> Messenger
            </button>
          </div>

          <div className="h-8 w-px bg-white/5 mx-2" />

          <div className="flex items-center gap-6">
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-black uppercase opacity-30 mb-1.5 tracking-widest">Relay</span>
              <button
                onClick={() => setIsGasless(!isGasless)}
                className={`relative w-10 h-5.5 rounded-full transition-all duration-500 ${isGasless ? 'bg-primary shadow-lg shadow-primary/30' : 'bg-slate-800'}`}
              >
                <div className={`absolute top-1 w-3.5 h-3.5 rounded-full bg-white transition-all duration-500 shadow-md ${isGasless ? 'left-5.5' : 'left-1'}`} />
              </button>
            </div>

            <ConnectButton.Custom>
              {({
                account,
                chain,
                openAccountModal,
                openChainModal,
                openConnectModal,
                authenticationStatus,
                mounted,
              }) => {
                const ready = mounted && authenticationStatus !== 'loading';
                const connected = ready && account && chain && (!authenticationStatus || authenticationStatus === 'authenticated');

                return (
                  <div {...(!ready && { 'aria-hidden': true, 'className': 'opacity-0 pointer-events-none' })}>
                    {(() => {
                      if (!connected) {
                        return (
                          <button onClick={openConnectModal} className="btn-primary shadow-2xl">
                            Connect Wallet
                          </button>
                        );
                      }

                      if (chain.unsupported) {
                        return (
                          <button onClick={openChainModal} className="btn-ghost !text-danger !border-danger/20">
                            Wrong Network
                          </button>
                        );
                      }

                      return (
                        <div className="flex items-center gap-4 bg-white/5 p-1.5 pr-4 rounded-2xl border border-white/5 hover:border-white/10 transition-all cursor-pointer" onClick={openAccountModal}>
                          <div className="w-9 h-9 rounded-xl overflow-hidden border border-white/10">
                            <img
                              src={`https://api.dicebear.com/7.x/identicon/svg?seed=${account.address}`}
                              alt="avatar"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-white/90 leading-none mb-1">{account.displayName}</span>
                            <span className="text-[10px] font-bold text-primary/80 leading-none">{account.displayBalance}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                );
              }}
            </ConnectButton.Custom>
          </div>
        </div>
      </nav>

      <main className="container flex-grow relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + (portfolioAddress || '')}
            initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="px-12 py-8 border-t border-white/5 flex justify-between items-center text-sm">
        <div className="opacity-40 italic">© 2026 PolyLance Protocol. The future of decentralized work.</div>
        <div className="flex gap-6 opacity-60">
          <button onClick={() => setActiveTab('tos')} className="hover:text-primary transition-colors">Terms of Service</button>
          <button onClick={() => setActiveTab('privacy')} className="hover:text-primary transition-colors">Privacy Policy</button>
          <a href="https://polygon.technology" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">Built on Polygon</a>
        </div>
      </footer>
    </div>
  );
}

function ConnectionBanner() {
  const { isConnected, chain } = useAccount();
  const isWrongChain = isConnected && chain?.id !== 80002;

  if (!isConnected) {
    return (
      <div className="bg-primary/10 text-primary py-2 px-12 text-center text-sm border-b border-primary/20">
        ✨ Welcome to PolyLance! Please <strong>connect your wallet</strong> to get started.
      </div>
    );
  }

  if (isWrongChain) {
    return (
      <div className="bg-danger/10 text-danger py-2 px-12 text-center text-sm border-b border-danger/20">
        🚨 Attention! You're on the wrong network. Please switch to <strong>Polygon Amoy</strong>.
      </div>
    );
  }

  return null;
}

export default App;
