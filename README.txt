AI CHART SCANNER PRO V2 — DEPLOYMENT

WHAT IS INCLUDED
- server.js
- package.json
- public/index.html
- public/styles.css
- public/app.js

IMPORTANT FOLDER STRUCTURE
The GitHub repository root must contain:
  package.json
  server.js
  README.txt
  public/
    index.html
    styles.css
    app.js

RENDER SETTINGS
- New Web Service connected to this GitHub repository
- Root Directory: leave EMPTY
- Build Command: npm install
- Start Command: npm start
- Runtime: Node
- Add Environment Variable:
    Key: OPENAI_API_KEY
    Value: your own OpenAI API key
- Optional:
    Key: OPENAI_MODEL
    Value: gpt-4.1-mini
- Deploy the service.

TESTS AFTER DEPLOYMENT
1. Open https://YOUR-SERVICE.onrender.com/health
   Expected: {"status":"ok","app":"AI CHART SCANNER PRO V2"}
2. Open https://YOUR-SERVICE.onrender.com/
   Expected: AI Chart Scanner Pro V2 dashboard
3. Open https://YOUR-SERVICE.onrender.com/styles.css
   Expected: CSS text in the browser.

SECURITY
Never put your OpenAI API key in GitHub files or in frontend JavaScript.
Set it only in Render Environment Variables.
The scanner sends uploaded screenshots to the OpenAI API for analysis and does not intentionally save them.
