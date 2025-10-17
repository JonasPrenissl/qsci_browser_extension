# Q-SCI Browser Extension - Fehlerbehebung

## ⚠️ Häufiger Fehler: Netzwerklaufwerk Problem

### Fehlermeldung:
```
Das Hintergrundskript „background.js" konnte nicht geladen werden
Fehler: Datei \\charite.de\homes\h08\jopr10\Dokumente\...
```

### Problem:
Chrome-Erweiterungen können **NICHT** von Netzlaufwerken oder UNC-Pfaden geladen werden. Dies ist eine Chrome-Sicherheitseinschränkung.

### Lösung:
Sie müssen die Extension auf Ihre **lokale Festplatte** kopieren.

## Schritt-für-Schritt Lösung

### 1. Extension auf lokale Festplatte kopieren

Wählen Sie eine dieser Optionen:

**Option A: In "Dokumente" kopieren (Empfohlen)**
```
Von: \\charite.de\homes\h08\jopr10\Dokumente\Forschung\Q-SCI Project\...
Nach: C:\Users\IhrBenutzername\Documents\qsci_browser_extension
```

**Option B: Auf Desktop kopieren**
```
Nach: C:\Users\IhrBenutzername\Desktop\qsci_browser_extension
```

**Option C: Eigenen Ordner erstellen**
```
Nach: C:\ChromeExtensions\qsci_browser_extension
```

### 2. Extension in Chrome laden

1. **Chrome öffnen** und zu `chrome://extensions/` navigieren

2. **"Entwicklermodus"** aktivieren (oben rechts)

3. **"Entpackte Erweiterung laden"** klicken

4. **Lokalen Ordner auswählen** (nicht Netzlaufwerk!)
   - Beispiel: `C:\Users\IhrBenutzername\Documents\qsci_browser_extension`

5. Die Extension sollte jetzt erscheinen

### 3. Clerk Authentifizierung konfigurieren

Bevor Sie die Extension verwenden können, müssen Sie Clerk einrichten:

