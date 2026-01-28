# Email Search Troubleshooting Guide

## 🔍 Search is Now Email-Based

The employee search in the Offboarding form has been updated to search **primarily by email address**.

## ✅ What Changed

1. **Search Field**: Now labeled "Search Employee by Email"
2. **Input Type**: Changed to email input for better validation
3. **Placeholder**: Shows example email format
4. **Minimum Characters**: Requires 3 characters to start searching
5. **Search Logic**: Searches only in the email field (not name)
6. **Better Error Messages**: More specific error messages for troubleshooting

## 🧪 How to Test

### Step 1: Verify You Have Employee Data

1. Open your Google Sheet
2. Check the **Onboarding** tab
3. Make sure you have at least one employee record with an email address
4. Example data:
   ```
   Timestamp | First Name | Last Name | Email | Department | Job Title | ...
   2026-01-26 | John | Doe | john.doe@hunterdouglas.com | IT | Developer | ...
   ```

### Step 2: Test the Google Apps Script Directly

1. Copy your webhook URL (from the deployment)
2. Open a new browser tab
3. Paste this URL (replace with your actual webhook URL):
   ```
   YOUR_WEBHOOK_URL?action=searchEmployees&query=john
   ```
4. You should see JSON response like:
   ```json
   {
     "status": "success",
     "employees": [
       {
         "id": 1,
         "name": "John Doe",
         "firstName": "John",
         "lastName": "Doe",
         "email": "john.doe@hunterdouglas.com",
         "department": "IT",
         "title": "Developer"
       }
     ]
   }
   ```

### Step 3: Test in the Application

1. Open http://localhost:5173/
2. Click **Offboarding** in the navigation
3. In the "Search Employee by Email" field, type at least 3 characters from an email address
   - Example: Type "john" if you have john.doe@hunterdouglas.com
   - Example: Type "doe@" if you have john.doe@hunterdouglas.com
4. Wait 500ms (the search is debounced)
5. You should see:
   - **Loading**: "🔄 Searching employees..."
   - **Results**: Employee card with name, title, department, and email
   - **No Results**: "No employees found" with helpful hint

## 🐛 Common Issues & Solutions

### Issue 1: "Unable to connect to Google Sheets"

**Cause**: The webhook URL is incorrect or the Google Apps Script isn't deployed

**Solution**:
1. Check the webhook URL in `src/components/OffboardingForm.jsx` (line ~68)
2. Make sure it matches your deployed Web App URL
3. Verify the deployment is active in Google Apps Script

### Issue 2: Search returns no results

**Cause**: 
- Email doesn't exist in the Onboarding sheet
- Search query doesn't match email format
- Onboarding sheet is empty

**Solution**:
1. First, submit an onboarding form to create employee data
2. Make sure the email is spelled correctly
3. Try searching with just the first part of the email (before @)
4. Check the Onboarding sheet has data in the Email column (column D)

### Issue 3: "Failed to fetch employees from Google Sheets"

**Cause**: Google Apps Script returned an error

**Solution**:
1. Open Google Apps Script editor
2. Go to **Executions** (clock icon on left sidebar)
3. Check for error messages
4. Common fixes:
   - Re-deploy the Web App
   - Make sure "Execute as: Me" is selected
   - Make sure "Who has access: Anyone" is selected

### Issue 4: Search is too slow

**Cause**: Large dataset or network latency

**Solution**:
1. The search has a 500ms debounce - this is normal
2. If you have many employees, consider:
   - Adding pagination to the Google Apps Script
   - Limiting results to first 50 matches
   - Caching results in the frontend

## 📊 Debugging Steps

### Check Browser Console

1. Press **F12** to open Developer Tools
2. Go to **Console** tab
3. Type in the search box
4. Look for:
   ```
   Submitting to Google Sheets: {query: "john", ...}
   ```
5. Check for any red error messages

### Check Network Tab

1. Press **F12** to open Developer Tools
2. Go to **Network** tab
3. Type in the search box
4. Look for a request to your webhook URL
5. Click on it to see:
   - **Request URL**: Should be your webhook + query parameter
   - **Status**: Should be 200 OK
   - **Response**: Should show JSON with employees

### Test with Console Command

Open browser console (F12) and run:

```javascript
fetch('YOUR_WEBHOOK_URL?action=searchEmployees&query=john')
  .then(r => r.json())
  .then(data => console.log(data))
  .catch(err => console.error(err));
```

Replace `YOUR_WEBHOOK_URL` with your actual webhook URL.

## ✨ Expected Behavior

### When you type "john" (if john.doe@hunterdouglas.com exists):

1. **0-2 characters**: Shows hint "💡 Type at least 3 characters of the email address to search"
2. **3+ characters**: 
   - Shows "🔄 Searching employees..." for ~500ms
   - Then shows employee card with:
     - Avatar with initials (JD)
     - Full name (John Doe)
     - Title and Department (Developer • IT)
     - Email (john.doe@hunterdouglas.com)
3. **Click on employee**: 
   - Card is selected
   - Search box clears
   - Form sections appear below

### When no results found:

Shows message:
```
No employees found matching "xyz"
Make sure the employee has been onboarded first
```

## 🔧 Quick Fixes

### Reset Everything

If nothing works, try this:

1. **Clear browser cache**: Ctrl+Shift+Delete
2. **Restart dev server**: 
   ```bash
   # Stop the server (Ctrl+C)
   npm run dev
   ```
3. **Re-deploy Google Apps Script**:
   - Go to Deploy > Manage deployments
   - Click Edit (pencil icon)
   - Change version to "New version"
   - Click Deploy
4. **Update webhook URL** in both files if it changed

### Verify Webhook URL

The webhook URL should be in this format:
```
https://script.google.com/macros/s/[LONG_ID]/exec
```

It should be the same in:
- `src/components/OnboardingForm.jsx` (line ~126)
- `src/components/OffboardingForm.jsx` (line ~68)

## 📞 Still Not Working?

If you've tried everything above and it still doesn't work:

1. **Check the exact error message** in the browser console
2. **Copy the error** and the webhook URL
3. **Verify**:
   - ✅ Google Apps Script is deployed
   - ✅ Webhook URL is correct in the code
   - ✅ Onboarding sheet has employee data
   - ✅ Email column (column D) has valid email addresses
   - ✅ Dev server is running
   - ✅ No CORS errors (these are expected with Google Apps Script)

The search should work if:
- Google Apps Script is properly deployed
- Webhook URL is correct
- Onboarding sheet has data
- Email addresses are in column D (4th column)
