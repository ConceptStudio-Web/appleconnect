# Paynow Integration Setup Guide

## Overview

This guide will help you complete the Paynow payment integration for the Apple Connect website. The integration uses Google Apps Script as a secure backend proxy to handle Paynow API calls.

## Prerequisites

- [x] Paynow merchant account (you have this)
- [ ] Google account for Apps Script
- [ ] Integration ID and Integration Key from Paynow
- [ ] Google Sheet for transaction logging (optional but recommended)

## Step-by-Step Setup

### 1. Get Your Paynow Integration Keys

1. Log in to your Paynow merchant account at https://www.paynow.co.zw/
2. Navigate to **"Other Ways To Get Paid"**
3. Click **"Create/Manage Shopping Carts"**
4. Click **"Create Advanced Integration"**
5. Fill in the form:
   - **Name:** Apple Connect Website
   - **Notification URL:** Leave blank (we'll specify per transaction)
   - **Email for notifications:** Your business email
6. Click **Save**
7. You'll see your **Integration ID** on screen
8. Your **Integration Key** will be emailed to you (keep it secret!)

### 2. Create Google Sheet for Transaction Logging (Optional)

1. Go to https://sheets.google.com
2. Create a new spreadsheet named "Apple Connect - Paynow Transactions"
3. Copy the **Sheet ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID_HERE/edit
   ```
4. Keep this ID for the next step

### 3. Deploy Google Apps Script Backend

1. Go to https://script.google.com
2. Click **"New Project"**
3. Name it "Apple Connect - Paynow Backend"
4. Delete the default `function myFunction()` code
5. Copy the entire contents of `paynow-backend.gs` from this project
6. Paste it into the Apps Script editor
7. **Update the configuration** at the top of the file:
   ```javascript
   const CONFIG = {
     PAYNOW_INTEGRATION_ID: 'YOUR_INTEGRATION_ID_HERE',  // From step 1
     PAYNOW_INTEGRATION_KEY: 'YOUR_INTEGRATION_KEY_HERE',  // From step 1 email
     RESULT_URL: '',  // Will update after deployment
     RETURN_URL: 'https://yourdomain.com',  // Your website URL
     SHEET_ID: 'YOUR_GOOGLE_SHEET_ID_HERE',  // From step 2 (or leave blank)
     SHEET_NAME: 'Paynow Transactions',
     API_TOKEN: 'AppleConnect2024',  // Change to your own random string
   };
   ```
8. Click **Deploy** > **New deployment**
9. Click **gear icon** > **Web app**
10. Configure:
    - **Description:** Paynow Payment Gateway
    - **Execute as:** Me
    - **Who has access:** Anyone
11. Click **Deploy**
12. Copy the **Web App URL** (it will look like `https://script.google.com/macros/s/.../exec`)
13. Go back to the script editor and update `RESULT_URL`:
    ```javascript
    RESULT_URL: 'YOUR_WEB_APP_URL?action=result',
    ```
14. **Deploy again** as a new version

### 4. Update Frontend Configuration

1. Open `assets/js/app.js`
2. Find the `PAYNOW_CONFIG` section (around line 16)
3. Update the `apiUrl`:
   ```javascript
   const PAYNOW_CONFIG = {
     apiUrl: 'YOUR_WEB_APP_URL_FROM_STEP_3',  // The URL you copied
     apiToken: 'AppleConnect2024',  // Must match your backend
     enabled: true
   };
   ```
4. Save the file

### 5. Test the Integration

#### Test Mode (Recommended First)

1. Start your local server:
   ```
   python -m http.server 8000
   ```
2. Open http://localhost:8000
3. Add products to cart
4. Go through checkout and select **"Paynow"**
5. Complete the payment using Paynow test environment

#### Important Notes:
- For testing, Paynow provides test credentials
- Use small amounts (e.g., $0.01) for testing
- Check your Google Sheet to verify transactions are being logged

### 6. Go Live

Once testing is complete:

1. Switch Paynow to production mode in your merchant account
2. Replace test Integration ID/Key with production credentials in Apps Script
3. Deploy your website to production
4. Update `RETURN_URL` in Apps Script to your live domain
5. Test with a real small transaction

## Troubleshooting

### Payment initialization fails
- Check that `PAYNOW_CONFIG.apiUrl` is correct
- Verify `API_TOKEN` matches between frontend and backend
- Check browser console for errors

### Payment window doesn't open
- Ensure popup blocker is disabled
- Check that `result.redirectUrl` is being returned from backend

### Payment not completing
- Check Google Apps Script logs (View > Logs)
- Verify Paynow credentials are correct
- Check that poll URL is accessible

### Transactions not logging
- Verify Google Sheet ID is correct
- Check that Apps Script has permission to access the sheet
- Look at Apps Script execution logs

## Security Notes

- **Never commit** your Integration Key to Git
- Keep the `API_TOKEN` secret
- The Integration Key should only exist in Apps Script (server-side)
- Consider adding additional security like domain restrictions

## Support

If you encounter issues:
1. Check Google Apps Script logs
2. Review browser console for errors
3. Test with Paynow's test environment first
4. Contact Paynow support for API-related issues

## Files Modified

- `assets/js/app.js` - Added Paynow payment handler
- `paynow-backend.gs` - Google Apps Script backend (not part of git repo)

## Next Steps

After successful setup:
- Monitor transactions in your Google Sheet
- Set up email notifications for successful payments
- Consider adding order confirmation emails
- Implement refund handling if needed
