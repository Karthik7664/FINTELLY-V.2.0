import { User, SavedReport, UserData, AnalysisResult } from '../types';
import emailjs from '@emailjs/browser';

const USERS_KEY = 'fintelly_users';
const REPORTS_KEY = 'fintelly_reports';
const CURRENT_USER_KEY = 'fintelly_current_user_id';

// --- EMAILJS CONFIGURATION ---
// Credentials provided by user
const EMAILJS_SERVICE_ID: string = 'service_wamva8h'; 
const EMAILJS_TEMPLATE_ID: string = 'template_n4wkr86';
const EMAILJS_PUBLIC_KEY: string = 'tc8TjLKUQZ7cZLB8T';

// In-memory store for OTPs
const otpStore = new Map<string, { code: string, expiry: number }>();

export const StorageService = {
  // --- Authentication ---
  
  // 1. Generate OTP (Real Email via EmailJS or Fallback to Alert)
  generateOTP: async (email: string, name: string): Promise<string> => {
    // Generate random 6 digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set expiry (5 minutes from now)
    const expiry = Date.now() + 5 * 60 * 1000;
    
    otpStore.set(email.toLowerCase(), { code, expiry });
    
    // Check if EmailJS is fully configured
    const isConfigured = 
      EMAILJS_SERVICE_ID !== 'YOUR_SERVICE_ID' && 
      EMAILJS_TEMPLATE_ID !== 'YOUR_TEMPLATE_ID' &&
      EMAILJS_PUBLIC_KEY !== 'YOUR_PUBLIC_KEY';

    if (isConfigured) {
      try {
        // Send with multiple common keys for email to ensure template compatibility
        const templateParams = {
            to_name: name,
            to_email: email,       
            user_email: email,     
            email: email,          
            recipient_email: email,
            otp_code: code,
            message: `Your Fintelly verification code is: ${code}`
        };

        await emailjs.send(
          EMAILJS_SERVICE_ID,
          EMAILJS_TEMPLATE_ID,
          templateParams,
          EMAILJS_PUBLIC_KEY
        );
        console.log(`[EmailJS] OTP sent to ${email}`);
      } catch (error: any) {
        console.error('[EmailJS Error]', error);
        // Fallback to alert if email service fails
        alert(`[Email Failed] ${error?.text || 'Could not send email'}.\n\nHere is your OTP: ${code}`);
      }
    } else {
      // Demo Mode
      console.log(`[Demo Mode] OTP for ${email}: ${code}`);
      await new Promise(resolve => setTimeout(resolve, 800));
      
      let message = `DEMO EMAIL SERVICE:\n\nYour OTP is: ${code}`;
      
      if (EMAILJS_SERVICE_ID === 'YOUR_SERVICE_ID') {
         message += `\n\n(To send real emails, configure EmailJS in services/storageService.ts)`;
      }

      alert(message);
    }

    return code;
  },

  // 2. Verify OTP
  verifyOTP: (email: string, inputCode: string): boolean => {
    const record = otpStore.get(email.toLowerCase());
    
    if (!record) return false;
    if (Date.now() > record.expiry) {
      otpStore.delete(email.toLowerCase());
      return false;
    }
    
    if (record.code === inputCode) {
      otpStore.delete(email.toLowerCase()); // Clear used OTP
      return true;
    }
    
    return false;
  },

  // 3. Finalize Login/Signup (Called after OTP is verified)
  loginOrSignup: (name: string, email: string, receiveUpdates: boolean): User => {
    const usersJson = localStorage.getItem(USERS_KEY);
    const users: User[] = usersJson ? JSON.parse(usersJson) : [];
    
    let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (user) {
      // Update existing user preferences
      if (name) user.name = name; 
      user.receiveUpdates = receiveUpdates;
      
      const otherUsers = users.filter(u => u.id !== user!.id);
      localStorage.setItem(USERS_KEY, JSON.stringify([...otherUsers, user]));
    } else {
      // Create new user
      user = {
        id: Math.random().toString(36).substr(2, 9),
        name: name || 'User',
        email,
        receiveUpdates,
        joinedAt: new Date().toISOString()
      };
      localStorage.setItem(USERS_KEY, JSON.stringify([...users, user]));
    }
    
    localStorage.setItem(CURRENT_USER_KEY, user.id);
    return user;
  },

  getCurrentUser: (): User | null => {
    const userId = localStorage.getItem(CURRENT_USER_KEY);
    if (!userId) return null;
    
    const usersJson = localStorage.getItem(USERS_KEY);
    const users: User[] = usersJson ? JSON.parse(usersJson) : [];
    return users.find(u => u.id === userId) || null;
  },

  logout: () => {
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  // --- Reports ---

  saveReport: (userId: string, userData: UserData, analysis: AnalysisResult): SavedReport => {
    const reportsJson = localStorage.getItem(REPORTS_KEY);
    const reports: SavedReport[] = reportsJson ? JSON.parse(reportsJson) : [];
    
    const newReport: SavedReport = {
      id: Math.random().toString(36).substr(2, 9),
      userId,
      timestamp: new Date().toISOString(),
      userData,
      analysis,
      referenceId: `FNT-${Math.random().toString(36).substring(7).toUpperCase()}`
    };

    localStorage.setItem(REPORTS_KEY, JSON.stringify([newReport, ...reports]));
    return newReport;
  },

  getUserReports: (userId: string): SavedReport[] => {
    const reportsJson = localStorage.getItem(REPORTS_KEY);
    const reports: SavedReport[] = reportsJson ? JSON.parse(reportsJson) : [];
    return reports.filter(r => r.userId === userId).sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  },

  deleteReport: (reportId: string) => {
     const reportsJson = localStorage.getItem(REPORTS_KEY);
     if (!reportsJson) return;
     const reports: SavedReport[] = JSON.parse(reportsJson);
     const filtered = reports.filter(r => r.id !== reportId);
     localStorage.setItem(REPORTS_KEY, JSON.stringify(filtered));
  }
};