import jsPDF from 'jspdf';
import type { ChatResponse } from '../services/api';

export const exportToPDF = (data: ChatResponse, query: string) => {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text(`Research Analysis: ${query}`, 20, 20);
  
  doc.setFontSize(12);
  doc.text(`Refined Query: ${data.refined_query}`, 20, 30);
  
  let yPos = 45;
  doc.setFontSize(14);
  doc.text('Analyzed Papers:', 20, yPos);
  yPos += 10;
  
  doc.setFontSize(10);
  data.papers.forEach((paper, i) => {
    if (yPos > 270) { doc.addPage(); yPos = 20; }
    doc.text(`${i + 1}. ${paper.title}`, 20, yPos, { maxWidth: 170 });
    yPos += 6;
    doc.text(`Summary: ${paper.summary?.simple_explanation ?? 'No summary available.'}`, 20, yPos, { maxWidth: 170 });
    yPos += 12;
  });
  
  doc.addPage();
  yPos = 20;
  doc.setFontSize(14);
  doc.text('Research Gaps:', 20, yPos);
  yPos += 10;
  doc.setFontSize(10);
  data.gap_analysis.research_gaps?.forEach((gap) => {
    if (yPos > 270) { doc.addPage(); yPos = 20; }
    doc.text(`• ${gap}`, 20, yPos, { maxWidth: 170 });
    yPos += 6;
  });

  doc.save(`ResearchIQ-${query.replace(/\s+/g, '-')}.pdf`);
};