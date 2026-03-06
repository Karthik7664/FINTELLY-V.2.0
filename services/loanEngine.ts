
import { UserData, AnalysisResult, RiskLevel, LoanType, BankScheme, RecommendedScheme } from '../types';
import { BANK_SCHEMES } from '../constants';

/**
 * AI AGENT ARCHITECTURE
 * These functions act as independent agents that process user data to provide insights.
 */

// 1. Eligibility Agent
const checkEligibility = (data: UserData): { isEligible: boolean; reasons: string[] } => {
  const reasons: string[] = [];
  let isEligible = true;

  // Age criteria
  if (data.age && (data.age < 21 || data.age > 65)) {
    isEligible = false;
    reasons.push('Age must be between 21 and 65 for most Indian banks.');
  }

  // CIBIL criteria
  if (data.cibilScore && data.cibilScore < 650) {
    isEligible = false;
    reasons.push('CIBIL score is below the typical minimum threshold of 650.');
  }

  // Specific Loan Type Rules
  switch (data.loanType) {
    case LoanType.PERSONAL:
      if (data.monthlyIncome && data.monthlyIncome < 25000) {
        isEligible = false;
        reasons.push('Minimum monthly income for Personal Loans is usually ₹25,000.');
      }
      break;
    case LoanType.BUSINESS:
      if (data.businessTurnover && data.businessTurnover < 1500000) {
        isEligible = false;
        reasons.push('Business loans typically require a minimum annual turnover of ₹15 Lakhs.');
      }
      if (data.age && data.age < 25) {
        isEligible = false;
        reasons.push('Most banks require business owners to be at least 25 years old.');
      }
      break;
    case LoanType.CAR:
      if (data.monthlyIncome && data.monthlyIncome < 20000) {
        isEligible = false;
        reasons.push('Minimum monthly income for Car Loans is usually ₹20,000.');
      }
      if (data.vehicleCost && data.loanAmount && data.loanAmount > data.vehicleCost * 0.9) {
        reasons.push('Note: Financing more than 90% of the vehicle cost may be difficult.');
      }
      break;
    case LoanType.EDUCATION:
      if (data.age && data.age > 35) {
        reasons.push('Note: Education loans for individuals above 35 may require stronger collateral or co-borrower profiles.');
      }
      break;
    case LoanType.HOME:
      if (data.propertyValue && data.loanAmount && data.loanAmount > data.propertyValue * 0.8) {
        reasons.push('Note: Home loans typically cover up to 80% of property value (LTV Ratio).');
      }
      break;
  }

  return { isEligible, reasons };
};

// 2. Risk Analysis Agent
const analyzeRisk = (data: UserData): { foir: number; riskLevel: RiskLevel } => {
  const monthlyIncome = data.monthlyIncome || 1;
  const existingEMI = data.existingEMI || 0;
  
  // Calculate FOIR (Fixed Obligation to Income Ratio)
  const foir = (existingEMI / monthlyIncome) * 100;

  let riskLevel = RiskLevel.LOW;
  if (foir > 60) riskLevel = RiskLevel.HIGH;
  else if (foir > 40 || (data.cibilScore && data.cibilScore < 700)) riskLevel = RiskLevel.MEDIUM;

  return { foir, riskLevel };
};

// 3. ML Prediction Agent (Modular Placeholder)
const predictApproval = (data: UserData, foir: number): number => {
  let score = 0;
  
  // CIBIL Contribution (Max 40 points)
  const cibil = data.cibilScore || 300;
  score += Math.min(40, Math.max(0, ((cibil - 300) / 600) * 40));
  
  // FOIR Contribution (Max 30 points)
  // Lower FOIR is better. If FOIR is 0%, score is 30. If FOIR is 100%, score is 0.
  score += Math.max(0, 30 - (foir / 100) * 30);
  
  // Income/Turnover Contribution (Max 20 points)
  if (data.loanType === LoanType.BUSINESS) {
    const turnover = data.businessTurnover || 0;
    score += Math.min(20, (turnover / 5000000) * 20);
  } else {
    const income = data.monthlyIncome || 0;
    score += Math.min(20, (income / 100000) * 20);
  }

  // Age Stability Contribution (Max 10 points)
  if (data.age && data.age >= 25 && data.age <= 50) score += 10;
  else score += 5;

  // Cap at 98% to maintain banking realism (no approval is ever 100% guaranteed via app)
  return Math.min(98, Math.round(score));
};

