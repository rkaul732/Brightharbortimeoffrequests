# Bright Harbor Time Off Requests

Bright Harbor Time Off Requests is a small internal website with two sides:

- Employees submit time off requests.
- Admins sign in, view every request, and mark the approval type as `in_review`, `approved`, or `denied`.
- Staff create their own employee accounts using a company email ending in `@brightharbor.org`.

The time off type choices are **Vacation**, **Sick**, **Personal**, and **Unpaid**.

After an employee signs in, they can update their profile settings: name, pronouns, program, and manager. Employees can only see their own time off requests.

The program choices are:

- Access
- ISC
- Outpatient
- Front Desk Professionals
- SOS
- Shore Haven
- Recovery
- Nursing Case Management
- On Point/Arrive Together
- ICM Blue

After an admin signs in, they land on a welcome page with three main areas: **New Requests**, **Team Schedule**, and **Reports**. New Requests has tabs for new requests since last sign on, still-pending requests, and completed requests split into **Approved** and **Denied** columns. Team Schedule has tabs for work week, month view, and by employee. Reports has three downloadable spreadsheet files: **By Employee**, **By Program**, and **Request Detail**.

The admin side also shows a red flag next to an employee's name when the site detects a request pattern, such as 3 or more requests touching the same weekday within a 6-week period.

This guide assumes you are brand new to GitHub, Supabase, Resend, and Netlify.

## The Four Platforms

This project uses four services:

- **GitHub** stores the website files online and tracks changes.
- **Supabase** stores the time off request data and handles employee and admin sign-in.
- **Resend** sends email notifications.
- **Netlify** publishes the website and runs the private server functions.

The website can run locally in demo mode without platform accounts, but real request storage, employee login, admin login, and emails need the platform setup below.

## What You Need Before Starting

Create accounts for:

- GitHub: https://github.com
- Supabase: https://supabase.com
- Resend: https://resend.com
- Netlify: https://netlify.com

You will also need:

- Access to this project folder on your computer.
- A domain or subdomain for sending email through Resend, such as `brightharbor.com` or `mail.brightharbor.com`.
- Access to your domain's DNS settings. DNS is usually managed wherever the domain was purchased.

## Important Security Notes

Never paste passwords or API keys directly into GitHub files.

Use environment variables for secrets. This project includes `.env.example` only as a template. A real `.env` file is ignored by Git and should stay private on your computer.

Supabase currently recommends publishable and secret keys. Older Supabase projects may still show `anon` and `service_role` keys. This app supports both naming styles, but new setups should use:

- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`

The secret key must only be used in Netlify Functions or another trusted server environment. Do not put it in browser JavaScript.

## Step 1: Preview The Site On Your Computer

This step lets you see the site before creating any accounts.

1. Open a terminal.
2. Go to this project folder.
3. Run:

```bash
npm run serve
```

4. Look at the message that appears in Terminal.
5. Open the URL it prints.

It will usually be:

```text
http://127.0.0.1:8081/
```

If that port is already busy, the command will automatically try the next port, such as `8082` or `8083`. Use the exact URL printed in Terminal.

6. On the employee side, click **Create Account**.
7. Use an email ending in:

```text
@brightharbor.org
```

8. Create any test password with at least 8 characters.
9. Complete the profile fields and create the account.
10. Try the employee request form.
11. Sign out and create a second employee account if you want to confirm employees only see their own requests.
12. Click **Admin** in the top navigation.
13. In demo mode, enter any email and any password to see the admin dashboard.

Demo mode stores sample data in your browser only. It does not use Supabase or Resend.

To stop the local server, return to the terminal and press `Control + C`.

## Step 2: Create The GitHub Repository

GitHub is where the project files will live online. Netlify will connect to this repository later.

### Option A: Use GitHub Desktop

This is the friendliest option if you are new to Git.

1. Install GitHub Desktop from https://desktop.github.com.
2. Open GitHub Desktop.
3. Sign in with your GitHub account.
4. Choose **File > Add Local Repository**.
5. Select this folder:

```text
/Users/rebeccakaul/Documents/Time Off Requests
```

6. If GitHub Desktop asks whether to create a repository here, say yes.
7. In the left sidebar, make sure the repository is selected.
8. You should see a list of changed files.
9. In the **Summary** box, type:

```text
Create Bright Harbor time off site
```

10. Click **Commit to main**.
11. Click **Publish repository**.
12. Choose a repository name, for example:

```text
bright-harbor-time-off-requests
```

13. Keep it **Private** unless you intentionally want the code public.
14. Click **Publish Repository**.

### Option B: Use The Command Line

Use this option if you are comfortable copying commands into Terminal.

1. Create a new empty repository on GitHub.
2. Do not add a README, `.gitignore`, or license on GitHub because this project already has those files.
3. In your terminal, go to this project folder.
4. Run:

```bash
git add .
git commit -m "Create Bright Harbor time off site"
git remote add origin https://github.com/YOUR-USERNAME/bright-harbor-time-off-requests.git
git push -u origin main
```

Replace `YOUR-USERNAME` with your GitHub username.

If GitHub asks you to sign in, follow the prompt in your browser.

## Step 3: Create The Supabase Project

Supabase stores every time off request and handles admin login.

1. Go to https://supabase.com/dashboard.
2. Sign in.
3. Click **New project**.
4. Choose your organization. If you are new, you may only have one.
5. Enter a project name:

```text
Bright Harbor Time Off Requests
```

6. Create a strong database password.
7. Save that database password somewhere secure.
8. Choose a region close to your users.
9. Click **Create new project**.
10. Wait for Supabase to finish creating the project.

## Step 4: Create The Supabase Tables

This creates the database tables where employee profiles, requests, and admin sign-ins are stored.

1. In Supabase, open your new project.
2. In the left sidebar, click **SQL Editor**.
3. Click **New query**.
4. Open the project file `supabase/schema.sql`.
5. Copy the full contents of that file.
6. Paste the SQL into the Supabase SQL editor.
7. Click **Run**.

You should see a success message.

If you already ran an older version of this setup file, you can still run the current file again. It will add the employee profile table, the employee account link on requests, and any report columns without deleting existing requests.

To double-check:

1. In the left sidebar, click **Table Editor**.
2. Look for a table named `time_off_requests`.
3. Open it. It should have columns such as `employee_user_id`, `first_name`, `last_name`, `email`, `department`, `program`, `start_date`, `end_date`, and `status`.
4. Look for a table named `employee_profiles`. This stores each employee's name, pronouns, program, and manager.
5. Also look for a table named `admin_sign_ins`. This stores admin sign-in times so the site can show requests submitted since the admin last signed on.

It is okay if all three tables are empty.

## Step 5: Create Admin Users In Supabase

Employees do not need to be added manually in Supabase. Employees create their own accounts from the website with an email address ending in `@brightharbor.org`.

Admins are different. Admins must exist in Supabase Authentication and must also be listed in the `ADMIN_EMAILS` environment variable.

Only emails listed in `ADMIN_EMAILS` will be allowed into the admin side.

1. In Supabase, open your project.
2. In the left sidebar, click **Authentication**.
3. Click **Users**.
4. Click **Add user**.
5. Choose **Send invitation**.
6. Enter the admin's email address.
7. Click **Invite user**.
8. Ask the admin to open the invitation email and finish setting up their password.

Repeat this for every admin who should approve or deny time off requests.

Write down the exact admin email addresses. You will need them for Netlify later.

Example:

```text
hr@brightharbor.org,manager@brightharbor.org
```

### Check Email Password Sign-In

The employee account form uses email and password sign-in.

1. In Supabase, open your project.
2. In the left sidebar, click **Authentication**.
3. Click **Providers**.
4. Find **Email**.
5. Make sure Email sign-in is enabled.

Employees will set their own password on the website when they create an account. The website will stop the account creation if the email does not end in `@brightharbor.org`.

## Step 6: Copy Supabase Values For Netlify

Netlify needs three Supabase values.

1. In Supabase, open your project.
2. Find your project URL:
   - Open the project's **Connect** dialog, or go to **Project Settings > API Keys**.
   - Copy the project URL.
   - It usually looks like this:

```text
https://abcdefghijk.supabase.co
```

3. Find your publishable key:
   - In **Project Settings > API Keys**, copy a publishable key.
   - It may begin with `sb_publishable_`.
   - If your project only shows an older `anon` key, you may use that instead.

4. Find your secret key:
   - In **Project Settings > API Keys**, copy a secret key.
   - It may begin with `sb_secret_`.
   - If your project only shows an older `service_role` key, you may use that instead.

Keep these values private.

## Step 7: Set Up Resend

Resend sends two kinds of emails:

- A new-request email to the admin notification inbox.
- A decision email to the employee when an admin approves or denies the request.

### Add And Verify Your Domain

1. Go to https://resend.com/domains.
2. Sign in.
3. Click **Add Domain**.
4. Enter the domain or subdomain you want to send from.

Good examples:

```text
brightharbor.com
mail.brightharbor.com
```

5. Resend will show DNS records to add.
6. Open your DNS provider in another browser tab.
7. Add the DNS records exactly as Resend shows them.
8. Return to Resend.
9. Click the option to verify or check the domain.

DNS can take time. If verification does not work immediately, wait a bit and try again.

### Create A Resend API Key

1. In Resend, go to **API Keys**.
2. Click **Create API Key**.
3. Name it:

```text
Bright Harbor Time Off Requests
```

4. Choose **Sending access** if Resend lets you restrict the key to your verified sending domain.
5. Otherwise choose **Full access**.
6. Click **Create**.
7. Copy the API key immediately.

Resend only shows the API key once. Store it somewhere secure.

### Choose The Sending Address

After the domain is verified, choose the email address the app should send from.

Example:

```text
Bright Harbor Time Off <timeoff@brightharbor.org>
```

The part after `@` must be a domain you verified in Resend.

## Step 8: Create The Netlify Site

Netlify publishes the website and runs the server functions that talk to Supabase and Resend.

1. Go to https://app.netlify.com.
2. Sign in.
3. Click **Add new project**.
4. Choose **Import an existing project**.
5. Choose **GitHub** as the Git provider.
6. Authorize Netlify to access GitHub if it asks.
7. Select the GitHub repository you created for this project.
8. Confirm the build settings.

Use these settings:

```text
Build command: npm run check
Publish directory: public
Functions directory: netlify/functions
```

This project also includes `netlify.toml`, so Netlify may fill these in automatically.

9. Do not deploy yet if Netlify gives you a chance to add environment variables first.

## Step 9: Add Environment Variables In Netlify

Environment variables are private settings Netlify gives to the site and functions.

1. In Netlify, open the site you just created.
2. Go to **Project configuration**.
3. Go to **Environment variables**.
4. Click **Add variable**.
5. Add each variable below.

Use these variable names for a new Supabase setup:

```text
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY
RESEND_API_KEY
RESEND_FROM_EMAIL
ADMIN_NOTIFY_EMAIL
ADMIN_EMAILS
```

Example values:

```text
SUPABASE_URL=https://abcdefghijk.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key_here
SUPABASE_SECRET_KEY=sb_secret_your_key_here
RESEND_API_KEY=re_your_key_here
RESEND_FROM_EMAIL=Bright Harbor Time Off <timeoff@brightharbor.org>
ADMIN_NOTIFY_EMAIL=hr@brightharbor.org
ADMIN_EMAILS=hr@brightharbor.org,manager@brightharbor.org
```

If your Supabase project only shows older key names, use these names instead:

```text
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

