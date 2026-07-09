// src/services/resumeExport.service.js — PDF + DOCX export
// Uses pdfkit for server-side PDF and docx npm for Word documents — distinct templates
const PDFDocument = require('pdfkit');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, WidthType, TableRow, TableCell, Table } = require('docx');
const logger = require('../utils/logger');

// ─── Parse Resume Data ────────────────────────────────────────────────────────
function parseResumeData(resumeDataJson) {
  try { return resumeDataJson ? JSON.parse(resumeDataJson) : {}; }
  catch { return {}; }
}

// ─── PDF Export ───────────────────────────────────────────────────────────────
async function exportToPdf(builtResume) {
  const data = parseResumeData(builtResume.resumeData);
  const templateId = (builtResume.templateId || 'modern').toLowerCase();

  return new Promise((resolve, reject) => {
    const chunks = [];
    const doc = new PDFDocument({ size: 'A4', margins: { top: 40, bottom: 40, left: 40, right: 40 } });

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    try {
      switch (templateId) {
        case 'classic':
        case 'elegant':
          renderClassicPdf(doc, data); break;
        case 'minimal':
        case 'compact':
          renderMinimalPdf(doc, data); break;
        case 'professional':
          renderProfessionalPdf(doc, data); break;
        case 'executive':
          renderExecutivePdf(doc, data); break;
        case 'creative':
        case 'timeline':
        case 'sidebar-dark':
        case 'neon-tech':
          renderCreativePdf(doc, data); break;
        default:
          renderModernPdf(doc, data);
      }
    } catch (err) {
      reject(err);
    }
    doc.end();
  });
}

// ─── TEMPLATE: Modern (dark header, teal accent) ──────────────────────────────
function renderModernPdf(doc, data) {
  const ACCENT = '#06B6D4';
  doc.rect(0, 0, doc.page.width, 110).fill('#1E293B');
  doc.fillColor('#FFFFFF').fontSize(22).font('Helvetica-Bold').text(safe(data.fullName, 'Your Name'), 40, 20);
  if (data.summary) {
    doc.fillColor('#94A3B8').fontSize(9).font('Helvetica').text(data.summary, 40, 50, { width: doc.page.width - 80, lineGap: 2 });
  }
  const contact = buildContactLine(data);
  if (contact) {
    const y = data.summary ? 85 : 52;
    doc.fillColor('#5EEAD4').fontSize(8).text(contact, 40, y);
  }
  doc.moveDown(5.5);
  addPdfSkills(doc, data.skills, ACCENT);
  addPdfSection(doc, 'EXPERIENCE', ACCENT);
  addPdfExperience(doc, data.experience);
  addPdfSection(doc, 'EDUCATION', ACCENT);
  addPdfEducation(doc, data.education);
  addPdfSection(doc, 'PROJECTS', ACCENT);
  addPdfProjects(doc, data.projects);
  addPdfCustomSections(doc, data.customSections, ACCENT);
}

// ─── TEMPLATE: Classic / Elegant ──────────────────────────────────────────────
function renderClassicPdf(doc, data) {
  const ACCENT = '#111827';
  doc.fillColor(ACCENT).fontSize(24).font('Times-Bold').text(safe(data.fullName, 'Your Name'), { align: 'center' });
  const contact = buildContactLine(data);
  if (contact) doc.fillColor('#4B5563').fontSize(9).font('Times-Roman').text(contact, { align: 'center' });
  addHrLine(doc, ACCENT, 1.5);
  if (data.summary) {
    doc.moveDown(0.3).fillColor(ACCENT).fontSize(10).font('Times-Bold').text('PROFESSIONAL SUMMARY');
    doc.fillColor('#1F2937').fontSize(9).font('Times-Roman').text(data.summary, { lineGap: 2 }).moveDown(0.5);
  }
  addPdfSection(doc, 'EXPERIENCE', ACCENT);
  addPdfExperience(doc, data.experience);
  addPdfSection(doc, 'EDUCATION', ACCENT);
  addPdfEducation(doc, data.education);
  addPdfSection(doc, 'PROJECTS', ACCENT);
  addPdfProjects(doc, data.projects);
  addPdfSkills(doc, data.skills, ACCENT);
  addPdfCustomSections(doc, data.customSections, ACCENT);
}

