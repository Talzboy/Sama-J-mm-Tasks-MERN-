# Netlify Deployment Setup Guide

## ✅ Prerequisites
- [ ] Netlify account with your repo connected
- [ ] MongoDB Atlas account
- [ ] Your Netlify site URL (e.g., `https://your-site.netlify.app`)

## 🔑 Environment Variables to Set on Netlify

**Go to: Netlify Dashboard → Your Site → Site Settings → Environment Variables**

Add the following variables:

| Variable | Value | Example |
|----------|-------|---------|
| `JWT_SECRET` | Copy the secure key below | `7878ed92a166feeded543142758028b0fefed3982c0712933c471a250af70415` |
| `MONGODB_URI` | Your MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/sama-jamm?retryWrites=true&w=majority` |
| `CORS_ORIGIN` | Your Netlify site URL | `https://your-site-name.netlify.app` |
| `NODE_ENV` | `production` | `production` |
| `PORT` | `5000` (optional for functions) | `5000` |

### 🔐 Your Generated JWT_SECRET (use this):
```
7878ed92a166feeded543142758028b0fefed3982c0712933c471a250af70415
```

## 📝 Steps to Deploy

### 1. Update Your MongoDB Atlas (if needed)
- Go to **MongoDB Atlas Dashboard → Network Access**
- Add IP address `0.0.0.0/0` to allow Netlify to connect
  - ⚠️ Or whitelist only Netlify's IP ranges for more security

### 2. Set Environment Variables on Netlify
```
a) Go to your Netlify site dashboard
b) Click "Site settings"
c) Go to "Environment variables"
d) Click "Add variable" for each of these:
   - JWT_SECRET: [paste the value above]
   - MONGODB_URI: [your MongoDB connection string]
   - CORS_ORIGIN: [your-site-name.netlify.app]
   - NODE_ENV: production
e) Save
```

### 3. Deploy
Push your changes to git and Netlify will auto-deploy:
```bash
cd "c:\Users\Sala Sow\Desktop\Sama Jàmm Tasks"
git add .
git commit -m "Setup Netlify deployment with Functions"
git push
```

### 4. Monitor Build
- Go to **Netlify Dashboard → Deploys**
- Watch the build logs to ensure it succeeds
- If build fails, check the logs for errors (often missing env vars)

### 5. Test Registration
Once deployed, visit: `https://your-site-name.netlify.app/register`

## 🐛 Troubleshooting

### "Database unavailable" error
- Check `MONGODB_URI` is correct and accessible from Netlify
- Verify MongoDB Atlas Network Access allows Netlify IPs

### "Route not found" on register
- Ensure all environment variables are set
- Check Netlify Functions build logs

### Registration works but can't log in
- Clear browser cache/localStorage
- Verify JWT_SECRET is set correctly on Netlify

## 📚 MongoDB Atlas Setup (if first time)
1. Create MongoDB Atlas cluster
2. Create database user with username/password
3. Get connection string: **Connect → Drivers → Node.js**
4. Format: `mongodb+srv://username:password@cluster.mongodb.net/database-name?retryWrites=true&w=majority`

---

**Need help?** Run this command to check if dependencies are installed:
```bash
cd netlify/functions && npm install
```