You still need `SUPABASE_URL`.

Make sure the environment variables are available to **Functions**. On most Netlify accounts, variables apply broadly by default. If Netlify shows scope options, include **Functions**.

## Step 10: Deploy The Site On Netlify

1. In Netlify, open your site.
2. Go to **Deploys**.
3. Click **Trigger deploy**.
4. Choose **Deploy site**.
5. Wait for the deploy to finish.

When the deploy succeeds, Netlify will give you a live URL.

It may look like this:

```text
https://bright-harbor-time-off-requests.netlify.app
```

Open that URL in your browser.

### Sharing A Review Link

A Netlify URL works on other people's computers. A local URL like `http://127.0.0.1:8081/` only works on your own computer.

You can share the Netlify URL in two ways:

- **Demo review link:** reviewers can open the site and try the screens. Each person's browser stores its own demo data. This is good for reviewing layout and workflow before real accounts are connected.
- **Fully connected production link:** reviewers use real employee/admin accounts, requests are saved in Supabase, and emails send through Resend. This requires the Supabase and Resend environment variables in Netlify.

For a review link that should behave like the final production site, finish Steps 3 through 9 before sharing the Netlify URL.

## Step 11: Test The Live Website

Use this checklist after the first Netlify deploy.

1. Open the live Netlify URL.
2. On the employee side, click **Create Account**.
3. Enter a test employee email ending in `@brightharbor.org`.
4. Enter a password with at least 8 characters.
5. Complete the profile fields.
6. Create the account.
7. Submit a test time off request.
8. Confirm the form says the request was submitted.
9. Check the inbox listed in `ADMIN_NOTIFY_EMAIL`.
10. You should receive a new-request email.
11. Sign out of the employee account.
12. Optional privacy check: create or sign into a different employee account and confirm the first employee's request does not appear in that employee's queue.
13. Go back to the website.
14. Click **Admin**.
15. Sign in with a Supabase admin email and password.
16. Confirm the test request appears in **New Requests**.
17. Change the approval type to **Approved**.
18. Click **Save**.
19. Confirm the employee email receives the approval message.
20. Open **Team Schedule**.
21. Test **Work Week**, **Month View**, and **By Employee**.
22. Open **Reports**.
23. Download the **By Employee**, **By Program**, and **Request Detail** CSV files.

