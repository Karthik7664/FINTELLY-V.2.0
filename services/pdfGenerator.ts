
import { jsPDF } from 'jspdf';
import { UserData, AnalysisResult } from '../types';

const cleanTextForPDF = (text: string): string => {
  if (!text) return "";
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/[#*_~`]/g, '')
    .replace(/[\n\r\t]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[^\x20-\x7E]/g, '')
    .trim();
};

const getBase64ImageFromURL = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.setAttribute("crossOrigin", "anonymous");
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } else {
        reject(new Error("Canvas failure"));
      }
    };
    img.onerror = () => reject(new Error("Image load error"));
    img.src = url;
  });
};

const getAppLogoBase64 = (): Promise<string> => {
  return new Promise((resolve) => {
    const svgString = `
      <svg width="512" height="512" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <stop stop-color="#4F46E5"/>
            <stop offset="1" stop-color="#7C3AED"/>
          </linearGradient>
        </defs>
        <circle cx="32" cy="32" r="32" fill="url(#g)"/>
        <path d="M16 42 L26 32 L34 40 L48 22" stroke="white" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M38 22 H48 V32" stroke="white" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="16" cy="42" r="3" fill="white"/>
      </svg>
    `;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, 512, 512);
        resolve(canvas.toDataURL("image/png"));
      } else {
        resolve("");
      }
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgString);
  });
};

