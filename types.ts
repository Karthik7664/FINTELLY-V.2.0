
export enum LoanType {
  HOME = 'Home Loan',
  PERSONAL = 'Personal Loan',
  EDUCATION = 'Education Loan',
  BUSINESS = 'Business Loan',
  CAR = 'Car Loan'
}

export enum EmploymentType {
  SALARIED = 'Salaried',
  SELF_EMPLOYED = 'Self-Employed',
  STUDENT = 'Student'
}

export enum RiskLevel {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High'
}

export interface UserData {
  name?: string;
  loanType?: LoanType;
  age?: number;
  employment?: EmploymentType;
  monthlyIncome?: number;
  existingEMI?: number;
  cibilScore?: number;
  loanAmount?: number;
  loanTenure?: number; // In years
  propertyValue?: number; // Only for Home Loans
  businessTurnover?: number; // Only for Business Loans
  vehicleCost?: number; // Only for Car Loans
}

export interface BankScheme {
  id: string;
  bankName: string;
  loanType: LoanType;
  interestRate: number;
  minCibil: number;
  maxTenure: number;
  processingFee: string;
  officialUrl: string;
  logoUrl: string;
  logoClass?: string; // Optional custom tailwind class for logo sizing/scaling
  lastUpdated?: string; // ISO string
  isLive?: boolean;
}

export interface RecommendedScheme extends BankScheme {
  matchType: 'strict' | 'partial';
  matchReason?: string;
}

export interface AnalysisResult {
  isEligible: boolean;
  reasons: string[];
  foir: number;
  riskLevel: RiskLevel;
  approvalProbability: number;
  recommendations: RecommendedScheme[];
  explanation: string;
  improvementTips: string[];
}

export interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
  type?: 'text' | 'analysis' | 'recommendations' | 'sync-status';
  payload?: any;
}

export interface User {
  id: string;
  name: string;
  email: string;
  receiveUpdates: boolean;
  joinedAt: string;
}

export interface SavedReport {
  id: string;
  userId: string;
  timestamp: string;
  userData: UserData;
  analysis: AnalysisResult;
  referenceId: string;
}