## Step 12: Customize The Netlify Site Name

Netlify gives every site a generated name at first. You can rename it.

1. In Netlify, open your site.
2. Go to **Project configuration**.
3. Go to **General**.
4. Find the site name setting.
5. Change it to something like:

```text
bright-harbor-time-off-requests
```

6. Save the change.

Your Netlify URL will become:

```text
https://bright-harbor-time-off-requests.netlify.app
```

If that name is already taken, choose a close variation.

## Step 13: Understand The Reports

Admins can open **Reports** after signing in, choose a **Date Range**, and download three CSV files. A CSV file is a spreadsheet file. You can open it in Excel, Numbers, or Google Sheets.

Reports also include pattern flag columns. A pattern flag appears when an employee has 3 or more requests that touch the same weekday within any 6-week period. The pattern check uses the full request history, not only the selected report date range.

The report date range is inclusive. That means the start date and end date both count.

Reports count activity this way:

- Requests are counted by the date they were submitted.
- Approvals are counted by the date the admin approved the request.
- Denials are counted by the date the admin denied the request.
- Unanswered pending requests are counted by the date they were submitted, as long as they are still pending.

### By Employee

This report includes one row for every employee who has submitted at least one time off request.

Columns included:

- Employee name
- Pattern flag
- Pattern details
- Email
- Program or programs
- Requests submitted
- Approved during date range
- Denied during date range
- Unanswered pending requests
- Average request lead time, in days

**Average request lead time** means the average number of days between the date the employee submitted the request and the first requested day off. In date-ranged reports, this average is based on requests submitted inside the selected date range.

### By Program

This report groups requests by program.

Columns included:

- Program
- Employees with pattern flags
- Number of employees
- Requests submitted
- Approved during date range
- Denied during date range
- Unanswered pending requests
- Average request lead time, in days

### Request Detail

This report includes one row for every request with activity inside the selected date range. Use it when you want to see the full history behind the grouped totals.

## Step 14: Add A Custom Domain, Optional

Use this only if you want a branded URL like `timeoff.brightharbor.com`.

1. In Netlify, open your site.
2. Go to **Domain management**.
3. Add your custom domain.
4. Follow Netlify's DNS instructions.
5. Wait for Netlify to verify the domain.
6. After the domain works, use the custom domain as the main site URL.

If you use Supabase invitation emails, also update the allowed redirect or site URL settings in Supabase Auth so admin invite links can return to the correct website.

## Step 15: Make Future Changes

After the site is connected to GitHub and Netlify:

1. Make changes in this project folder.
2. Preview them locally with:

```bash
npm run serve
```

Use the exact URL printed in Terminal.

3. Validate the JavaScript with:

```bash
npm run check
```

4. Commit the changes in GitHub Desktop or with Git.
5. Push the changes to GitHub.
6. Netlify will automatically build and deploy the new version.

## Environment Variable Reference

