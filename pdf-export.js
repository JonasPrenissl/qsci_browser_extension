/**
 * Q-SCI PDF Export Module
 * Exports analysis results to a beautifully styled PDF matching the extension design
 */

// Import jsPDF
import { jsPDF } from 'jspdf';

// Q-SCI Brand Colors (matching the extension design)
const COLORS = {
  primary: [102, 126, 234],      // #667eea - Main purple
  secondary: [118, 75, 162],     // #764ba2 - Darker purple
  success: [16, 185, 129],       // #10b981 - Green
  warning: [251, 191, 36],       // #fbbf24 - Yellow/Orange
  danger: [239, 68, 68],         // #ef4444 - Red
  text: [45, 55, 72],            // #2d3748 - Dark gray
  textLight: [107, 114, 128],    // #6b7280 - Light gray
  background: [247, 250, 252],   // #f7fafc - Light background
  white: [255, 255, 255],        // #ffffff
  border: [226, 232, 240]        // #e2e8f0 - Border gray
};

/**
 * Export analysis to PDF
 * @param {Object} analysis - The analysis data to export
 * @param {Array} chatHistory - Optional chat history to include
 * @returns {void}
 */
export function exportAnalysisToPDF(analysis, chatHistory = []) {
  console.log('Q-SCI PDF Export: Starting PDF generation...');
  
  if (!analysis) {
    throw new Error('No analysis data available to export.');
  }

  // Create new PDF document (A4 size)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = margin;

  // --- HEADER WITH GRADIENT EFFECT ---
  // Create purple gradient header (simulated with rectangles)
  const headerHeight = 35;
  
  // Draw gradient rectangles (simulate gradient)
  const gradientSteps = 20;
  for (let i = 0; i < gradientSteps; i++) {
    const ratio = i / gradientSteps;
    const r = COLORS.primary[0] + (COLORS.secondary[0] - COLORS.primary[0]) * ratio;
    const g = COLORS.primary[1] + (COLORS.secondary[1] - COLORS.primary[1]) * ratio;
    const b = COLORS.primary[2] + (COLORS.secondary[2] - COLORS.primary[2]) * ratio;
    
    doc.setFillColor(r, g, b);
    doc.rect(0, i * (headerHeight / gradientSteps), pageWidth, headerHeight / gradientSteps, 'F');
  }

  // Add Q-SCI logo box in header
  doc.setFillColor(255, 255, 255, 0.25);
  doc.roundedRect(margin, 10, 25, 15, 2, 2, 'F');
  
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Q-SCI', margin + 3.5, 19);

  // Add title in header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Qualitätsprüfung', margin + 30, 15);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('FÜR WISSENSCHAFTLICHE PUBLIKATIONEN', margin + 30, 21);

  yPosition = headerHeight + 15;

  // --- DOCUMENT TITLE ---
  doc.setTextColor(...COLORS.text);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Analyse-Ergebnis', margin, yPosition);
  yPosition += 12;

  // Add generation date
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.textLight);
  const dateStr = new Date().toLocaleString('de-DE', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.text(`Generiert am: ${dateStr}`, margin, yPosition);
  yPosition += 10;

  // --- QUALITY SCORE BOX ---
  const qualityScore = analysis.quality_percentage || analysis.score || 0;
  const scoreBoxHeight = 25;
  
  // Determine color based on score
  let scoreColor;
  if (qualityScore >= 80) {
    scoreColor = COLORS.success;
  } else if (qualityScore >= 50) {
    scoreColor = COLORS.warning;
  } else {
    scoreColor = COLORS.danger;
  }

  // Draw score box background
  doc.setFillColor(...scoreColor);
  doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, scoreBoxHeight, 3, 3, 'F');

  // Add score text
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('QUALITÄTS-SCORE', margin + 5, yPosition + 8);
  
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text(`${Math.round(qualityScore)}%`, margin + 5, yPosition + 20);

  // Add traffic light assessment on the right side
  if (analysis.traffic_light) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const trafficText = `Bewertung: ${analysis.traffic_light}`;
    doc.text(trafficText, pageWidth - margin - 5, yPosition + 13, { align: 'right' });
  }

  yPosition += scoreBoxHeight + 10;

  // --- REASONING / JUSTIFICATION SECTION ---
  if (analysis.reasoning || analysis.justification) {
    const reasoningText = analysis.reasoning || analysis.justification;
    
    // Add section title
    doc.setTextColor(...COLORS.text);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Begründung', margin, yPosition);
    yPosition += 7;

    // Add reasoning box
    doc.setFillColor(...COLORS.background);
    doc.setDrawColor(...COLORS.primary);
    doc.setLineWidth(0.5);
    
    // Split reasoning into paragraphs
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.text);
    
    const reasoningLines = doc.splitTextToSize(reasoningText, pageWidth - 2 * margin - 10);
    const reasoningHeight = reasoningLines.length * 5 + 10;
    
    // Check if we need a new page
    if (yPosition + reasoningHeight > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
    }
    
    doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, reasoningHeight, 2, 2);
    doc.rect(margin, yPosition, 2, reasoningHeight, 'F'); // Left colored border
    
    doc.text(reasoningLines, margin + 7, yPosition + 7);
    yPosition += reasoningHeight + 10;
  }

  // --- JOURNAL INFORMATION ---
  if (analysis.journal_info) {
    const jInfo = analysis.journal_info;
    const jName = jInfo.journal_name || jInfo.name || '';
    
    if (jName) {
      // Check if we need a new page
      if (yPosition + 30 > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.text);
      doc.text('Journal-Information', margin, yPosition);
      yPosition += 10;

      // Draw journal info as styled boxes instead of table
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      const journalInfo = [
        { label: 'Journal', value: jName },
        { label: 'Impact Factor', value: jInfo.impact_factor || 'N/A' },
        { label: 'Quartile', value: jInfo.quartile || 'N/A' },
        { label: 'Prestige Tier', value: jInfo.prestige_tier || 'N/A' }
      ];

      journalInfo.forEach(info => {
        doc.setFillColor(...COLORS.background);
        doc.rect(margin, yPosition, pageWidth - 2 * margin, 8, 'F');
        
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLORS.text);
        doc.text(info.label + ':', margin + 3, yPosition + 5);
        
        doc.setFont('helvetica', 'normal');
        doc.text(info.value, margin + 50, yPosition + 5);
        
        yPosition += 9;
      });

      yPosition += 5;
    }
  }

  // --- POSITIVE ASPECTS ---
  if (analysis.positive_aspects && analysis.positive_aspects.length > 0) {
    // Check if we need a new page
    if (yPosition + 20 > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.text);
    doc.text('✅ Positive Aspekte', margin, yPosition);
    yPosition += 7;

    analysis.positive_aspects.forEach((aspect, index) => {
      // Extract aspect data
      let aspectText, aspectSource, aspectExplanation;
      if (typeof aspect === 'string') {
        aspectText = aspect;
        aspectSource = null;
        aspectExplanation = null;
      } else if (typeof aspect === 'object') {
        aspectText = aspect.aspect || aspect.text || '';
        aspectSource = aspect.source_text || aspect.source || null;
        aspectExplanation = aspect.explanation || null;
      }

      // Check if we need a new page
      if (yPosition + 25 > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }

      // Draw aspect box
      doc.setFillColor(220, 252, 231); // Light green background
      doc.setDrawColor(...COLORS.success);
      doc.setLineWidth(0.3);
      
      // Calculate box height
      doc.setFontSize(10);
      const aspectLines = doc.splitTextToSize(aspectText, pageWidth - 2 * margin - 15);
      let boxHeight = aspectLines.length * 5 + 8;
      
      // Add space for source and explanation
      if (aspectSource) {
        const sourceLines = doc.splitTextToSize(`"${aspectSource}"`, pageWidth - 2 * margin - 15);
        boxHeight += sourceLines.length * 4 + 6;
      }
      if (aspectExplanation) {
        const explLines = doc.splitTextToSize(aspectExplanation, pageWidth - 2 * margin - 15);
        boxHeight += explLines.length * 4 + 6;
      }

      doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, boxHeight, 2, 2, 'FD');

      // Add aspect text
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.text);
      doc.text(`${index + 1}. ${aspectText}`, margin + 5, yPosition + 5, {
        maxWidth: pageWidth - 2 * margin - 15
      });
      
      let currentY = yPosition + 5 + aspectLines.length * 5;

      // Add source if available
      if (aspectSource && aspectSource.trim() !== '') {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        doc.setTextColor(...COLORS.textLight);
        doc.text('Quelle:', margin + 5, currentY + 2);
        currentY += 5;
        doc.text(`"${aspectSource}"`, margin + 5, currentY, {
          maxWidth: pageWidth - 2 * margin - 15
        });
        const sourceLines = doc.splitTextToSize(`"${aspectSource}"`, pageWidth - 2 * margin - 15);
        currentY += sourceLines.length * 4;
      }

      // Add explanation if available
      if (aspectExplanation && aspectExplanation.trim() !== '') {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...COLORS.textLight);
        doc.text('Erklärung:', margin + 5, currentY + 2);
        currentY += 5;
        doc.text(aspectExplanation, margin + 5, currentY, {
          maxWidth: pageWidth - 2 * margin - 15
        });
        const explLines = doc.splitTextToSize(aspectExplanation, pageWidth - 2 * margin - 15);
        currentY += explLines.length * 4;
      }

      yPosition += boxHeight + 5;
    });

    yPosition += 5;
  }

  // --- NEGATIVE ASPECTS / AREAS FOR IMPROVEMENT ---
  if (analysis.negative_aspects && analysis.negative_aspects.length > 0) {
    // Check if we need a new page
    if (yPosition + 20 > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.text);
    doc.text('⚠️ Verbesserungsbereiche', margin, yPosition);
    yPosition += 7;

    analysis.negative_aspects.forEach((aspect, index) => {
      // Extract aspect data
      let aspectText, aspectSource, aspectExplanation;
      if (typeof aspect === 'string') {
        aspectText = aspect;
        aspectSource = null;
        aspectExplanation = null;
      } else if (typeof aspect === 'object') {
        aspectText = aspect.aspect || aspect.text || '';
        aspectSource = aspect.source_text || aspect.source || null;
        aspectExplanation = aspect.explanation || null;
      }

      // Check if we need a new page
      if (yPosition + 25 > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }

      // Draw aspect box
      doc.setFillColor(254, 243, 199); // Light yellow/orange background
      doc.setDrawColor(...COLORS.warning);
      doc.setLineWidth(0.3);
      
      // Calculate box height
      doc.setFontSize(10);
      const aspectLines = doc.splitTextToSize(aspectText, pageWidth - 2 * margin - 15);
      let boxHeight = aspectLines.length * 5 + 8;
      
      // Add space for source and explanation
      if (aspectSource) {
        const sourceLines = doc.splitTextToSize(`"${aspectSource}"`, pageWidth - 2 * margin - 15);
        boxHeight += sourceLines.length * 4 + 6;
      }
      if (aspectExplanation) {
        const explLines = doc.splitTextToSize(aspectExplanation, pageWidth - 2 * margin - 15);
        boxHeight += explLines.length * 4 + 6;
      }

      doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, boxHeight, 2, 2, 'FD');

      // Add aspect text
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.text);
      doc.text(`${index + 1}. ${aspectText}`, margin + 5, yPosition + 5, {
        maxWidth: pageWidth - 2 * margin - 15
      });
      
      let currentY = yPosition + 5 + aspectLines.length * 5;

      // Add source if available
      if (aspectSource && aspectSource.trim() !== '') {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        doc.setTextColor(...COLORS.textLight);
        doc.text('Quelle:', margin + 5, currentY + 2);
        currentY += 5;
        doc.text(`"${aspectSource}"`, margin + 5, currentY, {
          maxWidth: pageWidth - 2 * margin - 15
        });
        const sourceLines = doc.splitTextToSize(`"${aspectSource}"`, pageWidth - 2 * margin - 15);
        currentY += sourceLines.length * 4;
      }

      // Add explanation if available
      if (aspectExplanation && aspectExplanation.trim() !== '') {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...COLORS.textLight);
        doc.text('Erklärung:', margin + 5, currentY + 2);
        currentY += 5;
        doc.text(aspectExplanation, margin + 5, currentY, {
          maxWidth: pageWidth - 2 * margin - 15
        });
        const explLines = doc.splitTextToSize(aspectExplanation, pageWidth - 2 * margin - 15);
        currentY += explLines.length * 4;
      }

      yPosition += boxHeight + 5;
    });

    yPosition += 5;
  }

  // --- CHAT HISTORY / USER QUESTIONS ---
  if (chatHistory && chatHistory.length > 0) {
    // Filter to get only user-AI exchanges (skip system messages)
    const userExchanges = [];
    for (let i = 0; i < chatHistory.length; i++) {
      if (chatHistory[i].role === 'user' && i + 1 < chatHistory.length && chatHistory[i + 1].role === 'assistant') {
        userExchanges.push({
          question: chatHistory[i].content,
          answer: chatHistory[i + 1].content
        });
      }
    }

    if (userExchanges.length > 0) {
      // Check if we need a new page
      if (yPosition + 20 > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.text);
      doc.text('Fragen zur Publikation', margin, yPosition);
      yPosition += 7;

      userExchanges.forEach((exchange, index) => {
        // Check if we need a new page
        if (yPosition + 30 > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }

        // Question box
        doc.setFillColor(224, 231, 255); // Light blue background
        doc.setDrawColor(...COLORS.primary);
        doc.setLineWidth(0.3);

        doc.setFontSize(10);
        const questionLines = doc.splitTextToSize(exchange.question, pageWidth - 2 * margin - 15);
        const questionHeight = questionLines.length * 5 + 8;

        doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, questionHeight, 2, 2, 'FD');
        
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLORS.primary);
        doc.text(`Frage ${index + 1}:`, margin + 5, yPosition + 5);
        
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...COLORS.text);
        doc.text(exchange.question, margin + 5, yPosition + 10, {
          maxWidth: pageWidth - 2 * margin - 15
        });

        yPosition += questionHeight + 3;

        // Answer box
        doc.setFillColor(240, 249, 255); // Very light blue background
        doc.setDrawColor(...COLORS.primary);
        doc.setLineWidth(0.2);

        const answerLines = doc.splitTextToSize(exchange.answer, pageWidth - 2 * margin - 15);
        const answerHeight = answerLines.length * 5 + 8;

        // Check if answer box needs a new page
        if (yPosition + answerHeight > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }

        doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, answerHeight, 2, 2, 'FD');
        
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLORS.primary);
        doc.text('Antwort:', margin + 5, yPosition + 5);
        
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...COLORS.text);
        doc.text(exchange.answer, margin + 5, yPosition + 10, {
          maxWidth: pageWidth - 2 * margin - 15
        });

        yPosition += answerHeight + 8;
      });
    }
  }

  // --- FOOTER ---
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Add footer line
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.5);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
    
    // Add footer text
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.textLight);
    doc.text('Generiert mit Q-SCI Browser Extension', margin, pageHeight - 10);
    doc.text(`Seite ${i} von ${pageCount}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
  }

  // --- SAVE PDF ---
  const timestamp = new Date().getTime();
  const fileName = `qsci-analysis-${timestamp}.pdf`;
  doc.save(fileName);
  
  console.log('Q-SCI PDF Export: PDF generated successfully:', fileName);
}

// Export as global function for use in popup.js
window.exportAnalysisToPDF = exportAnalysisToPDF;
