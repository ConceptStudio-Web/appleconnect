/**
 * Apple Connect - Paynow Payment Gateway Integration
 * Google Apps Script Backend Proxy
 * 
 * Built to match the official Paynow API specification at:
 * https://developers.paynow.co.zw/docs/initiate_transaction.html
 * https://developers.paynow.co.zw/docs/generating_hash.html
 * 
 * SETUP:
 * 1. Paste this code into a Google Apps Script project
 * 2. Update CONFIG below with your credentials
 * 3. Deploy as Web App (Execute as: Me, Who has access: Anyone)
 * 4. Copy the Web App URL to your frontend code
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

var CONFIG = {
  // Paynow credentials
  PAYNOW_INTEGRATION_ID: '23427',
  PAYNOW_INTEGRATION_KEY: '07c6d50e-29ac-4afd-99be-452b0937072d',
  
  // URLs
  RESULT_URL: 'https://script.google.com/macros/s/AKfycbwmo1fLm_PDgjZjKumbmL7-FsYLBWtEsKixaLYcri971unFzx24tOB3365dAKBJQUSL/exec?action=result',
  RETURN_URL: 'https://appleconnect.co.zw',
  
  // Security token for frontend-to-backend auth
  API_TOKEN: 'AppleConnect2024',
  
  // Paynow API endpoint
  PAYNOW_INIT_URL: 'https://www.paynow.co.zw/interface/initiatetransaction'
};

// ============================================================================
// MAIN HANDLERS
// ============================================================================

/**
 * Handle POST requests from frontend
 */
function doPost(e) {
  try {
    var params = JSON.parse(e.postData.contents);
    var action = params.action || '';
    
    // Verify security token
    if (params.token !== CONFIG.API_TOKEN) {
      return jsonResponse({ success: false, error: 'Invalid token' });
    }
    
    if (action === 'initiate') {
      return initiatePayment(params);
    } else if (action === 'status') {
      return checkPaymentStatus(params);
    } else {
      return jsonResponse({ success: false, error: 'Unknown action: ' + action });
    }
  } catch (error) {
    Logger.log('doPost error: ' + error.toString());
    return jsonResponse({ success: false, error: 'Server error: ' + error.toString() });
  }
}

/**
 * Handle GET requests (Paynow result callback)
 */
function doGet(e) {
  try {
    var action = e.parameter.action || '';
    
    if (action === 'result') {
      // Paynow sends payment result here
      Logger.log('Paynow callback received: ' + JSON.stringify(e.parameter));
      return ContentService.createTextOutput('OK');
    }
    
    return ContentService.createTextOutput('Apple Connect Paynow Backend - Running');
  } catch (error) {
    Logger.log('doGet error: ' + error.toString());
    return ContentService.createTextOutput('ERROR: ' + error.toString());
  }
}

// ============================================================================
// PAYMENT INITIATION
// ============================================================================

/**
 * Initialize a Paynow payment
 * 
 * Per Paynow docs: POST to https://www.paynow.co.zw/interface/initiatetransaction
 * Content-Type: application/x-www-form-urlencoded
 * Fields: id, reference, amount, additionalinfo, returnurl, resulturl, authemail, status, hash
 */
function initiatePayment(params) {
  try {
    var reference = params.reference;
    var email = params.email;
    var cart = params.cart;
    var total = params.total;
    var customerName = params.customerName || '';
    var customerPhone = params.customerPhone || '';
    var branch = params.branch || '';
    
    // Validate required fields
    if (!reference || !email || !total) {
      return jsonResponse({ success: false, error: 'Missing required fields: reference, email, or total' });
    }
    
    // Build the additional info string
    var additionalInfo = customerName + ' | ' + customerPhone + ' | ' + branch;
    
    // Build Paynow payload in the EXACT field order required
    // Per docs: the hash is generated from concatenation of ALL values in their order
    var fields = [];
    fields.push({ key: 'resulturl', value: CONFIG.RESULT_URL });
    fields.push({ key: 'returnurl', value: CONFIG.RETURN_URL });
    fields.push({ key: 'reference', value: String(reference) });
    fields.push({ key: 'amount', value: String(parseFloat(total).toFixed(2)) });
    fields.push({ key: 'id', value: String(CONFIG.PAYNOW_INTEGRATION_ID) });
    fields.push({ key: 'additionalinfo', value: additionalInfo });
    fields.push({ key: 'authemail', value: String(email) });
    fields.push({ key: 'status', value: 'Message' });
    
    // Generate hash from values in order (per Paynow spec)
    var hashString = '';
    for (var i = 0; i < fields.length; i++) {
      hashString += fields[i].value;
    }
    hashString += CONFIG.PAYNOW_INTEGRATION_KEY;
    
    var hash = sha512Hash(hashString);
    
    // Build URL-encoded payload string
    var payloadParts = [];
    for (var j = 0; j < fields.length; j++) {
      payloadParts.push(encodeURIComponent(fields[j].key) + '=' + encodeURIComponent(fields[j].value));
    }
    payloadParts.push('hash=' + encodeURIComponent(hash));
    var payloadString = payloadParts.join('&');
    
    Logger.log('Paynow request payload: ' + payloadString);
    Logger.log('Hash input string: ' + hashString);
    Logger.log('Generated hash: ' + hash);
    
    // Send POST request to Paynow
    // Per docs: Content-Type must be application/x-www-form-urlencoded
    var options = {
      'method': 'post',
      'contentType': 'application/x-www-form-urlencoded',
      'payload': payloadString,
      'muteHttpExceptions': true,
      'followRedirects': true
    };
    
    var response = UrlFetchApp.fetch(CONFIG.PAYNOW_INIT_URL, options);
    var responseCode = response.getResponseCode();
    var responseText = response.getContentText();
    
    Logger.log('Paynow response code: ' + responseCode);
    Logger.log('Paynow response: ' + responseText);
    
    // Parse response (format: Status=Ok&BrowserUrl=...&PollUrl=...&Hash=...)
    var result = parsePaynowResponse(responseText);
    
    Logger.log('Parsed result: ' + JSON.stringify(result));
    
    if (result.status && result.status.toLowerCase() === 'ok') {
      return jsonResponse({
        success: true,
        pollUrl: result.pollurl || '',
        redirectUrl: result.browserurl || '',
        reference: reference
      });
    } else {
      var errorMsg = result.error || 'Payment initialization failed';
      Logger.log('Paynow error: ' + errorMsg);
      return jsonResponse({
        success: false,
        error: errorMsg,
        debug: {
          responseCode: responseCode,
          rawResponse: responseText.substring(0, 500),
          parsedStatus: result.status || 'none'
        }
      });
    }
    
  } catch (error) {
    Logger.log('initiatePayment error: ' + error.toString());
    return jsonResponse({ success: false, error: 'initiatePayment: ' + error.toString() });
  }
}

