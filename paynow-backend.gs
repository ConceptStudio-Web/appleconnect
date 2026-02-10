/**
 * Apple Connect - Paynow Payment Gateway Integration
 * Google Apps Script Backend Proxy
 * 
 * This script acts as a secure backend for Paynow payment processing.
 * It handles payment initialization, status polling, and transaction logging.
 * 
 * SETUP INSTRUCTIONS:
 * 1. Create a new Google Apps Script project
 * 2. Copy this code into Code.gs
 * 3. Create a Google Sheet for transaction logging and link it below
 * 4. Get your Paynow Integration ID and Key from https://www.paynow.co.zw/
 * 5. Deploy as Web App (Execute as: Me, Who has access: Anyone)
 * 6. Copy the Web App URL to your frontend code
 */

// ============================================================================
// CONFIGURATION - REPLACE THESE VALUES
// ============================================================================

const CONFIG = {
  // Paynow credentials (get from https://www.paynow.co.zw/)
  PAYNOW_INTEGRATION_ID: '23427',
  PAYNOW_INTEGRATION_KEY: '07c6d50e-29ac-4afd-99be-452b0937072d',
  
  // Your website URLs (update after deploying)
  RESULT_URL: 'https://script.google.com/macros/s/AKfycbwmo1fLm_PDgjZjKumbmL7-FsYLBWtEsKixaLYcri971unFzx24tOB3365dAKBJQUSL/exec?action=result',  // Where Paynow sends payment status
  RETURN_URL: 'https://appleconnect.co.zw',  // Where user returns after payment
  
  // Google Sheet ID for transaction logging
  SHEET_ID: 'YOUR_GOOGLE_SHEET_ID_HERE',
  SHEET_NAME: 'Paynow Transactions',
  
  // Security token (change this to a random string)
  API_TOKEN: 'AppleConnect2024',
  
  // Paynow API endpoints
  PAYNOW_INIT_URL: 'https://www.paynow.co.zw/interface/initiatetransaction',
  PAYNOW_STATUS_URL: '', // Will be returned by init transaction
};

// ============================================================================
// MAIN HANDLERS
// ============================================================================

/**
 * Handle POST requests (payment initiation from frontend)
 */
function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const action = params.action || '';
    
    // Verify security token
    if (params.token !== CONFIG.API_TOKEN) {
      return jsonResponse({ success: false, error: 'Invalid token' });
    }
    
    switch (action) {
      case 'initiate':
        return initiatePayment(params);
      case 'status':
        return checkPaymentStatus(params);
      default:
        return jsonResponse({ success: false, error: 'Unknown action' });
    }
  } catch (error) {
    Logger.log('doPost error: ' + error.toString());
    return jsonResponse({ success: false, error: error.toString() });
  }
}

/**
 * Handle GET requests (result callback from Paynow)
 */
function doGet(e) {
  try {
    const action = e.parameter.action || '';
    
    if (action === 'result') {
      return handlePaynowCallback(e.parameter);
    }
    
    return ContentService.createTextOutput('OK');
  } catch (error) {
    Logger.log('doGet error: ' + error.toString());
    return ContentService.createTextOutput('ERROR: ' + error.toString());
  }
}

// ============================================================================
// PAYMENT INITIATION
// ============================================================================

/**
 * Initialize a new Paynow payment
 */
function initiatePayment(params) {
  try {
    const { reference, email, cart, total, customerName, customerPhone, branch } = params;
    
    // Validate required fields
    if (!reference || !email || !cart || !total) {
      return jsonResponse({ success: false, error: 'Missing required fields' });
    }
    
    // Build Paynow request payload
    const paynowData = {
      'resulturl': CONFIG.RESULT_URL,
      'returnurl': CONFIG.RETURN_URL,
      'reference': reference,
      'amount': total,
      'id': CONFIG.PAYNOW_INTEGRATION_ID,
      'additionalinfo': customerName + ' | ' + customerPhone + ' | ' + branch,
      'authemail': email,
      'status': 'Message'
    };
    
    // Add cart items
    cart.forEach((item, index) => {
      paynowData[`${index + 1}title`] = item.name;
      paynowData[`${index + 1}amount`] = (item.price * item.qty).toFixed(2);
    });
    
    // Generate hash for security
    const hash = generateHash(paynowData);
    paynowData['hash'] = hash;
    
    // Send request to Paynow
    const options = {
      'method': 'post',
      'payload': paynowData,
      'muteHttpExceptions': true
    };
    
    const response = UrlFetchApp.fetch(CONFIG.PAYNOW_INIT_URL, options);
    const responseText = response.getContentText();
    
    // Parse Paynow response
    const result = parsePaynowResponse(responseText);
    
    if (result.status === 'Ok') {
      // Log transaction
      logTransaction({
        reference: reference,
        customerName: customerName,
        customerPhone: customerPhone,
        email: email,
        branch: branch,
        cart: JSON.stringify(cart),
        total: total,
        status: 'Initiated',
        pollUrl: result.pollurl || '',
        paymentUrl: result.browserurl || ''
      });
      
      return jsonResponse({
        success: true,
        pollUrl: result.pollurl,
        redirectUrl: result.browserurl,
        reference: reference
      });
    } else {
      return jsonResponse({
        success: false,
        error: result.error || 'Payment initialization failed'
      });
    }
    
  } catch (error) {
    Logger.log('initiatePayment error: ' + error.toString());
    return jsonResponse({ success: false, error: error.toString() });
  }
}

