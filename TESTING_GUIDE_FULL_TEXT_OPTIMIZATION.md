# Testing Guide: Full-Text Analysis Optimization

## Was wurde geändert? (What was changed?)

Die Extension analysiert jetzt **doppelt so viel Text** (30.000 statt 15.000 Zeichen) aus wissenschaftlichen Papers, während die Analysezeit unter 20 Sekunden bleibt.

The extension now analyzes **2x more text** (30,000 instead of 15,000 characters) from scientific papers, while keeping analysis time under 20 seconds.

## Wie teste ich die Änderungen? (How to test the changes?)

### Schritt 1: Extension neu laden (Reload Extension)

1. Öffne Chrome und gehe zu `chrome://extensions/`
2. Finde die Q-SCI Extension
3. Klicke auf das Reload-Symbol (↻)

### Schritt 2: Test mit verschiedenen Paper-Typen (Test with different paper types)

#### Test A: Kurzes Paper / Short Paper (< 30K Zeichen / chars)
**Beispiel / Example:** PubMed Abstract-only page
- Erwartung / Expected: Gesamter Text wird analysiert / Full text analyzed
- Zeit / Time: ~5-8 Sekunden / seconds

**Test Papers:**
1. PubMed: https://pubmed.ncbi.nlm.nih.gov/38000000/ (nur Abstract)
2. arXiv Abstract: https://arxiv.org/abs/2401.00001

#### Test B: Mittellanges Paper / Medium Paper (15K-30K Zeichen / chars)
**Beispiel / Example:** arXiv paper, journal article abstract
- Erwartung / Expected: Gesamter Text wird analysiert / Full text analyzed
- Zeit / Time: ~8-12 Sekunden / seconds

**Test Papers:**
1. arXiv Full Paper: https://arxiv.org/abs/2312.00001
2. Nature Article (Abstract view)

#### Test C: Langes Full-Text Paper (> 30K Zeichen / chars)
**Beispiel / Example:** PMC full-text article, The Lancet
- Erwartung / Expected: 
  - Methods-Sektion komplett erhalten / Methods section fully preserved
  - Abstract und Einleitung enthalten / Abstract and introduction included
  - Teilweise Results / Partial results
- Zeit / Time: ~10-15 Sekunden / seconds

**Test Papers:**
1. PMC Full Text: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10000000/
2. The Lancet: https://www.thelancet.com/journals/lancet/article/PIIS0140-6736(23)00001-0/fulltext

### Schritt 3: Was prüfen? (What to check?)

#### ✅ Analysezeit / Analysis Time
- [ ] Analyse dauert maximal 20 Sekunden / Analysis takes max 20 seconds
- [ ] Bei kurzen Papers: < 10 Sekunden / For short papers: < 10 seconds
- [ ] Bei langen Papers: 10-15 Sekunden / For long papers: 10-15 seconds

#### ✅ Analysequalität / Analysis Quality
- [ ] Quality Score erscheint realistisch / Quality score appears realistic
- [ ] Positive Aspekte sind spezifisch / Positive aspects are specific
- [ ] Negative Aspekte sind spezifisch / Negative aspects are specific
- [ ] Source-Zitate sind aus dem Paper / Source citations are from the paper
- [ ] Methods-Details werden erwähnt / Methods details are mentioned

#### ✅ Vollständigkeit / Completeness
- [ ] Console-Log zeigt: "Text length XXX" / Console log shows text length
- [ ] Bei langen Papers: "Methods section found" in Console / For long papers: see "Methods section found" in console
- [ ] Mehr Details in der Analyse als vorher / More details in analysis than before

### Schritt 4: Console-Logs überprüfen (Check Console Logs)

1. Rechtsklick auf Extension-Icon → "Popup untersuchen" / "Inspect Popup"
2. Gehe zum Console-Tab
3. Führe eine Analyse durch
4. Suche nach diesen Logs / Look for these logs:

```
Q‑SCI LLM Evaluator: Input text length: XXXXX characters
Q‑SCI LLM Evaluator: Text length XXXXX exceeds limit, applying full-text optimized truncation...
Q‑SCI LLM Evaluator: Methods section found (XXXX chars), preserving completely
Q‑SCI LLM Evaluator: Text truncated from XXXXX to 30000 characters
```

### Erwartete Ergebnisse (Expected Results)

| Paper-Typ | Vorher | Nachher |
|-----------|--------|---------|
| Kurz (< 15K) | Vollständig / Complete | Vollständig / Complete |
| Mittel (15K-30K) | Gekürzt / Truncated | **Vollständig / Complete** ✨ |
| Lang (> 30K) | 15K Zeichen | **30K Zeichen** ✨ |
| Analysezeit | 5-8s | 8-15s ✅ |

## Beispiel-Test-Ablauf (Example Test Flow)

### Test mit PMC Full-Text Article

1. Öffne: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10000000/
2. Klicke auf Q-SCI Extension-Icon
3. Klicke "Analyze Paper"
4. **Beobachtungen / Observations:**
   - ⏱️ Zeit messen / Measure time
   - 📊 Quality Score notieren / Note quality score
   - 📝 Anzahl der Aspekte zählen / Count aspects
   - 🔍 Console-Logs prüfen / Check console logs

5. **Vergleich (wenn vorher getestet) / Comparison (if tested before):**
   - War die Analyse detaillierter? / Was the analysis more detailed?
   - Wurden mehr Methods-Details erkannt? / Were more methods details recognized?
   - Blieb die Zeit unter 20 Sekunden? / Did time stay under 20 seconds?

## Probleme melden (Report Issues)

Falls Probleme auftreten / If you encounter issues:

### ❌ Analyse dauert > 20 Sekunden / Analysis takes > 20 seconds
**Mögliche Ursachen / Possible causes:**
- Langsame Internetverbindung / Slow internet connection
- OpenAI API langsam / OpenAI API slow
- Browser überlastet / Browser overloaded

**Lösung / Solution:**
- Nochmal versuchen / Try again
- Andere Papers testen / Test other papers
- Browser neu starten / Restart browser

### ❌ Qualität schlechter als vorher / Quality worse than before
**Bitte melden mit / Please report with:**
- Paper-URL
- Quality Score (vorher/nachher) / (before/after)
- Screenshots der Aspekte / Screenshots of aspects
- Console-Logs

### ❌ Extension lädt nicht / Extension doesn't load
**Lösung / Solution:**
1. `chrome://extensions/` öffnen / open
2. Q-SCI Extension finden / find
3. "Remove" klicken / click
4. `npm run build` ausführen / run
5. Extension neu laden / reload extension

## Erfolgs-Kriterien (Success Criteria)

Die Optimierung ist erfolgreich wenn / The optimization is successful if:

✅ Analysezeit bleibt unter 20 Sekunden / Analysis time stays under 20 seconds
✅ Längere Papers werden detaillierter analysiert / Longer papers are analyzed in more detail
✅ Methods-Sektion wird immer komplett erfasst / Methods section is always fully captured
✅ Quality Scores bleiben präzise / Quality scores remain precise
✅ Keine Fehler in der Extension / No errors in extension

## Feedback erwünscht! (Feedback welcome!)

Bitte teile deine Erfahrungen mit / Please share your experience:
- Welche Papers hast du getestet? / Which papers did you test?
- Wie lange dauerte die Analyse? / How long did the analysis take?
- War die Analyse besser als vorher? / Was the analysis better than before?
- Gab es Probleme? / Were there any issues?

---

**Version:** 1.0
**Datum / Date:** Dezember 2024
**Optimierung / Optimization:** MAX_TEXT_LENGTH 15K → 30K