// 4. Recommendation Agent
const getRecommendations = (data: UserData, schemes: BankScheme[]): RecommendedScheme[] => {
  const allSchemesForType = schemes.filter(s => s.loanType === data.loanType);

  const processedSchemes: RecommendedScheme[] = allSchemesForType.map(scheme => {
    let isStrict = true;
    let reasons: string[] = [];

    if (data.cibilScore && data.cibilScore < scheme.minCibil) {
      isStrict = false;
      reasons.push(`CIBIL < ${scheme.minCibil}`);
    }
    
    if (data.loanTenure && data.loanTenure > scheme.maxTenure) {
        isStrict = false;
        reasons.push(`Max Tenure ${scheme.maxTenure}y`);
    }

    return {
      ...scheme,
      matchType: isStrict ? 'strict' : 'partial',
      matchReason: isStrict ? 'Eligible' : `Concern: ${reasons.join(', ')}`
    };
  });
  
  processedSchemes.sort((a, b) => {
      if (a.matchType === b.matchType) {
          return a.interestRate - b.interestRate;
      }
      return a.matchType === 'strict' ? -1 : 1;
  });

  return processedSchemes.slice(0, 4);
};

// 5. Improvement Strategy Agent
const generateImprovementTips = (data: UserData, foir: number, risk: RiskLevel, probability: number): string[] => {
  const tips: string[] = [];

  // If approval is high and risk low, no major improvements needed
  if (probability > 80 && risk === RiskLevel.LOW) return tips;

  // 1. Add Co-applicant (Trigger: High FOIR or Low Income)
  if (foir > 50 || (data.monthlyIncome && data.monthlyIncome < 40000)) {
    tips.push("Add a Co-applicant: Adding a working spouse or parent can increase total eligibility and spread the risk.");
  }

  // 2. Reduce Loan Amount (Trigger: High FOIR or Risk High)
  if (foir > 60 || risk === RiskLevel.HIGH) {
    tips.push("Reduce Loan Amount: Lowering the principal amount will reduce your EMI burden and lower your FOIR.");
  }

  // 3. Improve Credit Score (Trigger: CIBIL < 750)
  if (data.cibilScore && data.cibilScore < 750) {
    tips.push("Improve Credit Score: Clear outstanding credit card dues and avoid new loan enquiries to boost your score above 750.");
  }

  // 4. Increase Down Payment (Trigger: High LTV for Asset Loans)
  const isAssetLoan = data.loanType === LoanType.HOME || data.loanType === LoanType.CAR;
  if (isAssetLoan) {
      let ltv = 0;
      if (data.loanType === LoanType.HOME && data.propertyValue) {
          ltv = (data.loanAmount || 0) / data.propertyValue;
      } else if (data.loanType === LoanType.CAR && data.vehicleCost) {
          ltv = (data.loanAmount || 0) / data.vehicleCost;
      }

      if (ltv > 0.8) {
           tips.push("Increase Down Payment: Paying more upfront reduces the Loan-to-Value (LTV) ratio, increasing approval chances.");
      }
  }

  // 5. Tenure Adjustment (Trigger: High EMI burden but low age)
  if (foir > 50 && data.age && data.age < 45) {
      tips.push("Increase Tenure: Opting for a longer repayment period reduces monthly EMI, improving your FOIR.");
  }

  return tips;
};


// Central Orchestrator
export const analyzeLoanProfile = (data: UserData, schemes: BankScheme[] = BANK_SCHEMES): AnalysisResult => {
  const { isEligible, reasons } = checkEligibility(data);
  const { foir, riskLevel } = analyzeRisk(data);
  const approvalProbability = predictApproval(data, foir);
  const recommendations = getRecommendations(data, schemes);
  const improvementTips = generateImprovementTips(data, foir, riskLevel, approvalProbability);
  
  return {
    isEligible,
    reasons,
    foir,
    riskLevel,
    approvalProbability,
    recommendations,
    improvementTips,
    explanation: "" 
  };
};
