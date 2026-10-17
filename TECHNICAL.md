# Technical Architecture & LXC Container Deployment Guide
## Heidi Boutique // Fashion Show Runway & Wardrobe Manager

This document provides complete technical specifications, architecture notes, and step-by-step production deployment instructions for hosting the **Fashion Show Runway & Wardrobe Manager** web application inside a **Linux Container (LXC)** running **Debian 12 (Bookworm)**.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [LXC Resource Sizing & Prerequisites](#2-lxc-resource-sizing--prerequisites)
3. [LXC Container Provisioning on Debian 12](#3-lxc-container-provisioning-on-debian-12)
4. [Container Base OS Setup & Hardening](#4-container-base-os-setup--hardening)
5. [Application Code Deployment](#5-application-code-deployment)
6. [Deployment Strategy A: High-Performance Nginx (Recommended)](#6-deployment-strategy-a-high-performance-nginx-recommended)
7. [Deployment Strategy B: Node.js Built-in Server with systemd](#7-deployment-strategy-b-nodejs-built-in-server-with-systemd)
8. [Deployment Strategy C: Nginx Reverse Proxy with Node.js Backend](#8-deployment-strategy-c-nginx-reverse-proxy-with-nodejs-backend)
9. [TLS/SSL Encryption via Let's Encrypt / Certbot](#9-tlsssl-encryption-via-lets-encrypt--certbot)
10. [Network, Firewall & Security Hardening](#10-network-firewall--security-hardening)
11. [Maintenance, Updating & Disaster Recovery](#11-maintenance-updating--disaster-recovery)
12. [Troubleshooting & Diagnostics Checklist](#12-troubleshooting--diagnostics-checklist)

---

## 1. Architecture Overview

### 1.1 Application Topology
The Heidi Boutique Fashion Show Manager is an ultra-lean, high-performance web application backed by an embedded SQLite database engine:
- **Presentation Layer**: HTML5 semantic markup, CSS3 styling (`main.css`), and dedicated page-break optimized print stylesheet (`print.css`).
- **Logic & Execution Layer**: Vanilla ECMAScript modules (`store.js`, `reports.js`, `app.js`).
- **Data Persistence**: Embedded **SQLite relational database** (`fashion_show.db`) with Write-Ahead Logging (WAL) and foreign keys enabled, powered natively by Node.js 22+ (`node:sqlite`). Browser `localStorage` is completely retired for fashion show data after automatic first-run migration.
- **Backend Architecture**: High-speed Node.js HTTP server (`server.js`) providing static asset delivery and a clean JSON REST API (`/api/data`, `/api/migrate`, `/api/shows`, `/api/active-show`, etc.).
- **Dependencies**: 0 external npm packages, 0 CDN script dependencies, 0 build steps. Native standard-library SQLite.

```
                    ┌────────────────────────────────────────────────────────┐
                    │               LXC Host (e.g. Proxmox VE)               │
                    │                                                        │
                    │   ┌────────────────────────────────────────────────┐   │
                    │   │       Debian 12 LXC Guest (Unprivileged)       │   │
                    │   │                                                │   │
Client Browser ────►│──►│ [Port 3000] Node.js Service (server.js)        │   │
                    │   │       │                                        │   │
                    │   │       ├── Static Assets (HTML / CSS / JS)      │   │
                    │   │       ├── REST API (/api/data, /api/migrate)   │   │
                    │   │       │                                        │   │
                    │   │       ▼                                        │   │
                    │   │ Embedded SQLite Database (fashion_show.db)     │   │
                    │   └────────────────────────────────────────────────┘   │
                    └────────────────────────────────────────────────────────┘
```

---

## 2. LXC Resource Sizing & Prerequisites

Because this application relies entirely on static asset delivery and client-side processing, system resource requirements inside the LXC container are exceptionally low:

| Metric | Minimum Specification | Recommended Specification |
| :--- | :--- | :--- |
| **vCPU** | 1 Core | 1 Core |
| **RAM** | 256 MB | 512 MB – 1 GB (allows OS buffers and cache) |
| **Swap** | 256 MB | 512 MB |
| **Disk Space** | 2 GB | 4 GB – 8 GB (for Debian 12 base OS, Nginx logs, and backups) |
| **Base OS** | Debian 12.x Bookworm | Debian 12.x Bookworm (Minimal / Standard template) |
| **Privilege Model** | Unprivileged | Unprivileged (enhanced security barrier) |

---

## 3. LXC Container Provisioning on Debian 12

You can provision the Debian 12 container via your preferred LXC hypervisor (Proxmox VE, Incus, LXD, or native `lxc-create`).

### 3.1 Provisioning via Proxmox VE CLI (`pct`)
Run the following command on your Proxmox VE host node:

```bash
# Download the latest Debian 12 template (if not already cached)
pveam update
pveam download local debian-12-standard_12.7-1_amd64.tar.zst

# Provision unprivileged Debian 12 container (replace CT ID 150 and IP as needed)
pct create 150 local:vztmpl/debian-12-standard_12.7-1_amd64.tar.zst \
  --hostname fashion-show \
  --cores 1 \
  --memory 512 \
  --swap 512 \
  --rootfs volume=local-lvm:4 \
  --ostype debian \
  --unprivileged 1 \
  --features nesting=1 \
  --net0 name=eth0,bridge=vmbr0,firewall=1,ip=192.168.1.150/24,gw=192.168.1.1 \
  --nameserver 1.1.1.1 \
  --start 1
```

*(Note: Replace `192.168.1.150/24` and `192.168.1.1` with your actual subnet IP and gateway, or use `ip=dhcp`)*.

### 3.2 Provisioning via Incus / LXD CLI
```bash
# Launch a new Debian 12 container named fashion-show
incus launch images:debian/12 fashion-show \
  -c limits.cpu=1 \
  -c limits.memory=512MB \
  -d root,size=4GiB
```

---

## 4. Container Base OS Setup & Hardening

Access your container shell:

```bash
# From Proxmox host
pct enter 150

# Or from Incus/LXD host
incus shell fashion-show
```

### 4.1 Update System Packages
Run updates and install foundational system utilities:

```bash
apt update && apt upgrade -y
apt install -y curl wget git rsync ufw ca-certificates lsb-release gnupg htop
```

### 4.2 Timezone & Locale Setup
Ensure correct British Standard / UTC time and UTF-8 locale:

```bash
timedatectl set-timezone Europe/London
dpkg-reconfigure -f noninteractive tzdata

# Verify locale
locale-gen en_GB.UTF-8
update-locale LANG=en_GB.UTF-8
```

---

## 5. Application Code Deployment

### 5.1 Set Directory Hierarchy and Dedicated Service User
```bash
# Create dedicated web deployment folder
mkdir -p /var/www/fashion-show-manager

# Create system user without interactive shell access
useradd -r -s /usr/sbin/nologin -d /var/www/fashion-show-manager fashionshow
```

### 5.2 Transfer Application Files
Choose one of the following methods to transfer the code:

#### Method 1: Git Clone (Direct from Repository)
```bash
git clone <your-repository-url> /var/www/fashion-show-manager
```

#### Method 2: Rsync / SCP from Development Machine
From your local development machine (PowerShell or Bash):
```bash
# From local project folder
rsync -avz --exclude '.git' --exclude 'node_modules' \
  ./ root@192.168.1.150:/var/www/fashion-show-manager/
```

### 5.3 Enforce Strict File Permissions
```bash
# Set ownership to standard web user (www-data) and permissions
chown -R www-data:www-data /var/www/fashion-show-manager
find /var/www/fashion-show-manager -type d -exec chmod 755 {} +
find /var/www/fashion-show-manager -type f -exec chmod 644 {} +
```

---

## 6. Deployment Strategy A: High-Performance Nginx (Recommended)

Since the application consists of static client files, **Nginx** is the gold-standard web server for production. It consumes < 15 MB of RAM, handles thousands of concurrent requests, supports Brotli/Gzip compression, and integrates natively with Let's Encrypt.

### 6.1 Install Nginx
```bash
apt install -y nginx
```

### 6.2 Configure Virtual Host
Create the configuration file at `/etc/nginx/sites-available/fashion-show.conf`:

```nginx
server {
    listen 80;
    listen [::]:80;
    
    server_name fashion-show.local; # Replace with your FQDN or container IP

    root /var/www/fashion-show-manager;
    index index.html;

    # Charset
    charset utf-8;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self' 'unsafe-inline' data:; font-src 'self' https://fonts.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;" always;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml application/atom+xml image/svg+xml;

    # Primary Routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Static Assets Caching
    location ~* \.(?:css|js|jpg|jpeg|gif|png|ico|cur|gz|svg|svgz|mp4|ogg|ogv|webm|htc)$ {
        expires 7d;
        access_log off;
        add_header Cache-Control "public, max-age=604800, immutable";
    }

    # Deny Hidden Files (e.g. .git, .env)
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
```

### 6.3 Enable Site & Verify Configuration
```bash
# Disable default welcome site
rm -f /etc/nginx/sites-enabled/default

# Symlink site configuration
ln -s /etc/nginx/sites-available/fashion-show.conf /etc/nginx/sites-enabled/

# Test syntax
nginx -t

# Reload and enable Nginx on boot
systemctl restart nginx
systemctl enable nginx
```

---

## 7. Deployment Strategy B: Node.js Built-in Server with systemd

If you prefer to run the included zero-dependency Node.js HTTP server (`server.js`) directly as a managed system daemon:

### 7.1 Install Node.js on Debian 12
Debian 12 provides Node.js LTS (v18+) in standard repositories:
```bash
apt install -y nodejs
node -v # Confirms Node.js v18.x or newer is installed
```

### 7.2 Create systemd Service Unit
Create `/etc/systemd/system/fashion-show.service`:

```ini
[Unit]
Description=Heidi Boutique Fashion Show Manager HTTP Service
Documentation=https://github.com/your-org/fashion-show-manager
After=network.target

[Service]
Type=simple
User=fashionshow
Group=fashionshow
WorkingDirectory=/var/www/fashion-show-manager
Environment=PORT=3000
Environment=HOST=0.0.0.0
ExecStart=/usr/bin/node /var/www/fashion-show-manager/server.js
Restart=always
RestartSec=3
LimitNOFILE=65535

# Process Sandboxing & Hardening
ProtectSystem=full
ProtectHome=true
NoNewPrivileges=true
PrivateTmp=true

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=fashion-show

[Install]
WantedBy=multi-user.target
```

### 7.3 Start and Enable Service
```bash
systemctl daemon-reload
systemctl enable --now fashion-show.service

# Check status
systemctl status fashion-show.service
```

---

## 8. Deployment Strategy C: Nginx Reverse Proxy with Node.js Backend

To combine Nginx's security headers, SSL termination, and request handling with the Node.js server:

Configure `/etc/nginx/sites-available/fashion-show.conf`:
```nginx
server {
    listen 80;
    server_name fashion-show.local;

    location / {
        proxy_pass http://127.0.0.1:3000;
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

---

## 9. TLS/SSL Encryption via Let's Encrypt / Certbot

For production environments exposed to the internet or corporate intranet with a registered domain name:

```bash
# Install Certbot and the Nginx plugin
apt install -y certbot python3-certbot-nginx

# Obtain and automatically install certificate
certbot --nginx -d fashion.example.com --email admin@example.com --agree-tos --non-interactive

# Verify automatic certificate renewal timer
systemctl status certbot.timer
```

---

## 10. Network, Firewall & Security Hardening

### 10.1 UFW (Uncomplicated Firewall) Configuration
Inside the LXC container:
```bash
# Default policies
ufw default deny incoming
ufw default allow outgoing

# Allow SSH, HTTP, and HTTPS
ufw allow 22/tcp comment 'SSH Administration'
ufw allow 80/tcp comment 'HTTP Web Traffic'
ufw allow 443/tcp comment 'HTTPS Web Traffic'

# Enable firewall
ufw --force enable
ufw status verbose
```

### 10.2 Automatic Security Upgrades
Install and configure Debian's `unattended-upgrades`:
```bash
apt install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades
```

---

## 11. Maintenance, Updating & Disaster Recovery

### 11.1 Updating the Application
When new features or bug fixes are published:
```bash
cd /var/www/fashion-show-manager
git pull origin main
chown -R www-data:www-data /var/www/fashion-show-manager

# If using Node.js systemd service:
systemctl restart fashion-show.service

# If using Nginx:
systemctl reload nginx
```

### 11.2 Data Backup & Portability
- **Client State**: All event lineups, models, and wardrobe assignments reside safely in browser `localStorage`.
- **JSON Snapshot Export**: Use the top bar **⬇ Export** function in the UI to generate timestamped `.json` exports prior to major show updates.
- **LXC Container Snapshots**: From the hypervisor host (e.g., Proxmox VE), perform snapshot backups:
  ```bash
  pct snapshot 150 "pre-upgrade-backup-$(date +%F)"
  vzdump 150 --compress zstd --storage local --mode snapshot
  ```

---

## 12. Troubleshooting & Diagnostics Checklist

| Symptom | Diagnostic Step | Remediation |
| :--- | :--- | :--- |
| **Connection Refused (`ERR_CONNECTION_REFUSED`)** | `systemctl status nginx`<br>`ss -tulpn \| grep -E '80\|3000'` | Check if Nginx or Node service is running; ensure service is enabled. |
| **`403 Forbidden` error** | Check `/var/log/nginx/error.log` | Run `chown -R www-data:www-data /var/www/fashion-show-manager` and `chmod 644 /var/www/fashion-show-manager/index.html`. |
| **Node.js only reachable from inside container** | Check `HOST` binding in `server.js` | Ensure `HOST` is bound to `0.0.0.0` (all interfaces) rather than `127.0.0.1`. |
| **Port Conflicts (Port 80/3000 in use)** | `lsof -i :80` or `netstat -tlpn` | Identify process occupying port and adjust configuration in `fashion-show.conf` or `PORT=3001`. |
| **Changes to CSS/JS not displaying** | Check browser cache or Nginx caching headers | Perform hard reload (`Ctrl+F5` / `Cmd+Shift+R`) or purge Nginx cache. |
