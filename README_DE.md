# Q-SCI Browser Extension - Authentication Implementation

## 🎉 Was wurde implementiert?

Ich habe die vollständige Authentifizierung und Abonnement-Verwaltung für die Q-SCI Browser Extension implementiert, genau wie gewünscht.

### ✅ Hauptfunktionen

1. **Login-System**
   - Benutzer müssen sich einloggen, um die Extension zu verwenden
   - E-Mail und Passwort Formular
   - Sichere Token-Speicherung
   - Verbindung mit q-sci.org Backend

2. **Abonnement-Prüfung**
   - Prüft Registrierungs- und Abonnement-Status auf q-sci.org
   - Unterscheidet zwischen "free" und "subscribed" Benutzern
   - Zeigt Abonnement-Badge an

3. **Nutzungslimits**
   - **Kostenlose Benutzer**: 10 Analysen pro Tag
   - **Abonnierte Benutzer**: 100 Analysen pro Tag
   - Automatische Zählung und Limitierung
   - Täglicher Reset um Mitternacht

4. **Benutzeroberfläche**
   - Login-Formular wenn nicht angemeldet
   - Benutzer-Status Anzeige wenn angemeldet
   - Zähler für tägliche Nutzung (z.B. "5 / 10")
   - Upgrade-Aufforderung für kostenlose Benutzer
   - Links zu Registrierung und Abonnement auf q-sci.org

## 📁 Geänderte/Neue Dateien

### Neue Dateien:
- `auth.js` - Authentifizierung und Nutzungsverfolgung
- `AUTHENTICATION.md` - API-Dokumentation für Backend
- `IMPLEMENTATION_SUMMARY.md` - Technische Implementierungsdetails
- `TEST_PAGE.html` - Testanleitung
- `README_DE.md` - Diese Datei

### Geänderte Dateien:
- `manifest.json` - q-sci.org Berechtigungen hinzugefügt
- `popup.html` - Login UI und Benutzer-Status hinzugefügt
- `popup.js` - Authentifizierung integriert
- `options.html` - Auth-Status Anzeige hinzugefügt
- `options.js` - Auth-Status Logik hinzugefügt

## 🔧 Backend-Integration Erforderlich

Die Extension benötigt zwei API-Endpunkte auf **www.q-sci.org**:

### 1. Login-Endpunkt
```
POST https://www.q-sci.org/api/auth/login

Request:
{
  "email": "benutzer@example.com",
  "password": "passwort"
}

Response:
{
  "token": "jwt_token_hier",
  "email": "benutzer@example.com",
  "subscription_status": "free" oder "subscribed"
}
```

### 2. Verifizierungs-Endpunkt
```
GET https://www.q-sci.org/api/auth/verify
Header: Authorization: Bearer <token>

Response:
{
  "subscription_status": "free" oder "subscribed"
}
```

## 🧪 Testen ohne Backend

Für Tests ohne Backend kannst du manuell Auth-Daten setzen:

1. Extension in Chrome laden (Developer Mode)
2. Browser DevTools öffnen (F12)
3. In der Console ausführen:

```javascript
chrome.storage.local.set({
  'qsci_auth_token': 'test_token_12345',
  'qsci_user_email': 'test@example.com',
  'qsci_subscription_status': 'free'  // oder 'subscribed'
});
```

4. Extension Popup schließen und wieder öffnen
5. Du solltest nun den Benutzer-Status sehen

## 📋 Nächste Schritte

### Für dich (Backend):
1. Implementiere die beiden API-Endpunkte auf q-sci.org
2. Erstelle eine Benutzer-Datenbank mit:
   - Email (unique)
   - Password (gehasht mit bcrypt/argon2)
   - Subscription Status ('free' oder 'subscribed')
3. Erstelle Registrierungs-Seite auf https://www.q-sci.org/register
4. Erstelle Abonnement-Seite auf https://www.q-sci.org/subscribe

### Für Tests:
1. Extension in Chrome laden
2. Teste mit manuellen Auth-Daten (siehe oben)
3. Teste Nutzungszähler und Limits
4. Teste mit echtem Backend sobald verfügbar

## 📚 Dokumentation

Für vollständige Details siehe:

- **AUTHENTICATION.md** - Komplette API-Spezifikation und Integration Guide
- **IMPLEMENTATION_SUMMARY.md** - Technische Implementierungsdetails
- **TEST_PAGE.html** - Schritt-für-Schritt Testanleitung

## 🔐 Sicherheit

- Passwörter werden nie in der Extension gespeichert
- JWT Tokens für Authentifizierung
- Nur HTTPS Kommunikation
- Automatische Token-Validierung
- Offline-Unterstützung mit gecachten Daten

## ❓ Fragen?

Alle Code-Dateien sind gut dokumentiert mit Kommentaren. Wenn du Fragen zur Implementierung oder Integration hast, schau in:

1. `auth.js` - Kommentierte Funktionen für Auth und Usage Tracking
2. `AUTHENTICATION.md` - Detaillierte API-Dokumentation
3. `popup.js` - Kommentierte Integration der Auth-Logik

## ✨ Funktionen im Überblick

| Feature | Status | Details |
|---------|--------|---------|
| Login-Formular | ✅ | E-Mail & Passwort Eingabe |
| Backend-Integration | ✅ | API-Calls zu q-sci.org |
| Token-Verwaltung | ✅ | Sicher in chrome.storage |
| Abonnement-Prüfung | ✅ | Free vs. Subscribed |
| Nutzungszähler | ✅ | Tägliche Analyse-Zählung |
| Limits | ✅ | 10 (free) / 100 (subscribed) |
| Upgrade-Prompt | ✅ | Für kostenlose Benutzer |
| Offline-Support | ✅ | Mit gecachten Daten |
| Options-Seite | ✅ | Auth-Status Anzeige |

---

**Status**: ✅ Vollständig implementiert und bereit zum Testen

**Nächster Schritt**: Backend API-Endpunkte auf q-sci.org implementieren