// ─── TEMPLATE: Minimal / Compact ──────────────────────────────────────────────
function renderMinimalPdf(doc, data) {
  const ACCENT = '#000000';
  doc.fillColor(ACCENT).fontSize(20).font('Helvetica-Bold').text(safe(data.fullName, 'Your Name'));
  const contact = buildContactLine(data);
  if (contact) doc.fillColor('#646464').fontSize(8).font('Helvetica').text(contact);
  doc.moveDown(0.5);
  if (data.summary) {
    addPdfSection(doc, 'ABOUT', ACCENT);
    doc.fillColor('#323232').fontSize(9).font('Helvetica').text(data.summary, { lineGap: 2 }).moveDown(0.5);
  }
  addPdfSkills(doc, data.skills, ACCENT);
  addPdfSection(doc, 'EXPERIENCE', ACCENT);
  addPdfExperience(doc, data.experience);
  addPdfSection(doc, 'EDUCATION', ACCENT);
  addPdfEducation(doc, data.education);
  addPdfSection(doc, 'PROJECTS', ACCENT);
  addPdfProjects(doc, data.projects);
  addPdfCustomSections(doc, data.customSections, ACCENT);
}

// ─── TEMPLATE: Professional ───────────────────────────────────────────────────
function renderProfessionalPdf(doc, data) {
  const ACCENT = '#0F172A';
  doc.fillColor(ACCENT).fontSize(24).font('Times-Bold').text(safe(data.fullName, 'Your Name'));
  const contact = buildContactLine(data);
  if (contact) doc.fillColor('#475569').fontSize(9).font('Times-Roman').text(contact);
  addHrLine(doc, ACCENT, 1.5);
  if (data.summary) {
    doc.moveDown(0.3).fillColor(ACCENT).fontSize(10).font('Times-Bold').text('PROFESSIONAL SUMMARY');
    addHrLine(doc, ACCENT, 0.6);
    doc.fillColor('#1E293B').fontSize(10).font('Times-Roman').text(data.summary, { lineGap: 2 }).moveDown(0.5);
  }
  addPdfSection(doc, 'EXPERIENCE', ACCENT);
  addPdfExperience(doc, data.experience);
  addPdfSection(doc, 'EDUCATION', ACCENT);
  addPdfEducation(doc, data.education);
  addPdfSection(doc, 'PROJECTS', ACCENT);
  addPdfProjects(doc, data.projects);
  addPdfSkills(doc, data.skills, ACCENT);
  addPdfCustomSections(doc, data.customSections, ACCENT);
}

// ─── TEMPLATE: Executive ──────────────────────────────────────────────────────
function renderExecutivePdf(doc, data) {
  const ACCENT = '#000000';
  doc.fillColor(ACCENT).fontSize(26).font('Helvetica-Bold').text(safe(data.fullName, 'Your Name'), { align: 'center' });
  const contact = buildContactLine(data);
  if (contact) doc.fillColor('#505050').fontSize(9).font('Helvetica').text(contact, { align: 'center' });
  addHrLine(doc, ACCENT, 2);
  if (data.summary) {
    doc.moveDown(0.3).fillColor(ACCENT).fontSize(10).font('Helvetica-Bold').text('EXECUTIVE SUMMARY');
    addHrLine(doc, ACCENT, 0.6);
    doc.fillColor('#282828').fontSize(10).font('Helvetica').text(data.summary, { lineGap: 2, align: 'justify' }).moveDown(0.5);
  }
  addPdfSection(doc, 'PROFESSIONAL EXPERIENCE', ACCENT);
  addPdfExperience(doc, data.experience);
  addPdfSkills(doc, data.skills, ACCENT);
  addPdfSection(doc, 'EDUCATION', ACCENT);
  addPdfEducation(doc, data.education);
  addPdfCustomSections(doc, data.customSections, ACCENT);
}

