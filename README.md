# ForFor - Föreningsförsäljning

ForFor is a web application designed for Swedish sports clubs (föreningar) to manage door-to-door sales campaigns. This MVP (Minimum Viable Product) helps clubs organize teams, manage customer addresses, create orders, and track sales of paper products sold in sacks (primarily toilet paper and paper towels).

## What is ForFor?

ForFor makes it easy for sports clubs to run fundraising campaigns by selling paper products door-to-door. The application has two main interfaces:

1. **Admin Interface** - For club administrators to manage teams, products, order rounds, and view reports
2. **Team Member Interface** - For young salespeople (teenagers) to register orders while standing at a customer's door

## Key Features

- 🏢 **Multi-team Management** - Organize your club into teams with assigned streets
- 📦 **Product Catalog** - Manage products sold in sacks with pricing
- 🗓️ **Sales Rounds** - Define sales periods with start/end dates and delivery dates
- 📍 **Address Management** - Import and organize customer addresses by street
- 🛒 **Easy Order Creation** - Simple, mobile-friendly interface for team members
- 💰 **Subscription Discounts** - 10% discount for customers with annual subscriptions
- 📱 **Swish Integration** - Generate QR codes for easy mobile payments (mocked for MVP)
- 📊 **Reports & Analytics** - Track sales, view statistics, and print delivery lists

---

## 🚀 Getting Started

This guide will help you set up ForFor on your computer, even if you've never done this before!

### Prerequisites

Before you begin, you need to install these programs on your computer:

1. **Node.js** (version 18 or higher)
   - Go to https://nodejs.org/
   - Download the "LTS" version (recommended for most users)
   - Run the installer and follow the instructions
   - To verify installation, open a terminal/command prompt and type: `node --version`

