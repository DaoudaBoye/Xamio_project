/**
 * XAMIO — CompteRenduIntelligent v3
 * - Tab 1 "Générer par IA" : saisie grands points → génération locale → éditeur Word intégré + export .docx
 * - Tab 2 "Uploader" : upload document existant + analyse IA (comportement v2 intact)
 */

import React, { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useMeetings } from '../../../context/MeetingsContext';
import { useNotif } from '../../../context/NotifContext';
import { CompteRenduProvider, useCompteRendu } from '../../../context/CompteRenduContext';
import FileUploader from '../../compterendu/components/FileUploader';
import DocumentViewer from '../../compterendu/components/DocumentViewer';
import { AISummaryCard, KeyPointsList, ExtractedActions } from '../../compterendu/components/AICards';
import AIChat from '../../compterendu/components/AIChat';

/* ─────────────────────────────────────────────────────────────────────
   Générateur de compte rendu local (sans API externe)
───────────────────────────────────────────────────────────────────── */

function generateCRHTML(meeting, points) {
  const dateStr = meeting && meeting.date
    ? new Date(meeting.date + 'T00:00:00').toLocaleDateString('fr-FR', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      })
    : 'Date non précisée';

  const participants = Array.isArray(meeting && meeting.participants)
    ? meeting.participants.join(', ')
    : (meeting && meeting.participants) || 'Non précisé';

  const titre     = (meeting && meeting.title)     || 'Réunion';
  const lieu      = (meeting && meeting.location)  || 'Non précisé';
  const animateur = (meeting && meeting.organizer) || 'Non précisé';
  const duree     = (meeting && meeting.duration)  ? meeting.duration + ' min' : 'Non précisée';
  const heure     = (meeting && meeting.time)      || '';

  const meta = [
    '<div class="cr-meta">',
    '  <strong>' + titre + '</strong><br/>',
    '  📅 ' + dateStr + (heure ? ' à ' + heure : '') + ' · ⏱ ' + duree + '<br/>',
    '  📍 ' + lieu + '<br/>',
    '  👤 Animateur : ' + animateur + '<br/>',
    '  👥 Participants : ' + participants,
    '</div>',
  ].join('\n');

  const nb = points.length;
  const resume = [
    '<h2>Résumé exécutif</h2>',
    '<p>La réunion <em>' + titre + '</em> s’est tenue le ' + dateStr
      + (lieu !== 'Non précisé' ? ' à ' + lieu : '')
      + ', réunissant ' + participants + '. '
      + 'Au total, <strong>' + nb + ' point' + (nb > 1 ? 's' : '') + ' majeur' + (nb > 1 ? 's' : '') + '</strong> ont été abordés, '
      + 'permettant d’aligner l’équipe sur les priorités et de formaliser les décisions à mettre en œuvre. '
      + 'Les échanges ont été constructifs et ont abouti à des engagements concrets de la part des participants.</p>',
  ].join('\n');

  const pointsItems = points.map(function(pt, i) {
    const clean = pt.trim();
    const label = clean.charAt(0).toUpperCase() + clean.slice(1);
    const hasNumbers = /\d+/.test(clean);
    const isDecision = /décid|valid|approuv|accord|adopt/i.test(clean);
    const isProbleme = /problème|difficulté|retard|bloquant/i.test(clean);
    const tag = isDecision
      ? '<br/><em style="color:var(--color-success);font-size:11px;">✓ Point décisionnel</em>'
      : isProbleme
        ? '<br/><em style="color:var(--color-warning);font-size:11px;">⚠ Point d’attention</em>'
        : '';
    const detail = hasNumbers
      ? 'Les données chiffrées mentionnées ont été notées et intégrées au suivi.'
      : 'Les éléments clés ont été documentés pour assurer la traçabilité des échanges.';
    return '<div style="margin-bottom:12px;padding:10px 13px;border-left:2px solid var(--color-border-medium);background:var(--color-background-tertiary);border-radius:0 6px 6px 0;">'
      + '<strong>' + (i + 1) + '. ' + label + '</strong>' + tag
      + '<p style="margin:6px 0 0;font-size:12px;color:var(--color-text-secondary);">'
      + 'Ce point a été présenté et discuté par les participants. ' + detail
      + ' Les parties prenantes ont exprimé leurs positions sur ce sujet.</p></div>';
  });
  const pointsSection = '<h2>Points abordés</h2>\n' + pointsItems.join('\n');

  const decisionsRaw = points
    .filter(function(pt) {
      return /décid|valid|approuv|accord|adopt|choisi|lancé|mis en place|créé|confirmé/i.test(pt);
    })
    .map(function(pt) {
      const c = pt.trim();
      return '<li>' + c.charAt(0).toUpperCase() + c.slice(1) + '</li>';
    });
  if (decisionsRaw.length === 0) {
    decisionsRaw.push('<li>Validation du contenu des points présentés lors de cette séance</li>');
    decisionsRaw.push('<li>Accord sur les priorités identifiées pour la prochaine période</li>');
  }
  decisionsRaw.push('<li>Mise à jour du planning de suivi partagé avec l’ensemble des participants</li>');
  const decisionsSection = '<h2>Décisions prises</h2>\n<ul>\n' + decisionsRaw.join('\n') + '\n</ul>';

  const noms = participants.split(',').map(function(n) { return n.trim(); });
  const actionsItems = points.slice(0, Math.min(points.length, 4)).map(function(pt, i) {
    const clean = pt.trim().replace(/[.!?]+$/, '');
    const label = clean.charAt(0).toUpperCase() + clean.slice(1);
    const resp = noms[i % noms.length] || animateur;
    return '<li><strong>' + label + ' — suivi</strong><br/>'
      + '<span style="font-size:11px;color:var(--color-text-muted);">→ Responsable : ' + resp + ' · À traiter avant la prochaine réunion</span></li>';
  });
  actionsItems.push('<li><strong>Diffusion du présent compte rendu aux participants</strong><br/>'
    + '<span style="font-size:11px;color:var(--color-text-muted);">→ Responsable : ' + animateur + ' · Délai : 48h</span></li>');
  const actionsSection = '<h2>Actions à mener</h2>\n<ul>\n' + actionsItems.join('\n') + '\n</ul>';

  const prochaineSection = '<h2>Prochaine étape</h2>'
    + '<p>Il est recommandé d’organiser une réunion de suivi dans <strong>2 à 3 semaines</strong> '
    + 'afin de faire le point sur l’avancement des actions décidées lors de cette séance. '
    + 'Chaque responsable est invité à préparer un bref état d’avancement. '
    + 'La diffusion du présent compte rendu doit être faite dans les <strong>48 heures</strong> '
    + 'auprès de l’ensemble des participants.</p>';

  return [meta, resume, pointsSection, decisionsSection, actionsSection, prochaineSection].join('\n\n');
}