| Variable | Required | Where to get it | What it does |
| --- | --- | --- | --- |
| `SUPABASE_URL` | Yes | Supabase project settings | Tells the app which Supabase project to use. |
| `SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase API keys | Lets Netlify verify employee and admin login sessions. |
| `SUPABASE_SECRET_KEY` | Yes | Supabase API keys | Lets Netlify Functions create employee accounts and update request records securely. |
| `SUPABASE_ANON_KEY` | Only for older Supabase projects | Supabase API keys | Older fallback for `SUPABASE_PUBLISHABLE_KEY`. |
| `SUPABASE_SERVICE_ROLE_KEY` | Only for older Supabase projects | Supabase API keys | Older fallback for `SUPABASE_SECRET_KEY`. |
| `RESEND_API_KEY` | Yes for email | Resend API keys | Lets the app send email notifications. |
| `RESEND_FROM_EMAIL` | Yes for email | Your verified Resend domain | The sender shown on emails. |
| `ADMIN_NOTIFY_EMAIL` | Yes for admin alerts | Your preferred inbox | Receives new-request notifications. |
| `ADMIN_EMAILS` | Yes | Your admin list | Controls who can sign in to the admin dashboard. |

## Troubleshooting

### The Site Still Uses Demo Data

This means Netlify Functions are not reporting a complete Supabase setup.

Check that Netlify has:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`

Then trigger a fresh deploy. Netlify applies environment variable changes to new deploys.

### Terminal Says Address Already In Use

This means a preview server is already running on that port. The site may already be open in your browser.

Run:

```bash
npm run serve
```

The current version of this project automatically tries another port and prints the exact URL to open.

If you still see the old Python error, make sure you saved the newest `package.json` file and run:

```bash
cd "/Users/rebeccakaul/Documents/Time Off Requests"
npm run serve
```

### Admin Login Fails

Check these items:

- The admin user exists in Supabase Authentication.
- The admin accepted the invitation and set a password.
- The admin email is included in `ADMIN_EMAILS`.
- The email in `ADMIN_EMAILS` has no accidental spaces or spelling differences.
- The site was redeployed after changing environment variables.

### Employee Account Creation Fails

Check these items:

- The employee email ends in `@brightharbor.org`.
- The password is at least 8 characters long.
- The employee completed first name, last name, program, and manager.
- You ran the current `supabase/schema.sql` file after this employee-account update.
- Supabase Email sign-in is enabled under **Authentication > Providers**.
- `SUPABASE_SECRET_KEY` is set in Netlify so the site can create employee accounts.

### Requests Do Not Save

Check these items:

- The `time_off_requests` table exists in Supabase.
- You ran the full `supabase/schema.sql` file.
- `SUPABASE_SECRET_KEY` is set in Netlify.
- The Netlify deploy logs do not show a function error.

### Emails Do Not Send

Check these items:

- The Resend domain is verified.
- `RESEND_API_KEY` is set in Netlify.
- `RESEND_FROM_EMAIL` uses the verified domain.
- `ADMIN_NOTIFY_EMAIL` is set.
- You tested with a real email address.

If Resend says you can only send test emails to yourself, finish verifying a sending domain.

### Netlify Build Fails

Check the deploy log in Netlify.

The expected settings are:

```text
Build command: npm run check
Publish directory: public
Functions directory: netlify/functions
```

You can also run this locally:

```bash
npm run check
```

If it passes locally but fails on Netlify, check that Netlify is using Node 20 or newer.

## Helpful Official Docs

- GitHub repository setup: https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-new-repository
- GitHub command-line upload: https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github
- Supabase API keys: https://supabase.com/docs/guides/getting-started/api-keys
- Supabase users and invitations: https://supabase.com/docs/guides/auth/users
- Supabase SQL editor workflow: https://supabase.com/docs/guides/database/functions
- Resend domains: https://resend.com/docs/dashboard/domains/introduction
- Resend API keys: https://resend.com/docs/dashboard/api-keys/introduction
- Netlify new projects: https://docs.netlify.com/manage/projects/add-new-project/
- Netlify build settings: https://docs.netlify.com/build/configure-builds/overview/
- Netlify function environment variables: https://docs.netlify.com/build/functions/environment-variables/
