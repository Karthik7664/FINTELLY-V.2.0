
import React, { useState, useEffect } from 'react';
import { User, SavedReport } from '../types';
import { StorageService } from '../services/storageService';
import { generatePDF } from '../services/pdfGenerator';
import { motion, AnimatePresence } from 'framer-motion';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    setReports(StorageService.getUserReports(user.id));
  }, [user.id]);

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this report?")) {
      StorageService.deleteReport(id);
      setReports(prev => prev.filter(r => r.id !== id));
    }
  };

  const handleDownload = async (report: SavedReport) => {
    setDownloadingId(report.id);
    await generatePDF(report.userData, report.analysis, report.referenceId);
    setDownloadingId(null);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-8">
        <div className="max-w-4xl mx-auto">
          {/* User Profile Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-8 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-10 -mt-10 opacity-50" />
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center relative z-10">
              <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
                  <p className="text-slate-500 text-sm">{user.email}</p>
                  <div className="flex items-center mt-2 space-x-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${user.receiveUpdates ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {user.receiveUpdates ? 'Updates On' : 'Updates Off'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Member since {new Date(user.joinedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <button 
                onClick={onLogout}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold uppercase tracking-wider transition"
              >
                Sign Out
              </button>
            </div>
          </motion.div>

          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-900">Saved Reports</h3>
            <span className="text-sm font-medium text-slate-500">{reports.length} Reports</span>
          </div>

          {reports.length === 0 ? (
             <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
               <div className="text-4xl mb-4">📂</div>
               <h3 className="text-lg font-medium text-slate-900">No reports saved yet</h3>
               <p className="text-slate-500 text-sm mt-1">Chat with the agent to generate and save loan assessments.</p>
             </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              <AnimatePresence>
                {reports.map((report) => (
                  <motion.div
                    key={report.id}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition group"
                  >
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-widest rounded border border-indigo-100">
                            {report.userData.loanType}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">
                            {new Date(report.timestamp).toLocaleDateString()} • {new Date(report.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                        <div className="flex items-baseline space-x-2">
                           <h4 className="text-lg font-bold text-slate-900">
                             ₹{report.userData.loanAmount?.toLocaleString('en-IN')}
                           </h4>
                           <span className="text-sm text-slate-500">for {report.userData.loanTenure} Years</span>
                        </div>
                        <div className="mt-2 flex items-center space-x-4 text-xs font-medium">
                          <div className={`flex items-center ${report.analysis.riskLevel === 'Low' ? 'text-green-600' : 'text-orange-600'}`}>
                             <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
                             Risk: {report.analysis.riskLevel}
                          </div>
                          <div className="text-indigo-600">
                             Approval: {report.analysis.approvalProbability}%
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0">
                        <button 
                          onClick={() => handleDownload(report)}
                          disabled={downloadingId === report.id}
                          className="flex-1 sm:flex-none px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 min-w-[100px]"
                        >
                          {downloadingId === report.id ? (
                             <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                          ) : (
                             <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                          )}
                          <span>Download</span>
                        </button>
                        <button 
                          onClick={() => handleDelete(report.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                          title="Delete Report"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