1. **Clerk Account erstellen** auf [clerk.com](https://clerk.com)

2. **Publishable Key erhalten**

3. **clerk-auth.html bearbeiten**:
   - Öffnen Sie `clerk-auth.html` in einem Texteditor
   - Zeile ~151 finden:
     ```html
     data-clerk-publishable-key="YOUR_CLERK_PUBLISHABLE_KEY"
     ```
   - Ersetzen Sie `YOUR_CLERK_PUBLISHABLE_KEY` mit Ihrem echten Key
   
   - Zeile ~170 finden:
     ```javascript
     const clerk = new Clerk('YOUR_CLERK_PUBLISHABLE_KEY');
     ```
   - Ersetzen Sie `YOUR_CLERK_PUBLISHABLE_KEY` mit Ihrem echten Key

### 4. Extension ID notieren

Nach dem Laden:
1. Schauen Sie auf die Extension-Karte in `chrome://extensions/`
2. Notieren Sie die **Extension ID** (lange Buchstabenfolge)
3. Beispiel: `abcdefghijklmnopqrstuvwxyz123456`

### 5. Clerk Redirect URL konfigurieren

1. Gehen Sie zu [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigieren Sie zu: **Ihre App → Einstellungen → Allowed redirect URLs**
3. Fügen Sie hinzu:
   ```
   chrome-extension://IHRE_EXTENSION_ID/clerk-auth.html
   ```
   (Ersetzen Sie `IHRE_EXTENSION_ID` mit der echten ID)

### 6. Benutzer-Abonnementstatus einrichten

Für jeden Benutzer müssen Sie den Abonnementstatus in Clerk festlegen:

1. In Clerk Dashboard, gehen Sie zu **Users**
2. Wählen Sie einen Benutzer aus
3. Klicken Sie auf **Public metadata**
4. Fügen Sie hinzu:
   ```json
   {
     "subscription_status": "free"
   }
   ```
   oder
   ```json
   {
     "subscription_status": "subscribed"
   }
   ```

## Extension testen

1. **Extension-Symbol** in Chrome-Symbolleiste klicken
2. **"Login with Clerk"** klicken
3. **Popup-Fenster** sollte sich öffnen
4. **Anmelden oder registrieren**
5. **Login-Status überprüfen** im Extension-Popup
6. **Zu einer wissenschaftlichen Publikation navigieren** (z.B. pubmed.ncbi.nlm.nih.gov)
7. **"Analyze Paper"** klicken
8. **Nutzungszähler überprüfen** nach der Analyse

## Weitere Probleme

### Extension lädt nicht

**Problem**: Hintergrundskript-Fehler  
**Lösung**: Stellen Sie sicher, dass die Extension auf **lokaler Festplatte** ist, nicht auf Netzlaufwerk

**Problem**: Manifest-Datei nicht gefunden  
**Lösung**: Stellen Sie sicher, dass Sie den richtigen Ordner mit `manifest.json` ausgewählt haben

### Authentifizierungsprobleme

**Problem**: Popup-Fenster öffnet sich nicht  
**Lösung**: Erlauben Sie Pop-ups für die Extension in Chrome-Einstellungen

**Problem**: Authentifizierung schlägt fehl  
**Lösung**: 
- Überprüfen Sie, ob der Clerk Publishable Key in `clerk-auth.html` korrekt ist
- Überprüfen Sie, ob die Redirect-URL im Clerk Dashboard konfiguriert ist
- Überprüfen Sie die Browser-Konsole auf Fehlermeldungen

**Problem**: "Please login to use analysis features" Nachricht  
**Lösung**: Das ist korrekt! Nur angemeldete Benutzer können die Extension verwenden

### Nutzungslimit-Probleme

**Problem**: Nutzungszähler aktualisiert sich nicht  
**Lösung**: 
- Überprüfen Sie die Browser-Konsole auf Fehler
- Überprüfen Sie, ob die Authentifizierung funktioniert
- Überprüfen Sie, ob `auth.js` korrekt geladen ist

**Problem**: Falsches Nutzungslimit  
**Lösung**: 
- Überprüfen Sie den Abonnementstatus in Clerk User Metadata
- Sollte entweder "free" (10/Tag) oder "subscribed" (100/Tag) sein

## Funktionen

✅ **Clerk Authentifizierung** - Sicherer Login über Clerk  
✅ **Nutzungslimits** - 10 Analysen/Tag (kostenlos) oder 100/Tag (Abonnement)  
✅ **Zugriffskontrolle** - Nur angemeldete Benutzer können Publikationen analysieren  
✅ **Auto-Reset** - Nutzungszähler werden täglich um Mitternacht zurückgesetzt  
✅ **Multi-Site-Unterstützung** - Funktioniert auf PubMed, arXiv, Nature, Science, usw.

## Tägliche Nutzungslimits

| Benutzertyp | Analysen pro Tag |
|-------------|------------------|
| Kostenlos   | 10               |
| Abonniert   | 100              |

Die Zähler werden automatisch um Mitternacht (Ortszeit) zurückgesetzt.

## Wichtige Dateien

```
qsci_browser_extension/
├── manifest.json           # Extension Manifest
├── background.js          # Hintergrund Service Worker
├── popup.html            # Extension Popup UI
├── popup.js              # Popup Logik
├── auth.js               # Authentifizierung & Nutzungsverfolgung
├── clerk-auth.html       # Clerk Authentifizierungsseite
├── content-script.js     # Content Script für Webseiten
├── qsci_evaluator.js     # Publikationsbewertungslogik
└── icons/                # Extension Icons
```

## Support

Bei Problemen:
1. Überprüfen Sie die Browser-Konsole (F12) auf Fehlermeldungen
2. Stellen Sie sicher, dass die Extension von **lokaler Festplatte** geladen ist
3. Überprüfen Sie die Clerk-Konfiguration in `clerk-auth.html`
4. Siehe [CLERK_SETUP.md](CLERK_SETUP.md) für detaillierte Clerk-Einrichtung
5. Siehe [INSTALLATION.md](INSTALLATION.md) für vollständige Installationsanleitung (auf Englisch)

## Sicherheitshinweise

- Extension speichert niemals Passwörter
- Alle Authentifizierung wird von Clerk verarbeitet
- Sitzungstokens werden lokal im Chrome-Speicher gespeichert
- Nur sichere HTTPS-Verbindungen zu Clerk und APIs

## Lizenz

Wie Hauptprojekt-Lizenz.
