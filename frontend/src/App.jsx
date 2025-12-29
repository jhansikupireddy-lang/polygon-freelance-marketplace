import React, { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Briefcase, PlusCircle, LayoutDashboard, Ticket, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Dashboard from './components/Dashboard';
import CreateJob from './components/CreateJob';
import JobsList from './components/JobsList';
import NFTGallery from './components/NFTGallery';
import Chat from './components/Chat';
import { NotificationManager } from './components/NotificationManager';
import { Toaster } from 'react-hot-toast';

import { XMTPProvider } from '@xmtp/react-sdk';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'create': return <CreateJob onJobCreated={() => setActiveTab('dashboard')} />;
      case 'jobs': return <JobsList />;
      case 'nfts': return <NFTGallery />;
      case 'chat': return <Chat />;
      default: return <Dashboard />;
    }
  };

  return (
    <XMTPProvider>
      <div className="min-h-screen">
        <Toaster position="top-right" />
        <NotificationManager />
        <nav>
          <div className="logo">PolyLance</div>
          <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`btn-nav ${activeTab === 'dashboard' ? 'active' : ''}`}
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <LayoutDashboard size={18} /> Dashboard
            </button>
            <button
              onClick={() => setActiveTab('jobs')}
              className={`btn-nav ${activeTab === 'jobs' ? 'active' : ''}`}
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Briefcase size={18} /> Find Jobs
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`btn-nav ${activeTab === 'create' ? 'active' : ''}`}
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <PlusCircle size={18} /> Post Job
            </button>
            <button
              onClick={() => setActiveTab('nfts')}
              className={`btn-nav ${activeTab === 'nfts' ? 'active' : ''}`}
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Ticket size={18} /> My NFTs
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`btn-nav ${activeTab === 'chat' ? 'active' : ''}`}
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <MessageSquare size={18} /> Messages
            </button>
            <ConnectButton />
          </div>
        </nav>

        <main className="container">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>

        <style dangerouslySetInnerHTML={{
          __html: `
          .btn-nav {
            font-weight: 500;
            opacity: 0.7;
            transition: opacity 0.3s ease;
          }
          .btn-nav:hover, .btn-nav.active {
            opacity: 1;
            color: var(--primary);
          }
        `}} />
      </div>
    </XMTPProvider>
  );
}

export default App;
