/**
 * generateCRWord.js — Xamio v3
 * Compatible avec tous les formats de données :
 *   decisions: string[] | { text }[] | { dec_intitule }[]
 *   actions / tasks: string[] | { title, assignee, due }[]
 * Dépendance : npm install docx
 */

import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  LevelFormat, PageBreak, Header, Footer, PageNumber,
} from 'docx';

/* ── Helpers ─────────────────────────────────────────────── */
const fmtDateLong = (s) => {
  if (!s) return '—';
  try {
    return new Date(s).toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  } catch { return s; }
};

/* ── Résolution robuste des valeurs ──────────────────────── */
const resolveDecisionText = (d) => {
  if (!d) return '';
  if (typeof d === 'string') return d;
  return d.text ?? d.dec_intitule ?? d.title ?? '';
};

const resolveTaskTitle = (t) => {
  if (!t) return '';
  if (typeof t === 'string') return t;
  return t.title ?? t.text ?? t.dec_intitule ?? '';
};

/* ── Normalisation défensive des tableaux ────────────────── */
const safeArray = (v) => (Array.isArray(v) ? v : []);

/* ── Couleurs ────────────────────────────────────────────── */
const BLUE       = '0D2B55';
const ORANGE     = 'E07B2A';
const LIGHT_BLUE = 'EAF4FB';
const LIGHT_GREY = 'F8F9FA';
const WARN_BG    = 'FFF8EC';
const WARN_BD    = 'F0D080';

/* ── Helpers styles ─────────────────────────────────────── */
const border    = (color = 'CCCCCC') => ({ style: BorderStyle.SINGLE, size: 1, color });
const cellBords = (color) => ({ top: border(color), bottom: border(color), left: border(color), right: border(color) });
const noBord    = () => ({ style: BorderStyle.NONE, size: 0, color: 'FFFFFF' });
const noBords   = () => ({ top: noBord(), bottom: noBord(), left: noBord(), right: noBord() });

/* ── Titre de section ────────────────────────────────────── */
function sectionTitle(text, index) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: ORANGE, space: 1 } },
    spacing: { before: 320, after: 140 },
    children: [
      new TextRun({ text: `${index}. ${text}`, bold: true, size: 32, color: BLUE, font: 'Calibri' }),
    ],
  });
}

/* ── Paragraphe de corps ─────────────────────────────────── */
function body(text, opts = {}) {
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    children: [
      new TextRun({ text, size: 24, color: opts.color || '333333', bold: opts.bold || false, font: 'Calibri' }),
    ],
  });
}

/* ── Bloc encadré (résumé) ───────────────────────────────── */
function styledBlock(paragraphs, bgColor, borderColor) {
  return new Table({
    width: { size: 9026, type: WidthType.DXA },
    columnWidths: [9026],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: cellBords(borderColor),
            shading: { fill: bgColor, type: ShadingType.CLEAR },
            margins: { top: 120, bottom: 120, left: 200, right: 200 },
            children: paragraphs,
          }),
        ],
      }),
    ],
  });
}

/* ── Tableau infos réunion ───────────────────────────────── */
function infoTable(meeting) {
  const rows = [
    ['Date',         fmtDateLong(meeting?.date)],
    ['Heure',        `${meeting?.time || '—'}${meeting?.duration ? ` (${meeting.duration} min)` : ''}`],
    ['Lieu',         meeting?.location || '—'],
    ['Organisateur', meeting?.organizer || '—'],
  ];
  return new Table({
    width: { size: 9026, type: WidthType.DXA },
    columnWidths: [2200, 6826],
    rows: rows.map(([label, value]) =>
      new TableRow({
        children: [
          new TableCell({
            borders: cellBords('C8D8E8'),
            shading: { fill: LIGHT_BLUE, type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            width: { size: 2200, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 22, color: BLUE, font: 'Calibri' })] })],
          }),
          new TableCell({
            borders: cellBords('C8D8E8'),
            shading: { fill: 'FAFCFF', type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            width: { size: 6826, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: value, size: 22, color: '222222', font: 'Calibri' })] })],
          }),
        ],
      })
    ),
  });
}

/* ── Bloc décision numérotée ─────────────────────────────── */
function decisionBlock(d, num) {
  const text = resolveDecisionText(d);
  return new Table({
    width: { size: 9026, type: WidthType.DXA },
    columnWidths: [480, 8546],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: cellBords(WARN_BD),
            shading: { fill: ORANGE, type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 100, right: 100 },
            width: { size: 480, type: WidthType.DXA },
            children: [new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: String(num), bold: true, size: 22, color: 'FFFFFF', font: 'Calibri' })],
            })],
          }),
          new TableCell({
            borders: cellBords(WARN_BD),
            shading: { fill: WARN_BG, type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 160, right: 120 },
            width: { size: 8546, type: WidthType.DXA },
            children: [new Paragraph({
              children: [new TextRun({ text, size: 24, color: '333333', font: 'Calibri' })],
            })],
          }),
        ],
      }),
    ],
  });
}

