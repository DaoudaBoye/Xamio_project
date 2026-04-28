require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  LevelFormat, PageNumber, Footer, Header,
} = require('docx');

const app = express();
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

/* ══════════════════════════════════════════
   HELPER — Générer le fichier Word (.docx)
══════════════════════════════════════════ */
async function generateDocx(result, meeting) {
  const today    = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const meetDate = meeting?.date ? new Date(meeting.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : today;

  const border    = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
  const borders   = { top: border, bottom: border, left: border, right: border };
  const noBorders = { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } };

  const children = [];

  /* ── En-tête du document ── */
  children.push(
    new Paragraph({
      children: [new TextRun({ text: 'COMPTE RENDU DE RÉUNION', bold: true, size: 36, color: '7B5EA7', font: 'Arial' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [new TextRun({ text: meeting?.title || 'Réunion', bold: true, size: 28, font: 'Arial' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }),
    new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '7B5EA7', space: 1 } },
      spacing: { after: 300 },
    }),
  );

  /* ── Tableau infos réunion ── */
  const infoRows = [
    ['Date',        meetDate],
    ['Heure',       meeting?.time || '—'],
    ['Lieu',        meeting?.location || '—'],
    ['Organisateur',meeting?.organizer || '—'],
    ['Généré le',   today],
  ];

  children.push(
    new Table({
      width: { size: 9026, type: WidthType.DXA },
      columnWidths: [2400, 6626],
      rows: infoRows.map(([label, value]) =>
        new TableRow({
          children: [
            new TableCell({
              borders,
              width: { size: 2400, type: WidthType.DXA },
              shading: { fill: 'EDE9F5', type: ShadingType.CLEAR },
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 20, font: 'Arial', color: '7B5EA7' })] })],
            }),
            new TableCell({
              borders,
              width: { size: 6626, type: WidthType.DXA },
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [new Paragraph({ children: [new TextRun({ text: value, size: 20, font: 'Arial' })] })],
            }),
          ],
        })
      ),
    }),
    new Paragraph({ spacing: { after: 300 } }),
  );

  /* ── Résumé exécutif ── */
  if (result.summary) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: '1. Résumé exécutif', bold: true, size: 26, color: '7B5EA7', font: 'Arial' })],
        spacing: { before: 240, after: 120 },
      }),
      new Paragraph({
        children: [new TextRun({ text: result.summary, size: 22, font: 'Arial', color: '444444' })],
        spacing: { after: 300 },
        indent: { left: 360 },
      }),
    );
  }

  /* ── Décisions ── */
  if (result.decisions?.length > 0) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: `2. Décisions prises (${result.decisions.length})`, bold: true, size: 26, color: '7B5EA7', font: 'Arial' })],
        spacing: { before: 240, after: 200 },
      }),
    );

    result.decisions.forEach((decision, i) => {
      const text = typeof decision === 'string' ? decision : decision?.text || '';
      children.push(
        new Table({
          width: { size: 9026, type: WidthType.DXA },
          columnWidths: [400, 8626],
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  borders: noBorders,
                  width: { size: 400, type: WidthType.DXA },
                  shading: { fill: 'E8A838', type: ShadingType.CLEAR },
                  margins: { top: 80, bottom: 80, left: 120, right: 120 },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${i + 1}`, bold: true, color: 'FFFFFF', size: 20, font: 'Arial' })] })],
                }),
                new TableCell({
                  borders: noBorders,
                  width: { size: 8626, type: WidthType.DXA },
                  shading: { fill: 'FDF6EC', type: ShadingType.CLEAR },
                  margins: { top: 80, bottom: 80, left: 200, right: 120 },
                  children: [new Paragraph({ children: [new TextRun({ text, size: 22, font: 'Arial' })] })],
                }),
              ],
            }),
          ],
        }),
        new Paragraph({ spacing: { after: 80 } }),
      );
    });
    children.push(new Paragraph({ spacing: { after: 200 } }));
  }

  /* ── Actions ── */
  if (result.actions?.length > 0) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: `3. Actions & responsables (${result.actions.length})`, bold: true, size: 26, color: '7B5EA7', font: 'Arial' })],
        spacing: { before: 240, after: 200 },
      }),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [4500, 2300, 2226],
        rows: [
          /* En-tête tableau */
          new TableRow({
            tableHeader: true,
            children: [
              new TableCell({
                borders,
                width: { size: 4500, type: WidthType.DXA },
                shading: { fill: '7B5EA7', type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({ text: 'Action', bold: true, color: 'FFFFFF', size: 20, font: 'Arial' })] })],
              }),
              new TableCell({
                borders,
                width: { size: 2300, type: WidthType.DXA },
                shading: { fill: '7B5EA7', type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({ text: 'Responsable', bold: true, color: 'FFFFFF', size: 20, font: 'Arial' })] })],
              }),
              new TableCell({
                borders,
                width: { size: 2226, type: WidthType.DXA },
                shading: { fill: '7B5EA7', type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({ text: 'Échéance', bold: true, color: 'FFFFFF', size: 20, font: 'Arial' })] })],
              }),
            ],
          }),
          /* Lignes actions */
          ...result.actions.map((a, i) => {
            const text      = typeof a === 'string' ? a : a?.text || '';
            const assignee  = typeof a === 'object' ? (a.assignee || '—') : '—';
            const due       = typeof a === 'object' && a.due ? new Date(a.due).toLocaleDateString('fr-FR') : '—';
            const fill      = i % 2 === 0 ? 'FFFFFF' : 'F5F3FA';
            return new TableRow({
              children: [
                new TableCell({ borders, width: { size: 4500, type: WidthType.DXA }, shading: { fill, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text, size: 20, font: 'Arial' })] })] }),
                new TableCell({ borders, width: { size: 2300, type: WidthType.DXA }, shading: { fill, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: assignee, size: 20, font: 'Arial', bold: !!assignee && assignee !== '—' })] })] }),
                new TableCell({ borders, width: { size: 2226, type: WidthType.DXA }, shading: { fill, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: due, size: 20, font: 'Arial', color: due !== '—' ? 'E07B2A' : '999999' })] })] }),
              ],
            });
          }),
        ],
      }),
      new Paragraph({ spacing: { after: 300 } }),
    );
  }

  /* ── Points en suspens ── */
  if (result.pending?.length > 0) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: `4. Points en suspens (${result.pending.length})`, bold: true, size: 26, color: '7B5EA7', font: 'Arial' })],
        spacing: { before: 240, after: 200 },
      }),
    );
    result.pending.forEach(p => {
      const text = typeof p === 'string' ? p : p?.text || '';
      children.push(
        new Paragraph({
          numbering: { reference: 'bullets', level: 0 },
          children: [new TextRun({ text, size: 22, font: 'Arial', color: '444444' })],
          spacing: { after: 80 },
        }),
      );
    });
    children.push(new Paragraph({ spacing: { after: 300 } }));
  }

  /* ── Pied de page ── */
  children.push(
    new Paragraph({
      border: { top: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC', space: 1 } },
      spacing: { before: 400 },
      children: [
        new TextRun({ text: 'Document généré par ', size: 18, color: '999999', font: 'Arial' }),
        new TextRun({ text: 'Xamio IA', size: 18, bold: true, color: '7B5EA7', font: 'Arial' }),
        new TextRun({ text: ` · ${today}`, size: 18, color: '999999', font: 'Arial' }),
      ],
      alignment: AlignmentType.CENTER,
    }),
  );

  /* ── Création du document ── */
  const doc = new Document({
    numbering: {
      config: [{
        reference: 'bullets',
        levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }],
      }],
    },
    styles: {
      default: { document: { run: { font: 'Arial', size: 22 } } },
    },
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      children,
    }],
  });

  return Packer.toBuffer(doc);
}

/* ══════════════════════════════════════════
   ROUTE — Générer le CR (mock ou IA)
══════════════════════════════════════════ */
app.post('/api/claude', async (req, res) => {
  console.log('✓ Requête reçue');

  const prompt   = req.body.messages?.[0]?.content || '';
  const isUpload = prompt.includes('analyser ce document') || prompt.includes('Document source');

  // ── MOCK ──────────────────────────────────
  if (!isUpload) {
    return res.json({
      content: [{ type: 'text', text: JSON.stringify({
        summary:   'La réunion a permis de valider les grandes orientations du projet Xamio pour le trimestre à venir. Les équipes ont convergé sur les priorités budgétaires, la roadmap produit et les prochaines étapes de recrutement. L\'ambiance était constructive et les décisions ont été prises à l\'unanimité.',
        decisions: [
          'Validation du budget Q3 à 150 000€ avec une réserve de 10% pour les imprévus',
          'Report des recrutements juniors au mois d\'août pour prioriser les seniors',
          'Adoption de la nouvelle charte graphique Xamio v2 dès juillet',
          'Migration vers l\'infrastructure cloud planifiée pour septembre',
        ],
        actions: [
          { text: 'Préparer le rapport financier Q3',              assignee: 'Marie Dupont', due: '2025-07-15' },
          { text: 'Envoyer les convocations pour la prochaine réunion', assignee: 'Jean Martin',  due: '2025-07-10' },
          { text: 'Mettre à jour le site avec la nouvelle charte',  assignee: 'Léa Bernard',  due: '2025-07-20' },
          { text: 'Finaliser le cahier des charges cloud',          assignee: 'Ahmed Sall',   due: '2025-07-25' },
        ],
        pending: [
          'Validation du prestataire externe pour la migration cloud',
          'Confirmation des locaux pour les événements Q4',
          'Décision sur le budget formation à arbitrer en CODIR',
        ],
      })}],
    });
  }

  return res.json({
    content: [{ type: 'text', text: JSON.stringify({
      summary:   'Document analysé. Le procès-verbal fait état d\'une réunion de direction tenue récemment. Les résultats sont globalement en ligne avec les objectifs fixés.',
      decisions: ['Révision de la politique tarifaire à +5% en septembre', 'Lancement appel d\'offres CRM avant fin juillet'],
      actions:   [{ text: 'Rédiger le cahier des charges CRM', assignee: 'Sophie Diallo', due: '2025-07-30' }],
      pending:   ['Arbitrage sur le choix entre deux prestataires CRM'],
    })}],
  });
});

/* ══════════════════════════════════════════
   ROUTE — Télécharger le CR en Word
══════════════════════════════════════════ */
app.post('/api/export-docx', async (req, res) => {
  try {
    const { result, meeting } = req.body;
    console.log('✓ Export Word demandé pour :', meeting?.title);

    const buffer   = await generateDocx(result, meeting);
    const filename = `CR_${(meeting?.title || 'reunion').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.docx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
    console.log('✓ Fichier Word envoyé :', filename);
  } catch (err) {
    console.error('Erreur export Word :', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(3001, () => console.log('Proxy running on :3001 (mock + export Word)'));