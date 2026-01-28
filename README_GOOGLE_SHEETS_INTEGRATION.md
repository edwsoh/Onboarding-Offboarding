# Google Sheets Integration Guide

## Overview
This guide explains how to integrate your Hunter Douglas Employee Portal with Google Sheets to:
1. **Store form submissions** (Onboarding and Offboarding data)
2. **Search employee records** in the Offboarding form

## 🎯 Features

### ✅ What's Already Integrated
- **Onboarding Form**: Submits all employee data to Google Sheets
- **Offboarding Form**: Submits offboarding requests to Google Sheets
- **Employee Search**: Searches onboarded employees from Google Sheets in real-time

### 📊 Data Flow
```
Onboarding Form → Google Sheets (Onboarding tab)
                     ↓
              Employee Records
                     ↓
Offboarding Form ← Search Employees ← Google Sheets (Onboarding tab)
       ↓
Google Sheets (Offboarding tab)
```

## 🚀 Setup Instructions

### Step 1: Update Your Google Apps Script

1. **Open your Google Sheet** where you want to store the data
2. Go to **Extensions > Apps Script**
3. **Delete any existing code** in the editor
4. **Copy and paste** the complete script from `GOOGLE_APPS_SCRIPT_INSTRUCTIONS.md`
5. Click **Save** (💾 disk icon)

### Step 2: Deploy the Web App

1. In the Apps Script editor, click **Deploy > New deployment**
2. Click the **gear icon** ⚙️ next to "Select type"
3. Choose **Web app**
4. Configure the deployment:
   - **Description**: "Employee Portal API v1"
   - **Execute as**: **Me** (your email)
   - **Who has access**: **Anyone**
5. Click **Deploy**
6. **Authorize access**:
   - Click **Authorize access**
   - Select your Google account
   - Click **Advanced** → **Go to [Your Project Name] (unsafe)**
   - Click **Allow**
7. **Copy the Web app URL** (it should look like the one you provided)

### Step 3: Verify the Webhook URL

The webhook URL in your application is currently set to:
```
https://script.google.com/macros/s/AKfycbycAepzas1nrNReDAMkHSUR3wv45KXay-cFWVfTMu7f0z2UQnpPJyn5qVE7pXfWPxpmhQ/exec
```

If you deployed a new script, you'll need to update this URL in two files:
- `src/components/OnboardingForm.jsx` (line ~126)
- `src/components/OffboardingForm.jsx` (line ~68)

### Step 4: Test the Integration

#### Test Onboarding Submission
1. Open your local website: http://localhost:5173/
2. Click **"New Onboarding"**
3. Fill out the form with test data
4. Click **"Submit Onboarding Request"**
5. Check your Google Sheet - a new row should appear in the **Onboarding** tab

#### Test Employee Search
1. Make sure you have at least one employee in the Onboarding sheet
2. Go to the **Offboarding** page
3. Type at least 2 characters in the **"Search Employee"** field
4. You should see matching employees from your Google Sheet

#### Test Offboarding Submission
1. Select an employee from the search results
2. Fill out the offboarding form
3. Click **"Submit Offboarding Request"**
4. Check your Google Sheet - a new row should appear in the **Offboarding** tab

## 📋 Google Sheets Structure

### Onboarding Sheet Columns
| Column | Description |
|--------|-------------|
| Timestamp | When the form was submitted |
| First Name | Employee's first name |
| Last Name | Employee's last name |
| Email | Work email address |
| Department | Department name |
| Job Title | Position title |
| Manager | Reporting manager's name |
| Start Date | Employment start date |
| Employee Type | Full-Time, Part-Time, Contractor, or Intern |
| Work Location | Office location or Remote |
| Licenses | Selected M365 licenses (comma-separated) |
| Permissions | Selected D365 permissions (comma-separated) |
| Notes | Additional notes |

### Offboarding Sheet Columns
| Column | Description |
|--------|-------------|
| Timestamp | When the form was submitted |
| Employee Name | Full name of employee being offboarded |
| Email | Employee's email |
| Department | Employee's department |
| Title | Employee's job title |
| Last Working Day | Final day of employment |
| Reason | Reason for leaving |
| Forward Email To | Email forwarding address |
| Licenses Revoked | M365 licenses to revoke |
| Permissions Removed | D365 permissions to remove |
| Equipment Returned | Equipment checklist items |
| Revoke VPN | Yes/No |
| Revoke Building | Yes/No |
| Archive Mailbox | Yes/No |
| Notes | Additional notes |

## 🔧 Troubleshooting

### Employee Search Not Working

**Problem**: Search returns no results or shows an error

**Solutions**:
1. **Check the webhook URL**: Make sure it's correctly set in `OffboardingForm.jsx`
2. **Verify Google Apps Script deployment**: 
   - Open Apps Script editor
   - Go to **Deploy > Manage deployments**
   - Make sure the deployment is active
3. **Check CORS settings**: The script uses `mode: 'no-cors'` which is required for Google Apps Script
4. **Test the GET endpoint directly**: 
   - Open this URL in your browser: `YOUR_WEBHOOK_URL?action=getEmployees`
   - You should see JSON data with your employees
5. **Check the Onboarding sheet**: Make sure you have at least one employee record

### Form Submission Not Saving

**Problem**: Form submits but data doesn't appear in Google Sheets

**Solutions**:
1. **Check the browser console**: 
   - Press F12 to open Developer Tools
   - Look for errors in the Console tab
2. **Verify the webhook URL**: Make sure it matches your deployed script URL
3. **Check Apps Script permissions**: 
   - Go to Apps Script editor
   - Click on the trigger icon (⏰)
   - Make sure you've authorized the script
4. **Test the POST endpoint**: Check the browser console for the submission data

### CORS Errors

**Problem**: Browser shows CORS-related errors

**Solution**: This is expected with Google Apps Script. The code uses `mode: 'no-cors'` which prevents reading the response but allows the request to go through. As long as data appears in your Google Sheet, the integration is working correctly.

## 🎨 Customization

### Changing the Search Behavior

By default, the search requires at least 2 characters and has a 500ms debounce. To modify:

In `OffboardingForm.jsx`, find the `useEffect` hook (around line 71):

```javascript
// Change minimum search length
if (searchTerm.length < 2) {  // Change this number
    setEmployees([]);
    return;
}

// Change debounce delay
const timeoutId = setTimeout(() => {
    fetchEmployees();
}, 500);  // Change this number (in milliseconds)
```

### Adding More Fields

To add custom fields to your forms:

1. **Update the form UI** in `OnboardingForm.jsx` or `OffboardingForm.jsx`
2. **Add the field to formData** state
3. **Include it in submissionData** object in the `handleSubmit` function
4. **Update Google Apps Script** to handle the new field
5. **Add the column** to your Google Sheet

## 📝 Notes

- **Data Privacy**: Make sure your Google Sheet permissions are set appropriately
- **Backup**: Regularly backup your Google Sheet data
- **Performance**: The search is debounced to avoid excessive API calls
- **Limitations**: Google Apps Script has quotas (see [Google's documentation](https://developers.google.com/apps-script/guides/services/quotas))

## 🆘 Support

If you encounter issues:
1. Check the browser console for errors (F12)
2. Review the Google Apps Script execution logs
3. Verify all URLs and configurations match
4. Test each component individually (POST, GET, Search)

## ✨ Success Indicators

You'll know everything is working when:
- ✅ Onboarding submissions appear in the Onboarding sheet
- ✅ Employee search shows results from the Onboarding sheet
- ✅ Offboarding submissions appear in the Offboarding sheet
- ✅ No errors in the browser console
- ✅ Loading states and success messages display correctly