// ─── TEMPLATE: Creative / Timeline / Sidebar-Dark / Neon-Tech ─────────────────
function renderCreativePdf(doc, data) {
  const ACCENT = '#7C3AED';
  const SOFT = '#DCC8FF';
  doc.rect(0, 0, doc.page.width, 90).fill(ACCENT);
  doc.fillColor('#FFFFFF').fontSize(24).font('Helvetica-Bold').text(safe(data.fullName, 'Your Name'), 40, 18);
  const contact = buildContactLine(data);
  if (contact) doc.fillColor(SOFT).fontSize(8).font('Helvetica').text(contact, 40, 52);
  doc.moveDown(4.5);
  if (data.summary) {
    addPdfSection(doc, 'ABOUT ME', ACCENT);
    doc.fillColor('#0F172A').fontSize(10).font('Helvetica').text(data.summary, { lineGap: 2 }).moveDown(0.5);
  }
  addPdfSection(doc, 'EXPERIENCE', ACCENT);
  addPdfExperience(doc, data.experience);
  addPdfSection(doc, 'PROJECTS', ACCENT);
  addPdfProjects(doc, data.projects);
  addPdfSkills(doc, data.skills, ACCENT);
  addPdfSection(doc, 'EDUCATION', ACCENT);
  addPdfEducation(doc, data.education);
  addPdfCustomSections(doc, data.customSections, ACCENT);
}

// ─── Shared PDF helpers ───────────────────────────────────────────────────────
function addPdfSection(doc, title, color) {
  doc.moveDown(0.4).fillColor(color).fontSize(10).font('Helvetica-Bold').text(title);
  addHrLine(doc, color, 0.5);
}

function addHrLine(doc, color, width) {
  const y = doc.y;
  doc.moveTo(doc.page.margins.left, y).lineTo(doc.page.width - doc.page.margins.right, y)
    .lineWidth(width).strokeColor(color).stroke();
  doc.moveDown(0.3);
}

function addPdfSkills(doc, skills, accent) {
  if (!skills || skills.length === 0) return;
  addPdfSection(doc, 'SKILLS', accent);
  doc.fillColor('#4B4B4B').fontSize(9).font('Helvetica').text(skills.join('  ·  '), { lineGap: 2 }).moveDown(0.4);
}

function addPdfExperience(doc, items) {
  if (!items || items.length === 0) { doc.moveDown(0.3); return; }
  for (const item of items) {
    const title = [safe(item.role, ''), item.company ? `  —  ${item.company}` : ''].join('');
    doc.moveDown(0.3).fillColor('#000000').fontSize(10).font('Helvetica-Bold').text(title);
    if (item.duration) doc.fillColor('#808080').fontSize(8).font('Helvetica-Oblique').text(item.duration);
    if (item.description) doc.fillColor('#4B4B4B').fontSize(9).font('Helvetica').text(item.description, { lineGap: 2 });
  }
  doc.moveDown(0.4);
}

function addPdfEducation(doc, items) {
  if (!items || items.length === 0) { doc.moveDown(0.3); return; }
  for (const item of items) {
    const title = [safe(item.degree, ''), item.college ? `  —  ${item.college}` : ''].join('');
    doc.moveDown(0.3).fillColor('#000000').fontSize(10).font('Helvetica-Bold').text(title);
    if (item.year) doc.fillColor('#808080').fontSize(8).font('Helvetica-Oblique').text(item.year);
    if (item.description) doc.fillColor('#4B4B4B').fontSize(9).font('Helvetica').text(item.description, { lineGap: 2 });
  }
  doc.moveDown(0.4);
}

function addPdfProjects(doc, items) {
  if (!items || items.length === 0) { doc.moveDown(0.3); return; }
  for (const item of items) {
    doc.moveDown(0.3).fillColor('#000000').fontSize(10).font('Helvetica-Bold').text(safe(item.title, 'Project'));
    if (item.techStack) doc.fillColor('#808080').fontSize(8).font('Helvetica-Oblique').text('Tech: ' + item.techStack);
    if (item.description) doc.fillColor('#4B4B4B').fontSize(9).font('Helvetica').text(item.description, { lineGap: 2 });
    if (item.linkUrl) doc.fillColor('#0891B2').fontSize(8).font('Helvetica').text(item.linkLabel ? `${item.linkLabel}: ${item.linkUrl}` : item.linkUrl);
  }
  doc.moveDown(0.4);
}

