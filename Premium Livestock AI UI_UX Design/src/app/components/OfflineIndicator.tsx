import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowNotification(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {showNotification && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 right-4 z-50"
        >
          <div
            className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl ${
              isOnline
                ? 'bg-green-500 text-white'
                : 'bg-orange-500 text-white'
            }`}
          >
            {isOnline ? (
              <>
                <Wifi className="w-5 h-5" />
                <div>
                  <p className="font-medium">Back Online</p>
                  <p className="text-sm opacity-90">Syncing data...</p>
                </div>
              </>
            ) : (
              <>
                <WifiOff className="w-5 h-5" />
                <div>
                  <p className="font-medium">Offline Mode</p>
                  <p className="text-sm opacity-90">Working offline</p>
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}

      {!isOnline && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-full text-sm shadow-lg">
            <WifiOff className="w-4 h-4" />
            <span>Offline</span>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
