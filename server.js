
const express = require('express');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();
const app = express();
app.use(cors());
app.use(express.static('public'));

app.use('/files', express.static(__dirname));

const PORT = 3000;

app.get('/api/project-status', async (req, res) => {
  const auth = Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString('base64');
  const jql = 'project=KANTILO ORDER BY created DESC';

  try {
    const response = await fetch(`https://${process.env.JIRA_DOMAIN}/rest/api/3/search?jql=${encodeURIComponent(jql)}`, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    });

    const data = await response.json();

    const issues = data.issues.map(issue => ({
      key: issue.key,
      summary: issue.fields.summary,
      status: issue.fields.status.name,
      updated: issue.fields.updated
    }));

    const total = issues.length;
    const done = issues.filter(i => i.status.toLowerCase() === 'done' || i.status.toLowerCase() === 'completed').length;
    const percent = total === 0 ? 0 : Math.round((done / total) * 100);

    res.json({ percent, total, done, issues });
  } catch (err) {
    console.error("Jira API error:", err);
    res.status(500).json({ error: 'Failed to fetch Jira data' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
