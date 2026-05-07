# Authentication Testing Guide

Quick reference for testing all authentication flows locally and in production.

---

## Local Development Setup

### Start Frontend Dev Server

```bash
cd frontend
npm install
npm run dev
```

Server runs on `http://localhost:5173/`

### Required Environment Variables (`.env`)

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_COGNITO_USER_POOL_ID=ap-northeast-1_xxxxxxxxx
VITE_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_AWS_REGION=ap-northeast-1
```

Get values from AWS Cognito console.

---

## Test Scenarios

### 1. Signup Flow

**Objective**: Verify new user registration and email verification works

**Steps**:
1. Navigate to auth page
2. Click **"Create one"** button
3. Enter test email (e.g., `test+dev@example.com`)
4. Create strong password:
   - ✓ 8+ characters
   - ✓ Uppercase letter
   - ✓ Lowercase letter
   - ✓ Number
   - ✓ Special symbol
5. Confirm password (must match)
6. Submit signup form

**Expected Result**:
- Form accepts submission
- Message: "Account created! Check your email for verification code"
- Redirected to email verification screen

**Verify Email**:
1. Check email inbox for verification code from AWS Cognito
2. Copy 6-digit code
3. Enter code in verification form
4. Submit

**Expected Result**:
- Message: "Email verified! You can now sign in."
- Redirected to login form

**Common Issues**:
- ❌ Email not received → Check spam folder, verify sender email in Cognito
- ❌ Code rejected → Verify code hasn't expired (usually 24 hours)
- ❌ Already exists error → Email already registered, use forgot password

---

### 2. Login Flow

**Objective**: Verify existing users can log in securely

**Prerequisites**: Complete signup flow first

**Steps**:
1. Navigate to auth page
2. Enter registered email
3. Enter password
4. Click **"Sign in"** button

**Expected Result**:
- Message: "Login successful"
- Redirected to file vault dashboard
- See upload panel and file list

**Verify Token**:
1. Open browser console (F12)
2. Go to **"Application"** tab
3. Click **"Session Storage"**
4. Look for `idToken` key
5. Should contain JWT token (long string)

**Common Issues**:
- ❌ "Login failed" → Check email/password spelling
- ❌ "User not confirmed" → Must complete email verification
- ❌ "Invalid password" → Password incorrect

---

### 3. Password Reset Flow

**Objective**: Verify users can recover forgotten passwords

**Steps**:
1. Navigate to auth page
2. Click **"Forgot your password?"** link
3. Enter registered email
4. Click **"Send reset code"** button

**Expected Result**:
- Message: "Check your email for the password reset code"
- Page changes to code/password entry form

**Reset Password**:
1. Check email inbox for password reset code
2. Copy 6-digit code
3. Enter code in verification field
4. Enter new password (must meet strength requirements)
5. Confirm password (must match)
6. Submit form

**Expected Result**:
- Message: "Password reset successful! Redirecting to sign in..."
- Redirected to login form after 2 seconds
- Can login with new password

**Common Issues**:
- ❌ Code not received → Check spam, verify email validity
- ❌ Code expired → Request new code (codes expire in 24 hours)
- ❌ Password weak → Ensure all 5 requirements met

---

### 4. Password Strength Validation

**Objective**: Verify password validation works correctly

**Test Cases**:

#### Too Short
- **Input**: `Pass1!`
- **Expected**: ❌ Fails (less than 8 chars)
- **Visual**: Red bar, "8+ characters" unchecked

#### Missing Uppercase
- **Input**: `password123!`
- **Expected**: ❌ Fails (no uppercase)
- **Visual**: Red bar, "Uppercase letter" unchecked

#### Missing Lowercase
- **Input**: `PASSWORD123!`
- **Expected**: ❌ Fails (no lowercase)
- **Visual**: Red bar, "Lowercase letter" unchecked

#### Missing Number
- **Input**: `Password!`
- **Expected**: ❌ Fails (no number)
- **Visual**: Red bar, "Number" unchecked

#### Missing Symbol
- **Input**: `Password123`
- **Expected**: ❌ Fails (no symbol)
- **Visual**: Red bar, "Symbol" unchecked

#### Valid Password
- **Input**: `SecureVault2024!`
- **Expected**: ✅ Passes all requirements
- **Visual**: Green bar, all checks marked

---

### 5. Logout Flow

**Objective**: Verify user session termination

**Steps**:
1. Log in with valid credentials
2. Access file vault dashboard
3. Click **"Logout"** button in top right
4. Verify redirected to login page

**Expected Result**:
- Logged out successfully
- Back at login form
- Previous session removed

**Verify Token Cleared**:
1. Open browser console (F12)
2. Check Session Storage
3. `idToken` should be gone

---

### 6. File Operations (Authenticated)

**Objective**: Verify file operations require valid authentication

**Prerequisites**: Must be logged in with valid JWT token

**Test Upload**:
1. Select file from computer
2. Click **"Upload securely"** button
3. File uploads to private S3 bucket

**Expected Result**:
- ✅ Upload succeeds with valid token
- ✅ File appears in vault with "uploaded" status
- ✅ Can download and preview file

**Test Without Token**:
1. Open browser console
2. Clear `idToken` from Session Storage
3. Try to upload file
4. Refresh page

**Expected Result**:
- ❌ Redirected to login (no valid token)
- ❌ File operations fail with 401 error

---

## Edge Cases & Error Handling

### Email Already Registered

**Test**:
1. Signup with existing email

**Expected**:
- Error message from Cognito
- User can use forgot password or login

### Password Mismatch

**Test**:
1. Enter password and different confirm password
2. Try to submit

**Expected**:
- ❌ Form shows "Passwords do not match"
- ❌ Submit button disabled

### Verification Code Expired

**Test**:
1. Request verification code
2. Wait 24+ hours (or simulate in tests)
3. Try to verify with old code

**Expected**:
- ❌ "Code has expired" error
- ✅ Can request new code via login

### Network Errors

**Test**:
1. Disable internet connection
2. Try to login
3. Re-enable connection

**Expected**:
- ❌ Error message displayed
- ✅ Can retry after connection restored

---

## Browser Console Debugging

### Check Token in Console

```javascript
// View JWT token
sessionStorage.getItem('idToken')