/* ── Bloc action ─────────────────────────────────────────── */
function actionBlock(a) {
  const title    = resolveTaskTitle(a);
  const assignee = (typeof a === 'object' && a?.assignee) || '';
  const due      = (typeof a === 'object' && a?.due)      || '';

  const innerRows = [
    new TableRow({
      children: [
        new TableCell({
          borders: cellBords('B2E0EA'),
          shading: { fill: 'EAF7FA', type: ShadingType.CLEAR },
          columnSpan: 2,
          margins: { top: 80, bottom: 60, left: 160, right: 120 },
          children: [new Paragraph({
            children: [
              new TextRun({ text: '  ', bold: true, color: '0E7490', size: 24, font: 'Calibri' }),
              new TextRun({ text: title, size: 24, color: '0A4E60', font: 'Calibri' }),
            ],
          })],
        }),
      ],
    }),
  ];

  if (assignee || due) {
    innerRows.push(new TableRow({
      children: [
        new TableCell({
          borders: cellBords('B2E0EA'),
          shading: { fill: 'F5FCFD', type: ShadingType.CLEAR },
          margins: { top: 60, bottom: 80, left: 160, right: 60 },
          width: { size: 4513, type: WidthType.DXA },
          children: [
            new Paragraph({ children: [new TextRun({ text: 'RESPONSABLE', size: 16, color: '999999', bold: true, font: 'Calibri' })] }),
            new Paragraph({ children: [new TextRun({ text: assignee || '—', size: 22, color: '444444', font: 'Calibri' })] }),
          ],
        }),
        new TableCell({
          borders: cellBords('B2E0EA'),
          shading: { fill: 'F5FCFD', type: ShadingType.CLEAR },
          margins: { top: 60, bottom: 80, left: 120, right: 120 },
          width: { size: 4513, type: WidthType.DXA },
          children: [
            new Paragraph({ children: [new TextRun({ text: 'ECHEANCE', size: 16, color: '999999', bold: true, font: 'Calibri' })] }),
            new Paragraph({ children: [new TextRun({ text: due || '—', size: 22, color: '444444', font: 'Calibri' })] }),
          ],
        }),
      ],
    }));
  }

  return new Table({
    width: { size: 9026, type: WidthType.DXA },
    columnWidths: [4513, 4513],
    rows: innerRows,
  });
}

/* ── Tableau signatures ──────────────────────────────────── */
function signaturesTable(meeting) {
  const roles = ['Organisateur', 'Secretaire de seance'];
  return new Table({
    width: { size: 9026, type: WidthType.DXA },
    columnWidths: [4513, 4513],
    rows: [
      new TableRow({
        children: roles.map((role) =>
          new TableCell({
            borders: cellBords('C0C8D0'),
            shading: { fill: 'F8FAFC', type: ShadingType.CLEAR },
            margins: { top: 120, bottom: 320, left: 160, right: 160 },
            width: { size: 4513, type: WidthType.DXA },
            children: [
              new Paragraph({ children: [new TextRun({ text: role, bold: true, size: 22, color: BLUE, font: 'Calibri' })] }),
              new Paragraph({ spacing: { before: 60 }, children: [new TextRun({ text: role === 'Organisateur' ? (meeting?.organizer || '') : '', size: 22, color: '333333', font: 'Calibri' })] }),
              new Paragraph({ spacing: { before: 240 }, border: { top: { style: BorderStyle.SINGLE, size: 2, color: 'BBBBBB' } }, children: [new TextRun({ text: 'Signature :', size: 18, color: 'AAAAAA', font: 'Calibri' })] }),
              new Paragraph({ spacing: { before: 80 }, children: [new TextRun({ text: 'Date : ___________', size: 18, color: 'AAAAAA', font: 'Calibri' })] }),
            ],
          })
        ),
      }),
    ],
  });
}

const spacer = (before = 120) => new Paragraph({ spacing: { before, after: 0 }, children: [] });

