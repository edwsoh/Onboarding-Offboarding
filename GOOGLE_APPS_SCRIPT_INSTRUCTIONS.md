# Google Apps Script Setup Instructions

## Overview
This document contains the Google Apps Script code you need to add to your Google Sheet to enable both storing form submissions and retrieving employee records for the offboarding search feature.

## Script Code

Replace your existing Google Apps Script with this complete code:

```javascript
// Google Apps Script for Hunter Douglas Employee Portal
// This script handles both POST (form submissions) and GET (employee search) requests

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet();
    const data = JSON.parse(e.postData.contents);
    
    // Determine which sheet to use based on form type
    let targetSheet;
    if (data.formType === 'Onboarding') {
      targetSheet = sheet.getSheetByName('Onboarding') || sheet.insertSheet('Onboarding');
      
      // Add headers if this is a new sheet
      if (targetSheet.getLastRow() === 0) {
        targetSheet.appendRow([
          'Timestamp', 'First Name', 'Last Name', 'Email', 'Department', 
          'Job Title', 'Manager', 'Start Date', 'Employee Type', 
          'Work Location', 'Licenses', 'Permissions', 'Notes'
        ]);
      }
      
      // Add the onboarding data
      targetSheet.appendRow([
        data.timestamp,
        data.firstName,
        data.lastName,
        data.email,
        data.department,
        data.jobTitle,
        data.manager,
        data.startDate,
        data.employeeType,
        data.workLocation,
        data.licenses,
        data.permissions,
        data.notes
      ]);
      
    } else if (data.formType === 'Offboarding') {
      targetSheet = sheet.getSheetByName('Offboarding') || sheet.insertSheet('Offboarding');
      
      // Add headers if this is a new sheet
      if (targetSheet.getLastRow() === 0) {
        targetSheet.appendRow([
          'Timestamp', 'Employee Name', 'Email', 'Department', 'Title',
          'Last Working Day', 'Reason', 'Forward Email To', 
          'Licenses Revoked', 'Permissions Removed', 'Equipment Returned',
          'Revoke VPN', 'Revoke Building', 'Archive Mailbox', 'Notes'
        ]);
      }
      
      // Add the offboarding data
      targetSheet.appendRow([
        data.timestamp,
        data.employeeName,
        data.employeeEmail,
        data.employeeDepartment,
        data.employeeTitle,
        data.lastWorkingDay,
        data.offboardingReason,
        data.forwardEmailTo,
        data.licensesToRevoke,
        data.permissionsToRemove,
        data.equipmentToReturn,
        data.revokeVPN,
        data.revokeBuilding,
        data.archiveMailbox,
        data.notes
      ]);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Data saved successfully'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet();
    const action = e.parameter.action;
    
    // Handle employee search for offboarding
    if (action === 'getEmployees') {
      // Get data from Onboarding sheet (active employees)
      const onboardingSheet = sheet.getSheetByName('Onboarding');
      
      if (!onboardingSheet) {
        return ContentService.createTextOutput(JSON.stringify({
          status: 'success',
          employees: []
        })).setMimeType(ContentService.MimeType.JSON);
      }
      
      const data = onboardingSheet.getDataRange().getValues();
      const headers = data[0];
      const employees = [];
      
      // Skip header row, process data rows
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        employees.push({
          id: i,
          name: row[1] + ' ' + row[2], // First Name + Last Name
          firstName: row[1],
          lastName: row[2],
          email: row[3],
          department: row[4],
          title: row[5]
        });
      }
      
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        employees: employees
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Handle search query - prioritize email search
    if (action === 'searchEmployees') {
      const query = (e.parameter.query || '').toLowerCase().trim();
      const onboardingSheet = sheet.getSheetByName('Onboarding');
      
      if (!onboardingSheet) {
        return ContentService.createTextOutput(JSON.stringify({
          status: 'success',
          employees: []
        })).setMimeType(ContentService.MimeType.JSON);
      }
      
      const data = onboardingSheet.getDataRange().getValues();
      const employees = [];
      
      // Skip header row, process data rows
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const name = row[1] + ' ' + row[2];
        const email = (row[3] || '').toString().toLowerCase();
        
        // Prioritize email search - search primarily in email field
        if (query === '' || email.includes(query)) {
          employees.push({
            id: i,
            name: name,
            firstName: row[1],
            lastName: row[2],
            email: row[3],
            department: row[4],
            title: row[5]
          });
        }
      }
      
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        employees: employees
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Invalid action'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

## Setup Steps

1. **Open your Google Sheet** where you want to store the data
2. Go to **Extensions > Apps Script**
3. **Delete any existing code** in the editor
4. **Paste the complete script above**
5. Click **Save** (disk icon)
6. Click **Deploy > New deployment**
7. Click the gear icon ⚙️ next to "Select type" and choose **Web app**
8. Configure the deployment:
   - **Description**: "Employee Portal API"
   - **Execute as**: Me
   - **Who has access**: Anyone
9. Click **Deploy**
10. **Copy the Web app URL** - this is your webhook URL
11. Click **Authorize access** and grant permissions

## Important Notes

- The script will automatically create two sheets: "Onboarding" and "Offboarding"
- Employee records from the "Onboarding" sheet will be searchable in the offboarding form
- The GET endpoint supports two actions:
  - `?action=getEmployees` - Returns all employees
  - `?action=searchEmployees&query=john` - Searches employees by name or email

## Testing the GET Endpoint

After deployment, you can test the GET endpoint by visiting:
```
YOUR_WEBHOOK_URL?action=getEmployees
```

You should see a JSON response with your employee data.