// Decode token (for inspection)
// Visit jwt.io and paste token

// Check Cognito user pool
window.userPool

// Check auth context
window.__REACT_DEVTOOLS_GLOBAL_HOOK__
```

### Monitor API Requests

1. Open DevTools (F12)
2. Go to **"Network"** tab
3. Filter by API requests
4. Check:
   - Request headers (should have `Authorization: Bearer ...`)
   - Response status (should be 200 for success)
   - Response body (error messages if failed)

### View Application Storage

1. Open DevTools (F12)
2. Go to **"Application"** tab
3. Click **"Session Storage"**
4. Look for `idToken` key
5. Value should be JWT token

---

## Security Testing

### Test HTTPS Enforcement

**In Production**:
- Verify all requests use `https://`
- Tokens never transmitted over HTTP

### Test Token Expiration

**Steps**:
1. Login to get token
2. Leave for extended period (token expires)
3. Try to make API request

**Expected**:
- API returns 401 Unauthorized
- Frontend redirects to login
- User must re-authenticate

### Test CORS

**Test**:
1. Check Network tab
2. Look for CORS headers on API responses
3. Verify backend allows frontend origin

---

## Performance Testing

### Measure Page Load

```javascript
// In browser console
performance.getEntriesByType('navigation')[0].loadEventEnd - 
performance.getEntriesByType('navigation')[0].fetchStart
```

### Measure Auth Flow

```javascript
// Time signup
console.time('signup');
// ... perform signup
console.timeEnd('signup');
```

### Check Bundle Size

```bash
cd frontend
npm run build
# Check dist/ folder size
ls -lh dist/assets/
```

---

## Testing Checklist

- [ ] Signup with valid email and strong password
- [ ] Verify email via code
- [ ] Login with registered credentials
- [ ] Logout and verify session cleared
- [ ] Password reset with valid code
- [ ] Password strength validation
- [ ] Upload file while authenticated
- [ ] Download/preview file
- [ ] Try operations without token
- [ ] Test with invalid credentials
- [ ] Check console for errors
- [ ] Verify JWT token in storage
- [ ] Test on mobile devices
- [ ] Test on different browsers

---

## Useful Testing Accounts

Create test accounts for different scenarios:

| Email | Purpose | Password |
|-------|---------|----------|
| `test+basic@example.com` | Basic signup/login | `TestPass123!` |
| `test+mfa@example.com` | MFA testing | `TestPass456!` |
| `test+weak@example.com` | Weak password testing | `weak` |

---

## Troubleshooting Commands

### Clear Auth State

```javascript
// In browser console
sessionStorage.clear()
location.reload()
```

### Check Cognito Config

```javascript
// Verify environment variables loaded
console.log({
  apiUrl: import.meta.env.VITE_API_BASE_URL,
  userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
  clientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
  region: import.meta.env.VITE_AWS_REGION
})
```

### Inspect Token Claims

```javascript
// Decode JWT to see claims
const token = sessionStorage.getItem('idToken')
const parts = token.split('.')
const decoded = JSON.parse(atob(parts[1]))
console.log('Token claims:', decoded)
```

---

## Production Deployment Testing

After deploying to Vercel:

1. ✅ Access deployment URL
2. ✅ Test signup flow (creates new AWS Cognito user)
3. ✅ Test login flow
4. ✅ Test password reset
5. ✅ Test file upload/download
6. ✅ Check browser console for errors
7. ✅ Verify HTTPS used
8. ✅ Test on mobile devices
9. ✅ Load test with multiple users
10. ✅ Monitor error tracking (Sentry)

---

## Common Test Mistakes to Avoid

- ❌ Using temporary/disposable email service (won't receive emails)
- ❌ Not checking spam folder for verification codes
- ❌ Forgetting to enable email in Cognito User Pool
- ❌ Using same email for multiple test accounts
- ❌ Not waiting for build to complete before testing
- ❌ Testing with outdated environment variables
- ❌ Not clearing browser cache between tests
- ❌ Assuming test account exists without creating it first

---

**Happy Testing! 🚀**
