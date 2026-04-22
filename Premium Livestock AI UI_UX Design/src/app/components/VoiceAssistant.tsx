import React, { useState } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
  { code: 'mr', name: 'मराठी', flag: '🇮🇳' },
];

export default function VoiceAssistant() {
  const [isListening, setIsListening] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(languages[0]);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const toggleListening = () => {
    if (!isListening) {
      setIsListening(true);
      setTranscript('');
      // Simulate voice recognition
      setTimeout(() => {
        setTranscript('Show me my latest predictions...');
        setIsProcessing(true);
        setTimeout(() => {
          setIsProcessing(false);
          setIsListening(false);
        }, 2000);
      }, 2000);
    } else {
      setIsListening(false);
    }
  };

  return (
    <>
      {/* Floating Voice Button */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {/* Language Selector */}
        <AnimatePresence>
          {showLanguageMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-2 mb-2 border border-[var(--border)]"
            >
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setSelectedLanguage(lang);
                    setShowLanguageMenu(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    selectedLanguage.code === lang.code
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-[var(--foreground)]'
                  }`}
                >
                  <span className="text-2xl">{lang.flag}</span>
                  <span className="text-sm font-medium whitespace-nowrap">{lang.name}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Voice Button */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleListening}
            className={`relative p-5 rounded-full shadow-2xl transition-all duration-300 ${
              isListening
                ? 'bg-gradient-to-r from-green-500 to-green-600 shadow-green-500/50'
                : 'bg-gradient-to-r from-gray-700 to-gray-800 shadow-gray-900/50'
            } text-white`}
          >
            <AnimatePresence mode="wait">
              {isListening ? (
                <motion.div
                  key="listening"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 180 }}
                >
                  <Mic className="w-7 h-7" />
                </motion.div>
              ) : (
                <motion.div
                  key="not-listening"
                  initial={{ scale: 0, rotate: 180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: -180 }}
                >
                  <MicOff className="w-7 h-7" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Pulse animation when listening */}
            {isListening && (
              <>
                <motion.div
                  className="absolute inset-0 rounded-full bg-green-500"
                  animate={{
                    scale: [1, 1.6, 1],
                    opacity: [0.6, 0, 0.6],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full bg-green-400"
                  animate={{
                    scale: [1, 1.4, 1],
                    opacity: [0.4, 0, 0.4],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: 0.5,
                  }}
                />
              </>
            )}
          </motion.button>

          {/* Language Badge */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            onClick={() => setShowLanguageMenu(!showLanguageMenu)}
            className="absolute -top-2 -right-2 w-10 h-10 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center text-xl border-2 border-white dark:border-gray-700"
          >
            {selectedLanguage.flag}
          </motion.button>
        </div>
      </div>

      {/* Listening Panel */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-32 right-6 z-50"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-80 border border-[var(--border)]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-[var(--foreground)]">
                    {isProcessing ? 'Processing...' : 'Listening...'}
                  </span>
                </div>
                <span className="text-xs text-[var(--muted-foreground)]">{selectedLanguage.name}</span>
              </div>

              {/* Waveform Animation */}
              <div className="flex items-center justify-center gap-1 h-20 mb-4">
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 bg-gradient-to-t from-green-500 to-green-400 rounded-full"
                    animate={{
                      height: isProcessing ? ['20px'] : ['20px', `${Math.random() * 60 + 20}px`, '20px'],
                    }}
                    transition={{
                      duration: isProcessing ? 0 : 0.6,
                      repeat: isProcessing ? 0 : Infinity,
                      delay: i * 0.05,
                      ease: 'easeInOut',
                    }}
                  />
                ))}
              </div>

              {/* Transcript */}
              {transcript && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl"
                >
                  <div className="flex items-start gap-2">
                    <Volume2 className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-[var(--foreground)]">{transcript}</p>
                  </div>
                </motion.div>
              )}

              {!transcript && (
                <p className="text-xs text-center text-[var(--muted-foreground)]">
                  Say "upload image", "show history", or ask about your livestock
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}