/* ═══════════════════════════════════════════════════════════
   EXPORT PRINCIPAL
═══════════════════════════════════════════════════════════ */
export async function generateCRWord(result, meeting) {
  /* ✅ Normalisation défensive : accepte tous les formats, jamais d'erreur .map */
  const decisions = safeArray(result?.decisions);
  const actions   = safeArray(result?.actions ?? result?.tasks);
  const pending   = safeArray(result?.pendingPoints ?? result?.pending);

  const children = [

    /* EN-TETE */
    new Paragraph({
      spacing: { before: 0, after: 40 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BLUE, space: 1 } },
      children: [
        new TextRun({ text: meeting?.title || 'Compte Rendu de Reunion', bold: true, size: 44, color: BLUE, font: 'Calibri' }),
      ],
    }),
    new Paragraph({
      spacing: { before: 60, after: 8 },
      children: [
        new TextRun({ text: 'Compte Rendu Officiel - Genere par IA XAMIO', size: 20, color: '888888', font: 'Calibri' }),
      ],
    }),
    spacer(160),

    /* TABLEAU INFOS */
    infoTable(meeting),
    spacer(320),

    /* 1. RESUME */
    sectionTitle('Resume executif', 1),
    styledBlock(
      [new Paragraph({
        children: [new TextRun({
          text: result?.summary || 'Aucun resume disponible.',
          size: 24, color: '333333', font: 'Calibri',
          italics: !result?.summary,
        })],
        spacing: { before: 0, after: 0 },
      })],
      LIGHT_GREY, '1A5276'
    ),
    spacer(280),

    /* 2. DECISIONS */
    sectionTitle('Decisions prises', 2),
    ...(decisions.length
      ? decisions.flatMap((d, i) => [decisionBlock(d, i + 1), spacer(80)])
      : [body('Aucune decision enregistree.', { color: 'AAAAAA' })]
    ),
    spacer(200),

    /* 3. PLAN D'ACTIONS */
    sectionTitle("Plan d'actions", 3),
    ...(actions.length
      ? actions.flatMap(a => [actionBlock(a), spacer(100)])
      : [body('Aucune action enregistree.', { color: 'AAAAAA' })]
    ),
    spacer(200),

    /* 4. POINTS EN SUSPENS */
    sectionTitle('Points en suspens', 4),
    ...(pending.length
      ? pending.flatMap(p => [
          new Paragraph({
            spacing: { before: 60, after: 60 },
            children: [
              new TextRun({ text: '  ', color: ORANGE, bold: true, size: 24, font: 'Calibri' }),
              new TextRun({ text: typeof p === 'string' ? p : (p?.text ?? ''), size: 24, color: '7A5C00', font: 'Calibri' }),
            ],
          }),
        ])
      : [body('Aucun point en suspens.', { color: 'AAAAAA' })]
    ),
    spacer(200),

    /* 5. SIGNATURES */
    new Paragraph({ children: [new PageBreak()] }),
    sectionTitle('Validation et signatures', 5),
    spacer(80),
    signaturesTable(meeting),
    spacer(280),

    /* PIED DE PAGE DOCUMENT */
    new Paragraph({
      alignment: AlignmentType.CENTER,
      border: { top: { style: BorderStyle.SINGLE, size: 2, color: 'DDDDDD', space: 1 } },
      spacing: { before: 120 },
      children: [
        new TextRun({ text: 'Document genere par ', size: 18, color: 'BBBBBB', font: 'Calibri' }),
        new TextRun({ text: 'XAMIO', bold: true, size: 18, color: BLUE, font: 'Calibri' }),
        new TextRun({ text: ' - Intelligence Artificielle - TECHNOSUS', size: 18, color: 'BBBBBB', font: 'Calibri' }),
      ],
    }),
  ];

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: 'Calibri', size: 24, color: '1A1A1A' } },
      },
      paragraphStyles: [
        {
          id: 'Heading1', name: 'Heading 1',
          basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 32, bold: true, font: 'Calibri', color: BLUE },
          paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 0 },
        },
      ],
    },
    numbering: {
      config: [{
        reference: 'bullets',
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: '-',
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      }],
    },
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: 'E0E0E0', space: 1 } },
              spacing: { before: 0, after: 120 },
              children: [
                new TextRun({ text: 'XAMIO  ', bold: true, size: 18, color: BLUE, font: 'Calibri' }),
                new TextRun({ text: meeting?.title || 'Compte Rendu', size: 18, color: '888888', font: 'Calibri' }),
              ],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              border: { top: { style: BorderStyle.SINGLE, size: 2, color: 'E0E0E0', space: 1 } },
              spacing: { before: 80 },
              children: [
                new TextRun({ text: 'Page ', size: 18, color: 'AAAAAA', font: 'Calibri' }),
                new TextRun({ children: [PageNumber.CURRENT], size: 18, color: BLUE, font: 'Calibri' }),
                new TextRun({ text: ' sur ', size: 18, color: 'AAAAAA', font: 'Calibri' }),
                new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: BLUE, font: 'Calibri' }),
              ],
            }),
          ],
        }),
      },
      children,
    }],
  });

  /* ✅ On retourne le blob — c'est l'appelant qui décide quoi faire (télécharger, ouvrir, etc.) */
  const blob = await Packer.toBlob(doc);
  return blob;
}