function addPdfCustomSections(doc, sections, accent) {
  if (!sections || sections.length === 0) return;
  for (const section of sections) {
    if (!section.title) continue;
    addPdfSection(doc, section.title.toUpperCase(), accent);
    const items = normalizeCustomSectionItems(section);
    for (const item of items) {
      if (item.heading) doc.fillColor('#000000').fontSize(10).font('Helvetica-Bold').text(item.heading);
      if (item.subheading) doc.fillColor('#808080').fontSize(8).font('Helvetica-Oblique').text(item.subheading);
      if (item.description) doc.fillColor('#4B4B4B').fontSize(9).font('Helvetica').text(item.description, { lineGap: 2 });
      if (item.linkUrl) {
        const label = item.linkLabel || 'View link';
        doc.fillColor(accent).fontSize(8).font('Helvetica').text(`${label}: ${item.linkUrl}`);
      }
    }
    doc.moveDown(0.4);
  }
}

function normalizeCustomSectionItems(section) {
  if (section.items && section.items.length > 0) return section.items;
  if (section.content) return [{ heading: '', description: section.content }];
  return [];
}

function buildContactLine(data) {
  const parts = [];
  if (data.email)     parts.push(data.email);
  if (data.phone)     parts.push(data.phone);
  if (data.location)  parts.push(data.location);
  if (data.linkedin)  parts.push(data.linkedin);
  if (data.github)    parts.push(data.github);
  if (data.portfolio) parts.push(data.portfolio);
  return parts.join('  |  ');
}

function safe(value, fallback) {
  return (value && String(value).trim()) ? String(value).trim() : fallback;
}

// ─── DOCX Export ──────────────────────────────────────────────────────────────
async function exportToDocx(builtResume) {
  const data = parseResumeData(builtResume.resumeData);
  const templateId = (builtResume.templateId || 'modern').toLowerCase();

  const doc = new Document({
    creator: 'Vita AI Resume Builder',
    description: 'Resume generated by Vita AI',
    styles: {
      default: {
        document: {
          run: { font: getDocxFont(templateId), size: 20 },
        },
      },
    },
    sections: [{ children: buildDocxContent(data, templateId) }],
  });

  return Packer.toBuffer(doc);
}

/**
 * Build DOCX content with distinct styling per template group:
 *  - modern / compact / timeline / neon-tech : left-aligned, teal/tech accent
 *  - classic / elegant                       : centered header, serif feel, dark
 *  - professional / executive                : formal, strong rules, navy/black
 *  - creative / sidebar-dark                 : creative purple, bold sections
 */