function generateCRAsync(meeting, points) {
  return new Promise(function(resolve) {
    setTimeout(function() { resolve(generateCRHTML(meeting, points)); }, 1800);
  });
}

function downloadAsDoc(htmlContent, title) {
  const safeTitle = (title || 'Compte_Rendu').replace(/\s+/g, '_').replace(/[^\w-]/g, '');
  const dateLabel = new Date().toLocaleDateString('fr-FR', { dateStyle: 'long' });
  const full = '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>' + (title || 'Compte Rendu') + '</title>'
    + '<style>body{font-family:Calibri,Arial,sans-serif;max-width:750px;margin:40px auto;color:#1a1a1a;line-height:1.7;font-size:13px;}'
    + 'h2{color:#0F6E56;border-bottom:1.5px solid #9FE1CB;padding-bottom:5px;margin:22px 0 10px;font-size:15px;}'
    + '.cr-meta{background:#E1F5EE;border-left:3px solid #1D9E75;padding:10px 16px;border-radius:0 6px 6px 0;margin-bottom:20px;font-size:12px;color:#085041;}'
    + 'ul{padding-left:20px;margin:8px 0;}li{margin-bottom:5px;}strong{font-weight:600;}p{margin:6px 0;}em{font-style:italic;color:#555;}'
    + 'table{width:100%;border-collapse:collapse;margin:12px 0;}td,th{border:1px solid #ccc;padding:7px 10px;}th{background:#E1F5EE;color:#0F6E56;font-weight:600;}'
    + 'img{max-width:100%;height:auto;}hr{border:none;border-top:1.5px solid #ddd;margin:14px 0;}'
    + '</style></head><body>'
    + '<h1 style="font-size:18px;color:#0a3d2e;margin-bottom:4px">' + (title || 'Compte Rendu') + '</h1>'
    + '<p style="font-size:11px;color:#888;margin-bottom:24px">Généré par XAMIO IA — ' + dateLabel + '</p>'
    + htmlContent + '</body></html>';
  const blob = new Blob([full], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'CR_' + safeTitle + '.doc';
  a.click();
  URL.revokeObjectURL(url);
}

/* ─────────────────────────────────────────────────────────────────────
   WordToolbar — Barre d'outils éditeur Word complète
───────────────────────────────────────────────────────────────────── */

function WordToolbar({ execCmd, editorRef, meeting, exportWord }) {
  const [showColorPicker, setShowColorPicker] = React.useState(false);
  const [showHighlight,   setShowHighlight]   = React.useState(false);
  const [showFontSize,    setShowFontSize]     = React.useState(false);
  const [showInsert,      setShowInsert]       = React.useState(false);
  const [showAlign,       setShowAlign]        = React.useState(false);
  const [fontSize,        setFontSize]         = React.useState('13px');
  const fileInputRef = React.useRef(null);

  const closeAll = () => {
    setShowColorPicker(false); setShowHighlight(false);
    setShowFontSize(false);    setShowInsert(false);    setShowAlign(false);
  };

  const Sep = () => <div style={{ width: 1, height: 18, background: 'var(--color-border)', margin: '0 2px', flexShrink: 0 }} />;

  const Btn = ({ onDown, title, children }) => (
    <button title={title} onMouseDown={function(e) { e.preventDefault(); onDown && onDown(); }}
      style={{ padding: '3px 7px', background: 'none', border: '0.5px solid transparent', borderRadius: 4, cursor: 'pointer', color: 'var(--color-text-secondary)', fontSize: 11, lineHeight: 1.5, display: 'flex', alignItems: 'center', gap: 3, transition: 'all 80ms', whiteSpace: 'nowrap', flexShrink: 0 }}
      onMouseEnter={function(e) { e.currentTarget.style.background = 'var(--color-background-elevated)'; e.currentTarget.style.borderColor = 'var(--color-border)'; }}
      onMouseLeave={function(e) { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = 'transparent'; }}>
      {children}
    </button>
  );

  const Drop = ({ children }) => (
    <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 9999, background: 'var(--color-background-primary, #ffffff)', border: '1px solid var(--color-border-medium)', borderRadius: 8, padding: 8, marginTop: 4, boxShadow: '0 8px 24px rgba(0,0,0,0.18)', isolation: 'isolate' }}>
      {children}
    </div>
  );

  const MenuBtn = ({ children, onDown }) => (
    <button onMouseDown={function(e) { e.preventDefault(); onDown && onDown(); }}
      style={{ padding: '5px 12px', background: 'none', border: 'none', borderRadius: 5, cursor: 'pointer', textAlign: 'left', fontSize: 12, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-sans)', width: '100%', whiteSpace: 'nowrap' }}
      onMouseEnter={function(e) { e.currentTarget.style.background = 'var(--color-background-secondary)'; }}
      onMouseLeave={function(e) { e.currentTarget.style.background = 'none'; }}>
      {children}
    </button>
  );

  const textColors   = ['#0F6E56','#1D9E75','#185FA5','#378ADD','#E24B4A','#BA7517','#533AB7','#1a1a1a','#5F5E5A','#888780','#ffffff','#E1F5EE'];
  const hlColors     = ['#FAEEDA','#E1F5EE','#E6F1FB','#FBEAF0','#FAECE7','#EEEDFE','#FFF9C4','#B2EBF2','#F8BBD0','#DCEDC8'];
  const fontSizes    = ['10px','11px','12px','13px','14px','16px','18px','22px','28px'];
  const tableLayouts = [[2,2],[2,3],[3,3],[3,4],[4,4]];

  const insertImage = function(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(ev) {
      editorRef.current && editorRef.current.focus();
      const img = document.createElement('img');
      img.src = ev.target.result;
      img.style.cssText = 'max-width:100%;height:auto;border-radius:6px;margin:8px 0;display:block;cursor:pointer;';
      img.title = 'Cliquer pour changer la taille (100% / 50% / 30%)';
      img.onclick = function() {
        if (img.style.width === '50%') img.style.width = '100%';
        else if (img.style.width === '30%') img.style.width = '50%';
        else img.style.width = '30%';
      };
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0); range.collapse(false);
        range.insertNode(img); range.setStartAfter(img);
        sel.removeAllRanges(); sel.addRange(range);
      } else {
        editorRef.current && editorRef.current.appendChild(img);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
    closeAll();
  };

  const insertTable = function(rows, cols) {
    let html = '<table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:12px;">';
    for (let r = 0; r < rows; r++) {
      html += '<tr>';
      for (let c = 0; c < cols; c++) {
        const isH = r === 0;
        const tag = isH ? 'th' : 'td';
        const st  = isH
          ? 'border:1px solid var(--color-border-medium);padding:7px 10px;background:var(--color-accent-bg);color:var(--color-accent);font-weight:600;font-size:11px;'
          : 'border:1px solid var(--color-border-medium);padding:7px 10px;';
        html += '<' + tag + ' style="' + st + '"> </' + tag + '>';
      }
      html += '</tr>';
    }
    html += '</table>';
    document.execCommand('insertHTML', false, html);
    editorRef.current && editorRef.current.focus();
    closeAll();
  };

  const insertHr = function() {
    document.execCommand('insertHTML', false, '<hr style="border:none;border-top:1.5px solid var(--color-border-medium);margin:14px 0;"/>');
    editorRef.current && editorRef.current.focus(); closeAll();
  };
  const insertDate = function() {
    document.execCommand('insertText', false, new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    editorRef.current && editorRef.current.focus(); closeAll();
  };
  const insertLink = function() {
    const url = window.prompt('URL du lien :', 'https://');
    if (url) document.execCommand('createLink', false, url);
    editorRef.current && editorRef.current.focus(); closeAll();
  };

  const applyFontSize = function(size) {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
      document.execCommand('fontSize', false, '7');
      const fonts = editorRef.current && editorRef.current.querySelectorAll('font[size="7"]');
      if (fonts) fonts.forEach(function(el) { el.removeAttribute('size'); el.style.fontSize = size; });
    } else {
      document.execCommand('insertHTML', false, '<span style="font-size:' + size + '">&#8203;</span>');
    }
    setFontSize(size); setShowFontSize(false);
    editorRef.current && editorRef.current.focus();
  };

  const printDoc = function() {
    const content   = (editorRef.current && editorRef.current.innerHTML) || '';
    const title     = (meeting && meeting.title) || 'Compte rendu';
    const dateLabel = new Date().toLocaleDateString('fr-FR', { dateStyle: 'long' });
    const w = window.open('', '_blank');
    w.document.write('<!DOCTYPE html><html><head><title>' + title + '</title>'
      + '<style>body{font-family:Calibri,Arial,sans-serif;max-width:750px;margin:40px auto;color:#1a1a1a;line-height:1.7;font-size:13px;}'
      + 'h2{color:#0F6E56;border-bottom:1.5px solid #9FE1CB;padding-bottom:5px;margin:22px 0 10px;}'
      + '.cr-meta{background:#E1F5EE;border-left:3px solid #1D9E75;padding:10px 16px;margin-bottom:20px;border-radius:0 6px 6px 0;}'
      + 'ul{padding-left:20px;}li{margin-bottom:5px;}table{width:100%;border-collapse:collapse;}'
      + 'td,th{border:1px solid #ccc;padding:7px 10px;}th{background:#E1F5EE;color:#0F6E56;}'
      + 'img{max-width:100%;height:auto;}hr{border:none;border-top:1.5px solid #ddd;margin:14px 0;}'
      + '@media print{body{margin:20px;}}</style>'
      + '</head><body><h1 style="font-size:18px;color:#0a3d2e;margin-bottom:4px">' + title + '</h1>'
      + '<p style="font-size:11px;color:#888;margin-bottom:24px">Généré par XAMIO IA — ' + dateLabel + '</p>'
      + content + '</body></html>');
    w.document.close(); w.print();
  };

  return (
    <div style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-background-secondary)', position: 'relative', zIndex: 100 }}>
      <div style={{ padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', overflow: 'visible' }}>

        {/* Taille de police */}
        <div style={{ position: 'relative' }}>
          <Btn title="Taille de police" onDown={function() { const v = !showFontSize; closeAll(); setShowFontSize(v); }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>{fontSize}</span>
            <span style={{ fontSize: 8 }}>&#9662;</span>
          </Btn>
          {showFontSize && (
            <Drop>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 70 }}>
                {fontSizes.map(function(s) {
                  return <button key={s} onMouseDown={function(e) { e.preventDefault(); applyFontSize(s); }}
                    style={{ padding: '4px 10px', background: fontSize === s ? 'var(--color-background-info)' : 'none', border: 'none', borderRadius: 4, cursor: 'pointer', textAlign: 'left', fontSize: s, color: 'var(--color-text-primary)', fontFamily: 'var(--font-sans)' }}>{s}</button>;
                })}
              </div>
            </Drop>
          )}
        </div>

        <Sep />

        {/* Formatage de base */}
        <Btn title="Gras"     onDown={function() { execCmd('bold'); }}><strong style={{ fontSize: 13 }}>G</strong></Btn>
        <Btn title="Italique" onDown={function() { execCmd('italic'); }}><em style={{ fontSize: 13 }}>I</em></Btn>
        <Btn title="Souligné" onDown={function() { execCmd('underline'); }}><u style={{ fontSize: 13 }}>S</u></Btn>
        <Btn title="Barré"    onDown={function() { execCmd('strikeThrough'); }}><span style={{ fontSize: 13, textDecoration: 'line-through' }}>S</span></Btn>

        <Sep />

        {/* Couleur texte */}
        <div style={{ position: 'relative' }}>
          <Btn title="Couleur du texte" onDown={function() { const v = !showColorPicker; closeAll(); setShowColorPicker(v); }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>A</span>
            <div style={{ width: 14, height: 3, borderRadius: 1, background: 'var(--color-accent)' }} />
            <span style={{ fontSize: 8 }}>&#9662;</span>
          </Btn>
          {showColorPicker && (
            <Drop>
              <p style={{ fontSize: 9, color: 'var(--color-text-muted)', margin: '0 0 6px', fontWeight: 600, letterSpacing: '.05em' }}>COULEUR DU TEXTE</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 4 }}>
                {textColors.map(function(c) {
                  return <button key={c} title={c}
                    onMouseDown={function(e) { e.preventDefault(); document.execCommand('foreColor', false, c); editorRef.current && editorRef.current.focus(); setShowColorPicker(false); }}
                    style={{ width: 20, height: 20, borderRadius: 4, background: c, border: '1px solid var(--color-border)', cursor: 'pointer' }} />;
                })}
              </div>
            </Drop>
          )}
        </div>

        {/* Surlignage */}
        <div style={{ position: 'relative' }}>
          <Btn title="Surlignage" onDown={function() { const v = !showHighlight; closeAll(); setShowHighlight(v); }}>
            <span style={{ fontSize: 12, background: '#FAEEDA', padding: '0 2px', borderRadius: 2 }}>ab</span>
            <span style={{ fontSize: 8 }}>&#9662;</span>
          </Btn>
          {showHighlight && (
            <Drop>
              <p style={{ fontSize: 9, color: 'var(--color-text-muted)', margin: '0 0 6px', fontWeight: 600, letterSpacing: '.05em' }}>SURLIGNAGE</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 4 }}>
                {hlColors.map(function(c) {
                  return <button key={c} title={c}
                    onMouseDown={function(e) { e.preventDefault(); document.execCommand('hiliteColor', false, c); editorRef.current && editorRef.current.focus(); setShowHighlight(false); }}
                    style={{ width: 20, height: 20, borderRadius: 4, background: c, border: '1px solid var(--color-border)', cursor: 'pointer' }} />;
                })}
                <button onMouseDown={function(e) { e.preventDefault(); document.execCommand('hiliteColor', false, 'transparent'); editorRef.current && editorRef.current.focus(); setShowHighlight(false); }}
                  style={{ width: 20, height: 20, borderRadius: 4, background: 'transparent', border: '1px solid var(--color-border)', cursor: 'pointer', fontSize: 9, color: 'var(--color-text-muted)' }}>&#10005;</button>
              </div>
            </Drop>
          )}
        </div>

        <Sep />

        {/* Alignement */}
        <div style={{ position: 'relative' }}>
          <Btn title="Alignement" onDown={function() { const v = !showAlign; closeAll(); setShowAlign(v); }}>
            <span style={{ fontSize: 12 }}>&#8801;</span>
            <span style={{ fontSize: 8 }}>&#9662;</span>
          </Btn>
          {showAlign && (
            <Drop>
              {[
                { label: '← Gauche',    cmd: 'justifyLeft' },
                { label: '↔ Centré', cmd: 'justifyCenter' },
                { label: '→ Droite',    cmd: 'justifyRight' },
                { label: '↔ Justifié', cmd: 'justifyFull' },
              ].map(function(item) {
                return <MenuBtn key={item.cmd} onDown={function() { execCmd(item.cmd); setShowAlign(false); }}>{item.label}</MenuBtn>;
              })}
            </Drop>
          )}
        </div>

        {/* Listes */}
        <Btn title="Liste à puces"    onDown={function() { execCmd('insertUnorderedList'); }}>&#8801; &bull;</Btn>
        <Btn title="Liste numérotée" onDown={function() { execCmd('insertOrderedList'); }}>1.</Btn>

        {/* Indentation */}
        <Btn title="Augmenter le retrait" onDown={function() { execCmd('indent'); }}>&rarr;|</Btn>
        <Btn title="Réduire le retrait"  onDown={function() { execCmd('outdent'); }}>|&larr;</Btn>

        <Sep />

        {/* Insérer */}
        <div style={{ position: 'relative' }}>
          <Btn title="Insérer un élément" onDown={function() { const v = !showInsert; closeAll(); setShowInsert(v); }}>
            <span style={{ fontSize: 11 }}>+ Insérer</span>
            <span style={{ fontSize: 8 }}>&#9662;</span>
          </Btn>
          {showInsert && (
            <Drop>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 185 }}>
                <MenuBtn onDown={function() { fileInputRef.current && fileInputRef.current.click(); }}>
                  &#128444; Image depuis fichier
                </MenuBtn>
                <div style={{ padding: '4px 12px 2px', fontSize: 9, color: 'var(--color-text-muted)', fontWeight: 600, letterSpacing: '.06em' }}>TABLEAU</div>
                {tableLayouts.map(function(rc) {
                  return <MenuBtn key={rc[0]+','+rc[1]} onDown={function() { insertTable(rc[0], rc[1]); }}>
                    &#9638; Tableau {rc[0]}&times;{rc[1]}
                  </MenuBtn>;
                })}
                <div style={{ height: 1, background: 'var(--color-border)', margin: '4px 0' }} />
                <MenuBtn onDown={insertHr}>&#8212; Séparateur</MenuBtn>
                <MenuBtn onDown={insertDate}>&#128197; Date du jour</MenuBtn>
                <MenuBtn onDown={insertLink}>&#128279; Lien hypertexte</MenuBtn>
              </div>
            </Drop>
          )}
        </div>

        <Sep />

        {/* Annuler / Refaire */}
        <Btn title="Annuler" onDown={function() { execCmd('undo'); }}>&#8617;</Btn>
        <Btn title="Refaire" onDown={function() { execCmd('redo'); }}>&#8618;</Btn>

        <Sep />

        {/* Imprimer */}
        <Btn title="Imprimer le document" onDown={printDoc}>&#128424;</Btn>

        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={insertImage} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   TabGenerate — Onglet "Générer par IA"
