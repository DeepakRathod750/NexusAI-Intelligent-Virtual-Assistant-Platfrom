import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, X } from 'lucide-react';
import { Button } from '../ui/Button';

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const LogoutModal: React.FC<LogoutModalProps> = ({ isOpen, onClose, onConfirm }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.5, bounce: 0.3 }}
            className="relative w-full max-w-sm bg-[#141417] border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-6"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 mb-2">
                <LogOut size={32} />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">Sign Out?</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Are you sure you want to log out of your session? You will need to sign in again to access your workspace.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full pt-4">
                <Button
                  variant="ghost"
                  onClick={onClose}
                  className="w-full border border-white/5 hover:bg-white/5 text-gray-400 hover:text-white"
                >
                  Stay
                </Button>
                <Button
                  onClick={onConfirm}
                  className="w-full bg-red-600 hover:bg-red-700 text-white border-0 shadow-lg shadow-red-600/20"
                >
                  Log Out
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