2. **PostgreSQL** (database)
   - Go to https://www.postgresql.org/download/
   - Download and install PostgreSQL for your operating system
   - During installation, remember the password you set for the "postgres" user
   - The default port is 5432 (keep this unless you know what you're doing)

3. **Git** (optional but recommended)
   - Go to https://git-scm.com/downloads
   - Download and install for your operating system

---

## 📥 Installation Steps

### Step 1: Download the Code

**Option A: Using Git (recommended)**
1. Open a terminal/command prompt
2. Navigate to where you want to store the project
3. Run: `git clone https://github.com/Tschiffer46/ForFor.git`
4. Navigate into the folder: `cd ForFor`

**Option B: Download as ZIP**
1. Go to the GitHub repository
2. Click the green "Code" button
3. Select "Download ZIP"
4. Extract the ZIP file to a folder on your computer
5. Open a terminal/command prompt in that folder

### Step 2: Install Dependencies

In your terminal (while inside the ForFor folder), run:

```bash
npm install
```

This will download all the necessary code libraries. It might take a few minutes.

### Step 3: Set Up the Database

1. **Create a database** in PostgreSQL:
   - Open your PostgreSQL admin tool (pgAdmin or similar)
   - Create a new database called `forfor`
   
   OR use the command line:
   ```bash
   createdb forfor
   ```

2. **Create environment file**:
   - Make a copy of `.env.example` and name it `.env`
   - Open `.env` in a text editor
   - Update the `DATABASE_URL` with your PostgreSQL credentials:
   ```
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/forfor?schema=public"
   ```
   Replace `YOUR_PASSWORD` with the password you set during PostgreSQL installation

### Step 4: Initialize the Database

Run these commands one by one:

```bash
# Generate Prisma client
npm run db:generate

# Create database tables
npm run db:push

# Add sample data
npm run db:seed
```

You should see messages confirming that:
- Database tables were created
- Sample data was added (1 club, 4 products, 2 teams, sample customers, etc.)

---

## 🏃‍♂️ Running the Application

### Start the Development Server

In your terminal, run:

```bash
npm run dev
```

You should see a message like:
```
> Local: http://localhost:3000
```

### Open in Your Browser

1. Open your web browser (Chrome, Firefox, Safari, etc.)
2. Go to: http://localhost:3000
3. You should see the ForFor welcome page!

### Login Credentials

The seed data creates these users for testing:

**Admin Login** (Use any personnummer, like "199001011234"):
- Email: admin@exempel.se
- Go to: http://localhost:3000/logga-in/admin

**Team Member Login**:
- Email: emma@exempel.se (for Lag A)
- Email: erik@exempel.se (for Lag B)
- Go to: http://localhost:3000/logga-in/saljare

---

## 📱 Using the Application

### Admin Dashboard

After logging in as admin, you can:
- View sales statistics on the dashboard
- Manage teams and assign streets
- Add and edit products
- Create sales rounds (försäljningsperioder)
- View all orders and filter by status
- Manage customer database
- Print delivery lists organized by team and street

### Team Member Interface

After logging in as a team member (säljare), you can:
- View your assigned addresses
- Create new orders in 4 easy steps:
  1. Select an address
  2. Select or create a customer
  3. Choose products and quantities
  4. Review and confirm
- View your order history
- See sales statistics

---

## 🛠️ Common Tasks

### Adding New Products

1. Log in as admin
2. Go to "Produkter" in the sidebar
3. Click "Lägg till produkt"
4. Fill in name, description, price, and optional image URL
5. Save

### Creating a New Sales Round

1. Log in as admin
2. Go to "Säljrundor"
3. Click "Skapa ny säljrunda"
4. Set the sales period (start and end dates)
5. Set the delivery date
6. Save

### Importing Customers from Excel

**Note:** Excel import functionality is planned for a future update. The UI button exists but the backend implementation is pending due to security considerations with Excel parsing libraries.

For now, you can:
- Add customers manually through the admin interface
- Add customers during order creation (team member interface)
- Directly insert data into the database using Prisma Studio or SQL

When implemented, the feature will support:
1. Upload Excel file (.xlsx) with columns: Namn, Telefon, Epost, Gatuadress, Postnummer, Stad
2. Preview imported data
3. Map to existing streets/teams
4. Bulk import with validation

---

## 🚢 Deploying to Vercel

### Quick Deployment Steps

1. **Create a Vercel account** at https://vercel.com/signup

2. **Set up a production database**:
   - You can use Vercel Postgres, Supabase, or any PostgreSQL provider
   - Note the connection string

3. **Deploy to Vercel**:
   - Install Vercel CLI: `npm install -g vercel`
   - Run: `vercel`
   - Follow the prompts to link your project
   - Add environment variable: `DATABASE_URL` with your production database URL
   - Run: `vercel --prod` to deploy to production

4. **Initialize production database**:
   - After deployment, run migrations on production:
   ```bash
   npx prisma db push --preview-feature
   npx prisma db seed
   ```

Your ForFor app is now live! 🎉

---

## 🔧 Troubleshooting

### "Cannot connect to database"
- Check that PostgreSQL is running
- Verify your DATABASE_URL in `.env` is correct
- Make sure the database `forfor` exists

### "Port 3000 is already in use"
- Another application is using port 3000
- Stop that application or use a different port: `npm run dev -- -p 3001`

### "Module not found" errors
- Run `npm install` again
- Delete `node_modules` folder and `package-lock.json`, then run `npm install`

### Prisma errors
- Try: `npm run db:generate`
- Try: `npx prisma migrate reset` (warning: this deletes all data)

---

## 📚 Project Structure

```
forfor/
├── app/                    # Next.js app directory
│   ├── admin/             # Admin pages
│   ├── saljare/           # Team member pages
│   ├── api/               # API routes
│   └── logga-in/          # Login pages
├── components/            # Reusable UI components
│   ├── ui/               # shadcn/ui components
│   ├── admin/            # Admin-specific components
│   └── saljare/          # Team member components
├── lib/                  # Utility functions
│   ├── prisma.ts        # Database client
│   ├── auth.ts          # Authentication helpers
│   └── swish.ts         # Swish QR code generation
├── prisma/              # Database schema and seed
│   ├── schema.prisma    # Data models
│   └── seed.ts          # Sample data
└── public/              # Static assets
```

---

## 🆘 Getting Help

If you run into issues:

1. Check this README again carefully
2. Search for the error message online
3. Contact the development team
4. Open an issue on GitHub: https://github.com/Tschiffer46/ForFor/issues

---

## 📝 License

This project is created for Swedish sports clubs to manage their fundraising campaigns.

---

## 🙏 Acknowledgments

Built with:
- Next.js 14 (React framework)
- Prisma (Database ORM)
- Tailwind CSS (Styling)
- shadcn/ui (UI components)
- PostgreSQL (Database)

---

**Happy Selling! 🎯**
