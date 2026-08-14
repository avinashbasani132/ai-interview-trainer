import React from 'react';

export default function Footer() {
  return (
    <footer id="app-footer" className="w-full bg-slate-900 border-t border-slate-800 py-6 text-center text-slate-500 text-xs mt-auto">
      <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <p>&copy; {new Date().getFullYear()} AI Interview Trainer. All rights reserved.</p>
        <div className="flex gap-4">
          <a href="#" className="hover:text-slate-300">Privacy Policy</a>
          <a href="#" className="hover:text-slate-300">Terms of Service</a>
          <a href="#" className="hover:text-slate-300">Support</a>
        </div>
      </div>
    </footer>
  );
}