export const generatePDF = async (userData: UserData, analysis: AnalysisResult, customRefId?: string) => {
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4', compress: true });
    
  const pageWidth = doc.internal.pageSize.getWidth();
  const primaryColor = [79, 70, 229]; // Indigo 600
  const textColor = [30, 41, 59];
  const goldColor = [217, 119, 6]; // Amber 600
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const refId = customRefId || `FNT-${Math.random().toString(36).substring(7).toUpperCase()}`;

  // --- HEADER ---
  let currentY = 0;
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 55, 'F');
  
  // Add App Logo
  const appLogoBase64 = await getAppLogoBase64();
  if (appLogoBase64) {
    doc.addImage(appLogoBase64, 'PNG', 15, 12, 18, 18);
  }

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(32);
  doc.setFont("helvetica", "bold");
  doc.text("FINTELLY", 38, 22); 
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("INSTITUTIONAL BANKING & CREDIT ADVISORY", 38, 30);
  
  doc.setFontSize(9);
  doc.text(`ISSUED: ${dateStr}`, pageWidth - 15, 20, { align: 'right' });
  doc.text(`TIME: ${timeStr}`, pageWidth - 15, 25, { align: 'right' });
  doc.text(`REF: ${refId}`, pageWidth - 15, 30, { align: 'right' });
  
  // --- SECTION 1: CUSTOMER PORTFOLIO ---
  currentY = 75;
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("1. CUSTOMER PORTFOLIO", 15, currentY);
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(1);
  doc.line(15, currentY + 2, 95, currentY + 2);
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Applicant Name:", 15, currentY + 15);
  doc.setFont("helvetica", "normal");
  doc.text(`${userData.name}`, 60, currentY + 15);

  doc.setFont("helvetica", "bold");
  doc.text("Facility Type:", 15, currentY + 23);
  doc.setFont("helvetica", "normal");
  doc.text(`${userData.loanType}`, 60, currentY + 23);

  doc.setFont("helvetica", "bold");
  doc.text("Capital Sum:", 15, currentY + 31);
  doc.setFont("helvetica", "normal");
  doc.text(`INR ${userData.loanAmount?.toLocaleString('en-IN')}`, 60, currentY + 31);

  doc.setFont("helvetica", "bold");
  doc.text("Repayment Term:", 15, currentY + 39);
  doc.setFont("helvetica", "normal");
  doc.text(`${userData.loanTenure} Years`, 60, currentY + 39);
  
  // --- SECTION 2: CREDIT UNDERWRITING ---
  currentY = 132;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("2. CREDIT UNDERWRITING", 15, currentY);
  doc.line(15, currentY + 2, 95, currentY + 2);
  
  doc.setFontSize(10);
  const metricsData = [
    ["Credit Bureau Score", userData.cibilScore?.toString() || "N/A"],
    ["Net Monthly Income", `INR ${userData.monthlyIncome?.toLocaleString()}`],
    ["Obligation Ratio (FOIR)", `${analysis.foir.toFixed(2)}%`],
    ["Risk Classification", analysis.riskLevel],
    ["Approval Probability", `${analysis.approvalProbability}%`]
  ];

  let metricY = currentY + 15;
  metricsData.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text(label, 15, metricY);
    doc.setFont("helvetica", "bold"); 
    if (label === "Risk Classification") {
      doc.setTextColor(value === "Low" ? 22 : 220, value === "Low" ? 163 : 38, value === "Low" ? 74 : 38); 
    } else {
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    }
    doc.text(value, pageWidth - 15, metricY, { align: 'right' });
    metricY += 10;
  });

  currentY = metricY + 10;
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont("helvetica", "bold");
  doc.text("SENIOR UNDERWRITER ASSESSMENT:", 15, currentY);
  
  const summaryText = cleanTextForPDF(analysis.explanation || "Repayment capacity suggests stability.");
  const splitSummary = doc.splitTextToSize(summaryText, pageWidth - 40);
  const boxHeight = (splitSummary.length * 6) + 12;
  
  doc.setFillColor(248, 250, 255);
  doc.setDrawColor(220, 220, 230);
  doc.roundedRect(15, currentY + 4, pageWidth - 30, boxHeight, 3, 3, 'FD');
  
  doc.setFont("helvetica", "normal");
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFontSize(10);
  doc.text(splitSummary, 20, currentY + 14, { align: 'left', charSpace: 0, lineHeightFactor: 1.5 });
  
  currentY = currentY + boxHeight + 15;

  // --- GOLD SECTION: IMPROVEMENT TIPS ---
  if (analysis.improvementTips && analysis.improvementTips.length > 0) {
      if (currentY > 240) { doc.addPage(); currentY = 25; }
      
      doc.setTextColor(goldColor[0], goldColor[1], goldColor[2]);
      doc.setFont("helvetica", "bold");
      doc.text("STRATEGIC IMPROVEMENTS:", 15, currentY);
      
      doc.setDrawColor(goldColor[0], goldColor[1], goldColor[2]);
      doc.setLineWidth(0.5);
      
      let tipY = currentY + 6;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      
      analysis.improvementTips.forEach(tip => {
            const cleanTip = cleanTextForPDF(tip);
            const splitTip = doc.splitTextToSize(`• ${cleanTip}`, pageWidth - 40);
            doc.text(splitTip, 15, tipY);
            tipY += (splitTip.length * 5) + 3;
      });
      
      currentY = tipY + 10;
  }
  
  // --- SECTION 3: PRIORITY INSTITUTIONAL MATCHES ---
  if (currentY > 240) { doc.addPage(); currentY = 25; }
  
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("3. PRIORITY INSTITUTIONAL MATCHES", 15, currentY);
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(1);
  doc.line(15, currentY + 2, 125, currentY + 2);

  currentY += 15;
  const cardHeight = 24;

  for (const bank of analysis.recommendations) {
    if (currentY > 260) { doc.addPage(); currentY = 20; }
    
    // Card Background
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(225, 230, 240);
    doc.setLineWidth(0.5);
    doc.roundedRect(15, currentY, pageWidth - 30, cardHeight, 3, 3, 'FD');
    
    const centerY = currentY + (cardHeight / 2) + 1;

    // 1. Bank Logo (Left)
    try {
      const logoBase64 = await getBase64ImageFromURL(bank.logoUrl);
      const logoY = currentY + 3;
      doc.addImage(logoBase64, 'PNG', 18, logoY, 20, 18, undefined, 'FAST');
      
      if (bank.isLive) {
          doc.setFillColor(34, 197, 94);
          doc.circle(38, currentY + 20, 1.5, 'F');
      }
    } catch (e) {
      doc.setFillColor(245, 245, 245);
      doc.circle(28, currentY + 12, 8, 'F');
      doc.setFontSize(10);
      doc.text("BK", 28, currentY + 12, { align: 'center', baseline: 'middle' });
    }

    // Interest Rate
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(`${bank.interestRate}%`, 55, centerY);
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text("INT. RATE", 55, centerY - 6);

    // Processing Fee
    doc.setFont("helvetica", "bold");
    doc.setFontSize(bank.processingFee.length > 15 ? 8 : 10);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text(bank.processingFee, 95, centerY);
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text("PROC. FEE", 95, centerY - 6);

    // Tenure
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text(`${bank.maxTenure} Yrs`, 135, centerY);
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text("MAX TENURE", 135, centerY - 6);

    // 3. Link Button
    const linkX = 165;
    const linkY = currentY + 7;
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.roundedRect(linkX, linkY, 25, 10, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("VISIT PORTAL", linkX + 12.5, linkY + 6.5, { align: 'center' });
    
    // Make the button area clickable
    doc.link(linkX, linkY, 25, 10, { url: bank.officialUrl });

    currentY += (cardHeight + 5);
  }
  doc.save(`Fintelly_Report_${refId}.pdf`);
};