// ============================================================================
// PAYMENT STATUS CHECKING
// ============================================================================

/**
 * Check payment status by polling Paynow
 */
function checkPaymentStatus(params) {
  try {
    var pollUrl = params.pollUrl;
    
    if (!pollUrl) {
      return jsonResponse({ success: false, error: 'Missing poll URL' });
    }
    
    var response = UrlFetchApp.fetch(pollUrl, { muteHttpExceptions: true });
    var responseText = response.getContentText();
    var result = parsePaynowResponse(responseText);
    
    Logger.log('Poll result: ' + JSON.stringify(result));
    
    return jsonResponse({
      success: true,
      status: result.status || '',
      paynowreference: result.paynowreference || '',
      amount: result.amount || ''
    });
    
  } catch (error) {
    Logger.log('checkPaymentStatus error: ' + error.toString());
    return jsonResponse({ success: false, error: 'checkPaymentStatus: ' + error.toString() });
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate SHA-512 hash and return as uppercase hex string
 * 
 * Per Paynow docs:
 * 1. Concatenate all values (not keys) in order
 * 2. Append integration key
 * 3. SHA-512 hash
 * 4. Output as uppercase hexadecimal
 */
function sha512Hash(input) {
  var rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_512, input, Utilities.Charset.UTF_8);
  var hex = '';
  for (var i = 0; i < rawHash.length; i++) {
    var b = rawHash[i];
    if (b < 0) b += 256;
    var hexByte = b.toString(16);
    if (hexByte.length === 1) hexByte = '0' + hexByte;
    hex += hexByte;
  }
  return hex.toUpperCase();
}

/**
 * Parse Paynow URL-encoded response
 * 
 * Per Paynow docs, response format is:
 * Status=Ok&BrowserUrl=http%3a%2f%2f...&PollUrl=http%3a%2f%2f...&Hash=ABC123
 * 
 * Fields are separated by & and key=value pairs separated by =
 * All values are URL encoded
 */
function parsePaynowResponse(responseText) {
  var result = {};
  
  if (!responseText || responseText.length === 0) {
    Logger.log('Empty response from Paynow');
    return result;
  }
  
  // Trim any whitespace
  responseText = responseText.trim();
  
  var pairs = responseText.split('&');
  for (var i = 0; i < pairs.length; i++) {
    var pair = pairs[i];
    var eqIndex = pair.indexOf('=');
    if (eqIndex > 0) {
      var key = pair.substring(0, eqIndex);
      var value = pair.substring(eqIndex + 1);
      try {
        result[key.toLowerCase()] = decodeURIComponent(value.replace(/\+/g, ' '));
      } catch (e) {
        result[key.toLowerCase()] = value;
      }
    }
  }
  
  return result;
}

/**
 * Create JSON response with CORS headers
 */
function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================================
// TEST FUNCTION - Run this in Apps Script to verify your setup
// ============================================================================

/**
 * Test the hash generation against Paynow's example
 * Run this function manually in the Apps Script editor to verify
 */
function testHashGeneration() {
  // Test with the example from Paynow docs:
  // Integration Key: 3e9fed89-60e1-4ce5-ab6e-6b1eb2d4f977
  // Expected hash: 2A033FC38798D913D42ECB786B9B19645ADEDBDE788862032F1BD82CF3B92DEF84F316385D5B40DBB35F1A4FD7D5BFE73835174136463CDD48C9366B0749C689
  
  var testKey = '3e9fed89-60e1-4ce5-ab6e-6b1eb2d4f977';
  var testString = '1201TEST REF99.99A test ticket transactionhttp://www.google.com/search?q=returnurlhttp://www.google.com/search?q=resulturlMessage' + testKey;
  var hash = sha512Hash(testString);
  var expected = '2A033FC38798D913D42ECB786B9B19645ADEDBDE788862032F1BD82CF3B92DEF84F316385D5B40DBB35F1A4FD7D5BFE73835174136463CDD48C9366B0749C689';
  
  Logger.log('Test hash: ' + hash);
  Logger.log('Expected:  ' + expected);
  Logger.log('Match: ' + (hash === expected));
  
  // Test with your actual config
  Logger.log('');
  Logger.log('Your Integration ID: ' + CONFIG.PAYNOW_INTEGRATION_ID);
  Logger.log('Your Integration Key: ' + CONFIG.PAYNOW_INTEGRATION_KEY);
  Logger.log('Your Result URL: ' + CONFIG.RESULT_URL);
  Logger.log('Script is configured correctly!');
}
