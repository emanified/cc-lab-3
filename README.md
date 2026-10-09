# My Site

- `public/` – frontend (HTML/CSS/JS)
- `netlify/functions/api.js` – backend (Netlify Function, routes under `/api/*`)
- `scripts/query.js` – CLI script that queries the API
- `netlify.toml` – tells Netlify where everything is

## Run locally
```
npm install -g netlify-cli
netlify dev                      # http://localhost:8888
node scripts/query.js hello Ada  # in a second terminal
```

## Deploy
1. Push to GitHub.
2. Netlify → Add new site → Import from Git → pick the repo. Settings are read from `netlify.toml`; leave the build command empty.
3. Query the live site: `BASE_URL=https://YOUR-SITE.netlify.app node scripts/query.js items`
