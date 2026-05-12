# Deploy to Railway

## 1. Push to GitHub
```bash
cd wa-blast
git init
git add .
git commit -m "init"
gh repo create wa-blast --private --push
```

## 2. Deploy on Railway
1. Go to railway.app → New Project → Deploy from GitHub repo
2. Select your `wa-blast` repo
3. Railway auto-detects Node.js — set start command: `npm start`

## 3. Set Environment Variables in Railway
In your Railway project → Variables tab, add:
```
JWT_SECRET=<generate a long random string>
ADMIN_PASSWORD=<your admin password>
JUNIOR_PASSWORD=<shared junior password>
NODE_ENV=production
```

## 4. Build step
In Railway → Settings → Build Command:
```
npm install && npm run build
```

## 5. Default Credentials (first login)
- Admin: `admin` / value of `ADMIN_PASSWORD`
- Junior 1-3: `junior1`, `junior2`, `junior3` / value of `JUNIOR_PASSWORD`

Change passwords immediately after first login via Setup → Users.

## Local Development
```bash
# Copy env file
cp .env.example .env
# Edit .env with your values

# Install all deps
npm install
cd client && npm install && cd ..

# Run both server + client
npm run dev
# Server: http://localhost:3001
# Client: http://localhost:5173
```
