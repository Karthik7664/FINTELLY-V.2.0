import React from 'react';

const TermsOfService: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 sm:p-12">
      <h1 className="text-3xl font-bold text-slate-900 mb-6">Terms of Service</h1>
      <div className="prose prose-slate max-w-none text-slate-600 space-y-4">
        <p className="text-sm text-slate-400">Last Updated: October 2024</p>
        
        <h3 className="text-lg font-bold text-slate-800">1. Advisory Only</h3>
        <p>
          Fintelly is an educational and advisory tool. The loan probability scores, eligibility checks, and bank recommendations are estimates based on standard algorithms and publicly available data. They do <strong>not</strong> guarantee loan approval.
        </p>

        <h3 className="text-lg font-bold text-slate-800">2. No Financial Liability</h3>
        <p>
          The creators of Fintelly are not liable for any financial losses, rejected applications, or discrepancies in interest rates. Always verify details with the official bank before applying.
        </p>

        <h3 className="text-lg font-bold text-slate-800">3. User Responsibility</h3>
        <p>
          You agree to provide accurate information to get relevant results. Misrepresentation of income or age may lead to incorrect analysis.
        </p>

        <h3 className="text-lg font-bold text-slate-800">4. Availability</h3>
        <p>
          This service is provided "as is" for demonstration purposes. We do not guarantee 100% uptime or accuracy of bank interest rates, which are subject to market changes.
        </p>
      </div>
    </div>
  );
};

export default TermsOfService;