// ============================================================================
// PAYMENT STATUS CHECKING
// ============================================================================

/**
 * Check the status of a payment
 */
function checkPaymentStatus(params) {
  try {
    const { pollUrl } = params;
    
    if (!pollUrl) {
      return jsonResponse({ success: false, error: 'Missing poll URL' });
    }
    
    const response = UrlFetchApp.fetch(pollUrl, { muteHttpExceptions: true });
    const responseText = response.getContentText();
    const result = parsePaynowResponse(responseText);
    
    // Update transaction status
    if (result.reference) {
      updateTransactionStatus(result.reference, result.status || 'Unknown');
    }
    
    return jsonResponse({
      success: true,
      status: result.status,
      paynowreference: result.paynowreference,
      pollUrl: result.pollurl
    });
    
  } catch (error) {
    Logger.log('checkPaymentStatus error: ' + error.toString());
    return jsonResponse({ success: false, error: error.toString() });
  }
}

/**
 * Handle callback from Paynow (result URL)
 */
function handlePaynowCallback(params) {
  try {
    const reference = params.reference || '';
    const status = params.status || '';
    const paynowreference = params.paynowreference || '';
    
    // Update transaction status
    if (reference) {
      updateTransactionStatus(reference, status, paynowreference);
    }
    
    Logger.log('Paynow callback: ' + JSON.stringify(params));
    return ContentService.createTextOutput('OK');
    
  } catch (error) {
    Logger.log('handlePaynowCallback error: ' + error.toString());
    return ContentService.createTextOutput('ERROR');
  }
}

// ============================================================================
// GOOGLE SHEETS LOGGING
// ============================================================================

/**
 * Log a new transaction to Google Sheets
 */
function logTransaction(data) {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.SHEET_ID).getSheetByName(CONFIG.SHEET_NAME);
    
    // Create sheet if it doesn't exist
    if (!sheet) {
      const newSheet = SpreadsheetApp.openById(CONFIG.SHEET_ID).insertSheet(CONFIG.SHEET_NAME);
      // Add headers
      newSheet.appendRow([
        'Timestamp',
        'Reference',
        'Customer Name',
        'Customer Phone',
        'Email',
        'Branch',
        'Cart Items',
        'Total',
        'Status',
        'Poll URL',
        'Payment URL',
        'Paynow Reference'
      ]);
      newSheet.getRange(1, 1, 1, 12).setFontWeight('bold');
    }
    
    const targetSheet = sheet || SpreadsheetApp.openById(CONFIG.SHEET_ID).getSheetByName(CONFIG.SHEET_NAME);
    
    targetSheet.appendRow([
      new Date(),
      data.reference,
      data.customerName,
      data.customerPhone,
      data.email,
      data.branch,
      data.cart,
      data.total,
      data.status,
      data.pollUrl,
      data.paymentUrl,
      ''  // Paynow Reference (filled after payment)
    ]);
    
  } catch (error) {
    Logger.log('logTransaction error: ' + error.toString());
  }
}

/**
 * Update transaction status
 */
function updateTransactionStatus(reference, status, paynowReference = '') {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.SHEET_ID).getSheetByName(CONFIG.SHEET_NAME);
    if (!sheet) return;
    
    const data = sheet.getDataRange().getValues();
    
    // Find the row with this reference
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === reference) {  // Column B is Reference
        sheet.getRange(i + 1, 9).setValue(status);  // Column I is Status
        sheet.getRange(i + 1, 1).setValue(new Date());  // Update timestamp
        
        if (paynowReference) {
          sheet.getRange(i + 1, 12).setValue(paynowReference);  // Column L is Paynow Reference
        }
        break;
      }
    }
    
  } catch (error) {
    Logger.log('updateTransactionStatus error: ' + error.toString());
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate security hash for Paynow request
 */
function generateHash(data) {
  const values = [];
  const keys = Object.keys(data).sort();
  
  keys.forEach(key => {
    if (key !== 'hash') {
      values.push(data[key]);
    }
  });
  
  values.push(CONFIG.PAYNOW_INTEGRATION_KEY);
  
  const str = values.join('');
  const hash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA512, str);
  
  return hash.map(byte => {
    const v = (byte < 0) ? 256 + byte : byte;
    return ('0' + v.toString(16)).slice(-2);
  }).join('').toUpperCase();
}

/**
 * Parse Paynow URL-encoded response
 */
function parsePaynowResponse(responseText) {
  const result = {};
  const lines = responseText.split('\n');
  
  lines.forEach(line => {
    const parts = line.split('=');
    if (parts.length === 2) {
      result[parts[0].toLowerCase()] = decodeURIComponent(parts[1]);
    }
  });
  
  return result;
}

/**
 * Create JSON response
 */
function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
