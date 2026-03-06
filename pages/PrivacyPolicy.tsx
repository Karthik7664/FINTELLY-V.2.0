import React from 'react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 sm:p-12">
      <h1 className="text-3xl font-bold text-slate-900 mb-6">Privacy Policy</h1>
      <div className="prose prose-slate max-w-none text-slate-600 space-y-4">
        <p className="text-sm text-slate-400">Last Updated: October 2024</p>
        
        <h3 className="text-lg font-bold text-slate-800">1. Data Collection</h3>
        <p>
          Fintelly is designed with privacy as a priority. We collect only the information you explicitly provide during the chat session, such as your name, income, and loan requirements.
        </p>

        <h3 className="text-lg font-bold text-slate-800">2. Data Usage</h3>
        <p>
          Your data is used exclusively to:
        </p>
        <ul className="list-disc pl-5">
          <li>Calculate loan eligibility.</li>
          <li>Perform risk analysis (FOIR/DTI).</li>
          <li>Recommend suitable bank schemes.</li>
        </ul>
        <p>
          We do <strong>not</strong> sell your data to third-party advertisers.
        </p>

        <h3 className="text-lg font-bold text-slate-800">3. Data Storage</h3>
        <p>
          For this demo version, all analysis is performed locally or via ephemeral sessions. We do not persist sensitive financial data permanently in our databases after your session ends.
        </p>

        <h3 className="text-lg font-bold text-slate-800">4. Third-Party Links</h3>
        <p>
          Fintelly provides links to official bank websites. Once you click these links, you are subject to the privacy policies of those respective banks.
        </p>

        <h3 className="text-lg font-bold text-slate-800">5. Contact</h3>
        <p>
          For any privacy concerns regarding this project, please contact the development team.
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;