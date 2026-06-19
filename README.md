# Ways3D Order System

Customer order form + admin dashboard for Ways3D — Jeddah, KSA.

## Setup (5 steps)

### 1. Install dependencies
```bash
cd ways3d-order-system
npm install
```

### 2. Set up free services

**Neon (database)** — https://neon.tech
- Create account → New project → Copy connection string

**Cloudinary (file uploads)** — https://cloudinary.com
- Create account → Settings → Upload tab → Add upload preset
- Set "Signing Mode" to **Unsigned**
- Name it `ways3d_uploads`
- Copy your Cloud Name from the dashboard

**Gmail App Password (email)** — https://myaccount.google.com/apppasswords
- Enable 2FA first → Search "App passwords" → Create for Mail → Copy the 16-char password

### 3. Create `.env` file
```bash
cp .env.example .env
```
Fill in all values from step 2.

### 4. Push database schema
```bash
npx prisma db push
```

### 5. Run locally
```bash
npm run dev
```
- Form: http://localhost:3000
- Admin: http://localhost:3000/admin

## Deploy to Vercel (free)

1. Push to GitHub
2. Import at vercel.com/new
3. Add all env variables from your `.env` file
4. Deploy

Your form will be live at `https://your-project.vercel.app`

## URLs

| URL | Purpose |
|-----|---------|
| `/` | Customer order form (share this link) |
| `/success` | Post-submission confirmation |
| `/admin` | Admin login |
| `/admin/dashboard` | All orders |
| `/admin/orders/[id]` | Order detail + invoice builder |
| `/admin/orders/[id]/invoice` | Print-ready invoice |

## Admin Login
- Email: set `ADMIN_EMAIL` in `.env`
- Password: set `ADMIN_PASSWORD` in `.env`

## Invoice Flow
1. Open order in dashboard
2. Add line items (description, qty, unit price)
3. Add delivery cost if applicable
4. Click **Save Changes**
5. Click **Print Invoice** → browser opens print dialog → Save as PDF
