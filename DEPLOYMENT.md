# ManudBE Digital Ocean Deployment Guide

## Prerequisites
- Digital Ocean Droplet (Ubuntu 20.04+ recommended)
- Domain name (optional, for production)
- Firebase project setup
- Google AI API key

## Step 1: Setup Digital Ocean Droplet

### 1.1 Create Droplet
```bash
# Choose Ubuntu 20.04/22.04
# Minimum: 1GB RAM, 1vCPU
# Recommended: 2GB RAM, 1vCPU for production
```

### 1.2 Connect to Droplet
```bash
ssh root@your-droplet-ip
```

### 1.3 Update System
```bash
apt update && apt upgrade -y
```

## Step 2: Install Node.js and Dependencies

### 2.1 Install Node.js (v18+)
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs
node --version  # Should show v18+
npm --version
```

### 2.2 Install PM2 (Process Manager)
```bash
npm install -g pm2
```

### 2.3 Install Git
```bash
apt install -y git
```

## Step 3: Deploy Application

### 3.1 Clone Repository
```bash
cd /var/www
git clone https://github.com/marcoalfans/manud-be.git
cd manud-be
```

### 3.2 Install Dependencies
```bash
npm install
```

### 3.3 Configure Environment
```bash
cp .env.example .env
nano .env
```

Edit the `.env` file with your actual values:
```env
NODE_ENV=production
APP_HOST=0.0.0.0
APP_PORT=7777

# Firebase Configuration
PROJECT_ID=your-firebase-project-id
PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com

# JWT Configuration
JWT_SECRET=your-generated-secret-key
JWT_EXPIRED_IN=1d

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# Google AI
GEMINI_API_KEY=your-gemini-api-key
```

### 3.4 Start Application with PM2
```bash
pm2 start src/app.js --name "manudbe-api"
pm2 startup
pm2 save
```

### 3.5 Check Status
```bash
pm2 status
pm2 logs manudbe-api
```

## Step 4: Setup Reverse Proxy (Nginx)

### 4.1 Install Nginx
```bash
apt install -y nginx
```

### 4.2 Configure Nginx
```bash
nano /etc/nginx/sites-available/manudbe
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain or droplet IP

    location / {
        proxy_pass http://localhost:7777;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4.3 Enable Site
```bash
ln -s /etc/nginx/sites-available/manudbe /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

## Step 5: Setup SSL (Optional but Recommended)

### 5.1 Install Certbot
```bash
apt install -y certbot python3-certbot-nginx
```

### 5.2 Get SSL Certificate
```bash
certbot --nginx -d your-domain.com
```

## Step 6: Setup Firewall

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

## Step 7: Monitor and Maintain

### 7.1 Monitor Logs
```bash
pm2 logs manudbe-api
tail -f /var/log/nginx/access.log
```

### 7.2 Update Application
```bash
cd /var/www/manud-be
git pull origin main
npm install
pm2 restart manudbe-api
```

### 7.3 Auto-restart on Reboot
```bash
pm2 startup
pm2 save
```

## Testing

Test your API:
```bash
curl http://your-domain.com/
# or
curl http://your-droplet-ip/
```

## Common Issues

1. **Port already in use**: Check if port 7777 is free
2. **Permission denied**: Make sure user has correct permissions
3. **Firebase auth error**: Check your service account key
4. **Nginx 502**: Check if Node.js app is running with pm2

Your ManudBE API should now be running on your Digital Ocean droplet! 🚀