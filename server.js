const express = require('express');
const fetch = require('node-fetch');
const fs = require('fs');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PASSWORD = 'Lipscomb';  // Password is "Lipscomb"
const GIST_ID = '2adb7fdd434312f2379bed8e1dd4194d';  // Your Gist ID here
const FILE_NAME = 'shopping-list.json';

const TOKEN = fs.readFileSync('token.txt', 'utf-8').trim();

// Verify password middleware
function verifyPassword(req, res, next) {
  const { password } = req.body;
  if (password !== PASSWORD) {
    return res.status(403).json({ error: 'Invalid password' });
  }
  next();
}

// Get the list from the Gist
app.get('/list', async (req, res) => {
  try {
    const gistRes = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      headers: { Authorization: `token ${TOKEN}` }
    });
    const data = await gistRes.json();
    const content = data.files[FILE_NAME]?.content || '[]';
    res.json(JSON.parse(content));
  } catch (err) {
    console.error('Error fetching list:', err);
    res.status(500).json({ error: 'Failed to load list' });
  }
});

// Update the list (requires password)
app.post('/list', verifyPassword, async (req, res) => {
  try {
    const updatedContent = JSON.stringify(req.body.list, null, 2);  // Expect a list inside the body
    await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      method: 'PATCH',
      headers: {
        Authorization: `token ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        files: {
          [FILE_NAME]: { content: updatedContent }
        }
      })
    });
    res.sendStatus(200);
  } catch (err) {
    console.error('Error updating list:', err);
    res.status(500).json({ error: 'Failed to update list' });
  }
});

app.listen(3000, () => {
  console.log('✅ Backend running at http://localhost:3000');
});