───────────────────────────────────────────────────────────────────── */

function TabGenerate({ meeting }) {
  const { addToast }   = useNotif();
  const { addMinutes } = useMeetings();

  const [points,      setPoints]      = useState(meeting && meeting.agenda && meeting.agenda.length ? meeting.agenda.slice() : ['']);
  const [status,      setStatus]      = useState('idle');
  const [htmlContent, setHtmlContent] = useState('');
  const editorRef = useRef(null);

  const addPoint    = function() { setPoints(function(p) { return [...p, '']; }); };
  const removePoint = function(i) { setPoints(function(p) { return p.filter(function(_, idx) { return idx !== i; }); }); };
  const updatePoint = function(i, val) { setPoints(function(p) { return p.map(function(v, idx) { return idx === i ? val : v; }); }); };

  const generate = async function() {
    const filled = points.filter(function(p) { return p.trim(); });
    if (!filled.length) { addToast('Ajoutez au moins un point de réunion.', 'error'); return; }
    setStatus('generating'); setHtmlContent('');
    try {
      const html = await generateCRAsync(meeting, filled);
      setHtmlContent(html); setStatus('done');
      addToast('Compte rendu généré avec succès !', 'success');
    } catch (err) {
      setStatus('error');
      addToast('Erreur lors de la génération. Réessayez.', 'error');
    }
  };

  const saveToMeeting = function() {
    if (!meeting || !htmlContent) return;
    const tmp = document.createElement('div');
    tmp.innerHTML = (editorRef.current && editorRef.current.innerHTML) || htmlContent;
    addMinutes(meeting.id, {
      summary: (tmp.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 280),
      decisions: [], actions: [], note: '',
      htmlContent: (editorRef.current && editorRef.current.innerHTML) || htmlContent,
      addedAt: new Date().toISOString(), generatedByAI: true,
    });
    addToast('Compte rendu sauvegardé dans la réunion !', 'success');
  };

  const exportWord = function() {
    downloadAsDoc((editorRef.current && editorRef.current.innerHTML) || htmlContent, meeting && meeting.title);
    addToast('Téléchargement .doc lancé.', 'info');
  };

  const execCmd = function(cmd, val) {
    document.execCommand(cmd, false, val || null);
    editorRef.current && editorRef.current.focus();
  };

  const isGenerating = status === 'generating';
  const isDone       = status === 'done';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 20, paddingTop: 20 }} className="cr-gen-grid">

      {/* Colonne gauche : saisie */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        <p style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.1em', color: 'var(--color-text-muted)', margin: 0 }}>
          GRANDS POINTS DE LA RÉUNION
        </p>

        {meeting && (
          <div style={{ background: 'var(--color-background-tertiary)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '10px 14px' }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 4 }}>{meeting.title}</p>
            <div style={{ display: 'flex', gap: 12, fontSize: 10, color: 'var(--color-text-muted)', flexWrap: 'wrap' }}>
              {meeting.date      && <span>&#128197; {meeting.date.split('-').reverse().join('/')}</span>}
              {meeting.location  && <span>&#128205; {meeting.location}</span>}
              {meeting.organizer && <span>&#128100; {meeting.organizer}</span>}
              {meeting.duration  && <span>&#9201; {meeting.duration} min</span>}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {points.map(function(pt, i) {
            return (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--color-accent-bg)', border: '1px solid var(--color-accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'var(--color-accent)', flexShrink: 0, marginTop: 8 }}>
                  {i + 1}
                </div>
                <textarea value={pt} onChange={function(e) { updatePoint(i, e.target.value); }}
                  placeholder={'Point ' + (i + 1) + ' — Ex : Bilan Q1, décisions prises…'}
                  rows={2}
                  style={{ flex: 1, background: 'var(--color-background-elevated)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '7px 10px', color: 'var(--color-text-primary)', fontSize: 12, resize: 'vertical', fontFamily: 'var(--font-sans)', lineHeight: 1.55, outline: 'none', transition: 'border-color 120ms' }}
                  onFocus={function(e) { e.target.style.borderColor = 'var(--color-accent-border)'; }}
                  onBlur={function(e) { e.target.style.borderColor = 'var(--color-border)'; }} />
                {points.length > 1 && (
                  <button onClick={function() { removePoint(i); }} title="Supprimer ce point"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: 18, padding: '4px 2px', lineHeight: 1, marginTop: 4 }}
                    onMouseEnter={function(e) { e.currentTarget.style.color = 'var(--color-danger)'; }}
                    onMouseLeave={function(e) { e.currentTarget.style.color = 'var(--color-text-muted)'; }}>
                    &times;
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <button onClick={addPoint}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', border: '1px dashed var(--color-border-medium)', background: 'transparent', borderRadius: 9, fontSize: 12, color: 'var(--color-text-muted)', cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 120ms' }}
          onMouseEnter={function(e) { e.currentTarget.style.background = 'var(--color-background-tertiary)'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
          onMouseLeave={function(e) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}>
          <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Ajouter un point
        </button>

        <button onClick={generate} disabled={isGenerating}
          style={{ padding: '11px 18px', background: isGenerating ? 'var(--color-accent-bg)' : 'var(--color-accent)', border: '1px solid ' + (isGenerating ? 'var(--color-accent-border)' : 'transparent'), borderRadius: 10, fontSize: 13, fontWeight: 600, color: isGenerating ? 'var(--color-accent)' : '#fff', cursor: isGenerating ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, fontFamily: 'var(--font-sans)', transition: 'all 150ms' }}>
          {isGenerating ? (
            <>
              <div style={{ display: 'flex', gap: 3 }}>
                {[0,1,2].map(function(k) { return <div key={k} style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--color-accent)', animation: 'bounce 1.2s ' + (k*0.2) + 's ease-in-out infinite' }} />; })}
              </div>
              Génération en cours…
            </>
          ) : isDone ? (
            <><span>&#8635;</span> Regénérer le compte rendu</>
          ) : (
            <><span style={{ fontSize: 15 }}>&#10024;</span> Générer le compte rendu IA</>
          )}
        </button>

        {status === 'error' && (
          <div style={{ padding: '10px 14px', background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)', borderRadius: 9, fontSize: 12, color: 'var(--color-danger)' }}>
            La génération a échoué. Vérifiez votre connexion et réessayez.
          </div>
        )}
      </div>

      {/* Colonne droite : éditeur Word */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <p style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.1em', color: 'var(--color-text-muted)', margin: 0 }}>
            COMPTE RENDU{isDone ? ' — MODIFIABLE' : ''}
          </p>
          {isDone && (
            <div style={{ display: 'flex', gap: 7 }}>
              <button onClick={saveToMeeting}
                style={{ padding: '4px 11px', background: 'var(--color-success-bg)', border: '1px solid var(--color-success-border)', borderRadius: 7, fontSize: 10, fontWeight: 700, color: 'var(--color-success)', cursor: 'pointer', fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', gap: 5 }}>
                &#10003; Sauvegarder
              </button>
              <button onClick={exportWord}
                style={{ padding: '4px 11px', background: 'var(--color-background-elevated)', border: '1px solid var(--color-border-medium)', borderRadius: 7, fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', cursor: 'pointer', fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', gap: 5 }}>
                &#8659; .docx
              </button>
            </div>
          )}
        </div>

        {/* Cadre document */}
        <div style={{ flex: 1, border: '1px solid var(--color-border-medium)', borderRadius: 12, overflow: 'visible', display: 'flex', flexDirection: 'column', background: 'var(--color-background-primary)', minHeight: 420 }}>

          {/* Barre d'outils Word complète */}
          {isDone && <WordToolbar execCmd={execCmd} editorRef={editorRef} meeting={meeting} exportWord={exportWord} />}

          {/* Empty state */}
          {!isDone && !isGenerating && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24, color: 'var(--color-text-muted)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--color-background-secondary)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>&#128196;</div>
              <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', margin: 0 }}>Aucun compte rendu généré</p>
              <p style={{ fontSize: 11, textAlign: 'center', lineHeight: 1.6, margin: 0 }}>
                Renseignez les points de la réunion à gauche,<br />puis cliquez sur « Générer le compte rendu IA ».
              </p>
            </div>
          )}

          {/* Génération en cours */}
          {isGenerating && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {[0,1,2].map(function(k) { return <div key={k} style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-accent)', animation: 'bounce 1.2s ' + (k*0.2) + 's ease-in-out infinite' }} />; })}
              </div>
              <p style={{ fontSize: 13, color: 'var(--color-accent)', fontWeight: 600, margin: 0 }}>L’IA rédige votre compte rendu…</p>
              <p style={{ fontSize: 11, color: 'var(--color-text-muted)', margin: 0 }}>Cela prend quelques secondes.</p>
            </div>
          )}

          {/* Éditeur contentEditable */}
          {isDone && (
            <div ref={editorRef} contentEditable suppressContentEditableWarning
              dangerouslySetInnerHTML={{ __html: htmlContent }}
              style={{ flex: 1, padding: '18px 22px', overflowY: 'auto', outline: 'none', fontSize: 13, lineHeight: 1.75, color: 'var(--color-text-primary)', fontFamily: 'var(--font-sans)' }} />
          )}

          {/* Pied de document */}
          {isDone && (
            <div style={{ borderTop: '1px solid var(--color-border)', padding: '6px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                Généré par XAMIO IA · {new Date().toLocaleDateString('fr-FR')}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '2px 8px', borderRadius: 20, background: 'var(--color-success-bg)', border: '1px solid var(--color-success-border)' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-success)' }} />
                <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-success)' }}>IA · Modifiable</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes bounce { 0%,80%,100%{transform:scale(.55);opacity:.4} 40%{transform:scale(1);opacity:1} }
        @media (max-width: 820px) { .cr-gen-grid { grid-template-columns: 1fr !important; } }
        [contenteditable] h2 { font-size:14px;font-weight:600;color:var(--color-accent);border-bottom:1.5px solid var(--color-accent-border);padding-bottom:5px;margin:18px 0 8px;font-family:var(--font-sans); }
        [contenteditable] h2:first-child { margin-top:0; }
        [contenteditable] p { margin:4px 0 8px; }
        [contenteditable] ul { padding-left:20px;margin:6px 0; }
        [contenteditable] li { margin-bottom:4px; }
        [contenteditable] table { width:100%;border-collapse:collapse;margin:10px 0; }
        [contenteditable] td,[contenteditable] th { border:1px solid var(--color-border-medium);padding:6px 10px;font-size:12px; }
        [contenteditable] th { background:var(--color-accent-bg);color:var(--color-accent);font-weight:600;font-size:11px; }
        [contenteditable] img { max-width:100%;height:auto;border-radius:6px;margin:8px 0;display:block; }
        [contenteditable] hr { border:none;border-top:1.5px solid var(--color-border-medium);margin:14px 0; }
        [contenteditable] a { color:var(--color-accent); }
        [contenteditable] .cr-meta { background:var(--color-accent-bg);border-left:2.5px solid var(--color-accent);padding:10px 14px;border-radius:0 8px 8px 0;margin-bottom:16px;font-size:12px;color:var(--color-text-secondary);line-height:1.7; }
      `}</style>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   TabUpload — Onglet "Uploader un document" (v2 intact)
───────────────────────────────────────────────────────────────────── */

function EmptyStateUpload() {
  return (
    <div style={{ padding: '0 0 24px' }}>
      <FileUploader />
      <div className="resp-grid-3" style={{ gap: 10, marginTop: 4 }}>
        {[
          { icon: '&#128196;', title: 'Upload PDF / DOCX / TXT', desc: 'Drag & drop ou sélection fichier' },
          { icon: '&#10024;',  title: 'Résumé automatique',       desc: 'L’IA résume en quelques secondes' },
          { icon: '&#128172;', title: 'Chat interactif',          desc: 'Posez des questions sur le document' },
        ].map(function(f) {
          return (
            <div key={f.title} style={{ padding: '12px 14px', borderRadius: 11, background: 'var(--color-background-tertiary)', border: '1px solid var(--color-border)', textAlign: 'center' }}>
              <div style={{ fontSize: 20, marginBottom: 7 }} dangerouslySetInnerHTML={{ __html: f.icon }} />
              <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 4 }}>{f.title}</p>
              <p style={{ fontSize: 10, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{f.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TabUpload() {
  const { document: doc } = useCompteRendu();
  const hasDoc = !!doc;
  return (
    <div style={{ paddingTop: 20 }}>
      {!hasDoc && <EmptyStateUpload />}
      {hasDoc && (
        <div className="cr-grid" style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <p style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.1em', color: 'var(--color-text-muted)', marginBottom: 10 }}>DOCUMENT</p>
            <DocumentViewer />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.1em', color: 'var(--color-text-muted)', marginBottom: -2 }}>ANALYSE IA</p>
            <AISummaryCard />
            <KeyPointsList />
            <ExtractedActions />
            <AIChat />
          </div>
        </div>
      )}
      <style>{`@media (max-width: 860px) { .cr-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Layout principal avec onglets
───────────────────────────────────────────────────────────────────── */

function Layout() {
  const { id }      = useParams();
  const { meetings } = useMeetings();
  const { document: doc, isAnalyzed, isAnalyzing } = useCompteRendu();

  const meeting    = (meetings && meetings.find(function(m) { return m.id === Number(id); })) || null;
  const [activeTab, setActiveTab] = useState('generate');

  const tabs = [
    { id: 'generate', icon: '&#10024;', label: 'Générer par IA' },
    { id: 'upload',   icon: '&#128196;', label: 'Uploader un document' },
  ];

  let statusBadge = null;
  if (activeTab === 'upload') {
    if (isAnalyzing) {
      statusBadge = (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, background: 'var(--color-accent-bg)', border: '1px solid var(--color-accent-border)' }}>
          <div style={{ display: 'flex', gap: 3 }}>
            {[0,1,2].map(function(k) { return <div key={k} style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--color-accent)', animation: 'bounce 1.2s ' + (k*.2) + 's ease-in-out infinite' }} />; })}
          </div>
          <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-accent)' }}>Analyse en cours…</span>
        </div>
      );
    } else if (isAnalyzed) {
      statusBadge = (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, background: 'var(--color-success-bg)', border: '1px solid var(--color-success-border)' }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--color-success)' }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-success)' }}>Analysé · IA prête</span>
        </div>
      );
    }
  }

  return (
    <div style={{ marginTop: 28, border: '1px solid var(--color-border-medium)', borderRadius: 16, overflow: 'hidden', background: 'var(--color-background-secondary)' }}>

      {/* Header */}
      <div style={{ padding: '14px 22px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-background-tertiary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--color-accent-bg)', border: '1px solid var(--color-accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>&#129504;</div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 1 }}>Compte rendu intelligent</p>
            <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
              {activeTab === 'generate'
                ? 'Saisissez les grands points · Génération IA · Éditeur Word intégré'
                : doc ? (doc.name + ' · Analyse IA') : 'Uploadez un fichier · Résumé + Chat IA automatiques'}
            </p>
          </div>
        </div>
        {statusBadge}
      </div>

      {/* Onglets */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', background: 'var(--color-background-secondary)', padding: '0 22px' }}>
        {tabs.map(function(t) {
          const isActive = activeTab === t.id;
          return (
            <button key={t.id} onClick={function() { setActiveTab(t.id); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '11px 16px', fontSize: 12, fontWeight: isActive ? 700 : 500, color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)', borderBottom: isActive ? '2px solid var(--color-accent)' : '2px solid transparent', marginBottom: -1, fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 140ms', whiteSpace: 'nowrap' }}>
              <span style={{ fontSize: 13 }} dangerouslySetInnerHTML={{ __html: t.icon }} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Contenu */}
      <div style={{ padding: '0 22px 26px' }}>
        {activeTab === 'generate' && <TabGenerate meeting={meeting} />}
        {activeTab === 'upload'   && <TabUpload />}
      </div>

      <style>{`@keyframes bounce { 0%,80%,100%{transform:scale(.55);opacity:.4} 40%{transform:scale(1);opacity:1} }`}</style>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Export
───────────────────────────────────────────────────────────────────── */

export default function CompteRenduIntelligent() {
  return (
    <CompteRenduProvider>
      <Layout />
    </CompteRenduProvider>
  );
}