function buildDocxContent(data, templateId) {
  const accent = getDocxAccent(templateId);
  const isClassic    = ['classic', 'elegant'].includes(templateId);
  const isExecutive  = ['executive', 'professional'].includes(templateId);
  const isCreative   = ['creative', 'sidebar-dark', 'neon-tech', 'timeline'].includes(templateId);
  const isCentered   = isClassic || isExecutive;

  const children = [];

  // ── Name ──────────────────────────────────────────────────────────────────
  children.push(new Paragraph({
    children: [new TextRun({
      text: safe(data.fullName, 'Your Name'),
      bold: true,
      size: isCentered ? 52 : 48,
      color: accent,
      font: getDocxFont(templateId),
    })],
    alignment: isCentered ? AlignmentType.CENTER : AlignmentType.LEFT,
    spacing: { after: 60 },
    border: isExecutive ? {
      bottom: { color: accent, size: 12, value: BorderStyle.SINGLE, space: 2 },
    } : undefined,
  }));

  // ── Contact line ──────────────────────────────────────────────────────────
  const contactParts = [];
  if (data.email)     contactParts.push(data.email);
  if (data.phone)     contactParts.push(data.phone);
  if (data.location)  contactParts.push(data.location);
  if (data.linkedin)  contactParts.push(data.linkedin);
  if (data.github)    contactParts.push(data.github);
  if (data.portfolio) contactParts.push(data.portfolio);
  const contactLine = contactParts.join('  |  ');

  if (contactLine) {
    children.push(new Paragraph({
      children: [new TextRun({
        text: contactLine,
        size: 16,
        color: isCreative ? 'A78BFA' : '475569',
        italics: isClassic,
        font: getDocxFont(templateId),
      })],
      alignment: isCentered ? AlignmentType.CENTER : AlignmentType.LEFT,
      spacing: { after: 100 },
    }));
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  if (data.summary) {
    const summaryTitle = isExecutive ? 'EXECUTIVE SUMMARY' : isCreative ? 'ABOUT ME' : 'PROFESSIONAL SUMMARY';
    children.push(...docxSectionHeading(summaryTitle, accent, templateId));
    children.push(new Paragraph({
      children: [new TextRun({
        text: data.summary,
        size: 18,
        italics: isClassic,
        font: getDocxFont(templateId),
      })],
      spacing: { after: 80 },
      alignment: isExecutive ? AlignmentType.JUSTIFIED : AlignmentType.LEFT,
    }));
  }

  // ── Skills ────────────────────────────────────────────────────────────────
  if (data.skills && data.skills.length > 0) {
    children.push(...docxSectionHeading('SKILLS', accent, templateId));
    children.push(new Paragraph({
      children: [new TextRun({
        text: data.skills.join('  ·  '),
        size: 18,
        font: getDocxFont(templateId),
        color: isCreative ? 'A78BFA' : '334155',
      })],
      spacing: { after: 80 },
    }));
  }

  // ── Experience ────────────────────────────────────────────────────────────
  const experienceLabel = isExecutive ? 'PROFESSIONAL EXPERIENCE' : 'EXPERIENCE';
  children.push(...docxSectionHeading(experienceLabel, accent, templateId));
  for (const item of (data.experience || [])) {
    const title = [safe(item.role, ''), item.company ? ` — ${item.company}` : ''].join('');
    children.push(new Paragraph({
      children: [new TextRun({ text: title, bold: true, size: 20, font: getDocxFont(templateId), color: accent })],
      spacing: { before: 80, after: 20 },
    }));
    if (item.duration) {
      children.push(new Paragraph({
        children: [new TextRun({ text: item.duration, italics: true, size: 16, color: '808080', font: getDocxFont(templateId) })],
        spacing: { after: 20 },
      }));
    }
    if (item.description) {
      children.push(new Paragraph({
        children: [new TextRun({ text: item.description, size: 18, font: getDocxFont(templateId) })],
        spacing: { after: 60 },
      }));
    }
  }

  // ── Education ─────────────────────────────────────────────────────────────
  children.push(...docxSectionHeading('EDUCATION', accent, templateId));
  for (const item of (data.education || [])) {
    const title = [safe(item.degree, ''), item.college ? ` — ${item.college}` : ''].join('');
    children.push(new Paragraph({
      children: [new TextRun({ text: title, bold: true, size: 20, font: getDocxFont(templateId), color: accent })],
      spacing: { before: 80, after: 20 },
    }));
    const meta = [item.year, item.score ? `Score: ${item.score}` : ''].filter(Boolean).join('  |  ');
    if (meta) {
      children.push(new Paragraph({
        children: [new TextRun({ text: meta, italics: true, size: 16, color: '808080', font: getDocxFont(templateId) })],
        spacing: { after: 20 },
      }));
    }
    if (item.description) {
      children.push(new Paragraph({
        children: [new TextRun({ text: item.description, size: 18, font: getDocxFont(templateId) })],
        spacing: { after: 60 },
      }));
    }
  }

  // ── Projects ──────────────────────────────────────────────────────────────
  children.push(...docxSectionHeading('PROJECTS', accent, templateId));
  for (const item of (data.projects || [])) {
    children.push(new Paragraph({
      children: [new TextRun({ text: safe(item.title, 'Project'), bold: true, size: 20, font: getDocxFont(templateId), color: accent })],
      spacing: { before: 80, after: 20 },
    }));
    if (item.techStack) {
      children.push(new Paragraph({
        children: [new TextRun({ text: 'Tech: ' + item.techStack, italics: true, size: 16, color: '808080', font: getDocxFont(templateId) })],
        spacing: { after: 20 },
      }));
    }
    if (item.description) {
      children.push(new Paragraph({
        children: [new TextRun({ text: item.description, size: 18, font: getDocxFont(templateId) })],
        spacing: { after: 30 },
      }));
    }
    if (item.linkUrl) {
      const linkText = item.linkLabel ? `${item.linkLabel}: ${item.linkUrl}` : item.linkUrl;
      children.push(new Paragraph({
        children: [new TextRun({ text: linkText, size: 16, color: accent, font: getDocxFont(templateId) })],
        spacing: { after: 60 },
      }));
    }
  }

  // ── Custom Sections ───────────────────────────────────────────────────────
  for (const section of (data.customSections || [])) {
    if (!section.title) continue;
    children.push(...docxSectionHeading(section.title.toUpperCase(), accent, templateId));
    const items = normalizeCustomSectionItems(section);
    for (const item of items) {
      if (item.heading) {
        children.push(new Paragraph({
          children: [new TextRun({ text: item.heading, bold: true, size: 20, font: getDocxFont(templateId), color: accent })],
          spacing: { before: 60, after: 20 },
        }));
      }
      if (item.subheading) {
        children.push(new Paragraph({
          children: [new TextRun({ text: item.subheading, italics: true, size: 16, color: '808080', font: getDocxFont(templateId) })],
          spacing: { after: 20 },
        }));
      }
      if (item.description) {
        children.push(new Paragraph({
          children: [new TextRun({ text: item.description, size: 18, font: getDocxFont(templateId) })],
          spacing: { after: 30 },
        }));
      }
      if (item.linkUrl) {
        const linkText = item.linkLabel ? `${item.linkLabel}: ${item.linkUrl}` : item.linkUrl;
        children.push(new Paragraph({
          children: [new TextRun({ text: linkText, size: 16, color: accent, font: getDocxFont(templateId) })],
          spacing: { after: 60 },
        }));
      }
    }
  }

  return children;
}

/**
 * Per-template section heading with distinct styling:
 * - modern/compact  : teal underline border
 * - classic/elegant : centered, double-spaced
 * - professional    : navy, thick bottom border
 * - executive       : all-caps, heavy border
 * - creative        : purple accent with no border (bold + spacer)
 */
function docxSectionHeading(title, color, templateId) {
  const isClassic   = ['classic', 'elegant'].includes(templateId);
  const isExecutive = ['executive', 'professional'].includes(templateId);
  const isCreative  = ['creative', 'sidebar-dark', 'neon-tech', 'timeline'].includes(templateId);

  return [
    new Paragraph({
      children: [new TextRun({
        text: title,
        bold: true,
        size: isExecutive ? 24 : 22,
        color,
        font: getDocxFont(templateId),
        allCaps: isExecutive,
        smallCaps: isClassic,
      })],
      alignment: isClassic ? AlignmentType.CENTER : AlignmentType.LEFT,
      spacing: { before: isCreative ? 200 : 160, after: 60 },
      border: isCreative ? undefined : {
        bottom: {
          color,
          size: isExecutive ? 12 : 6,
          value: BorderStyle.SINGLE,
          space: 2,
        },
      },
    }),
  ];
}

function getDocxFont(templateId) {
  switch (templateId) {
    case 'classic': case 'elegant': return 'Georgia';
    case 'executive': case 'professional': return 'Garamond';
    case 'neon-tech': case 'timeline': return 'Courier New';
    default: return 'Calibri';
  }
}

function getDocxAccent(templateId) {
  switch (templateId) {
    case 'creative': case 'timeline': case 'sidebar-dark': case 'neon-tech': return '7C3AED';
    case 'minimal': case 'compact': return '374151';
    case 'classic': case 'elegant': return '111827';
    case 'executive': case 'professional': return '0F172A';
    default: return '0891B2'; // modern teal
  }
}

module.exports = { exportToPdf, exportToDocx };
