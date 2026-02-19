/**
 * Twilio Verify Service for OTP verification.
 * Uses Twilio Verify API for sending and checking verification codes.
 * Twilio handles code generation, delivery, rate limiting, and fraud prevention.
 */

export interface VerifyResult {
  success: boolean;
  status?: string;
  error?: string;
}

export interface VerifyProvider {
  sendVerification(to: string): Promise<VerifyResult>;
  checkVerification(to: string, code: string): Promise<VerifyResult>;
}

/**
 * Format phone number for Twilio Verify.
 * Ensures the number has the + prefix for international format.
 */
function formatPhoneForVerify(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  // If it starts with country code (351 for Portugal), add +
  if (digits.startsWith('351')) {
    return `+${digits}`;
  }
  // If it's a 9-digit Portuguese number, add +351
  if (digits.length === 9 && digits.startsWith('9')) {
    return `+351${digits}`;
  }
  // Fallback: assume it needs + prefix
  return `+${digits}`;
}

/**
 * Mock Verify provider for development/testing.
 * Always accepts code "123456" for testing.
 */
export class MockVerifyProvider implements VerifyProvider {
  async sendVerification(to: string): Promise<VerifyResult> {
    const formattedPhone = formatPhoneForVerify(to);
    console.log(`[MockVerify] Sending verification to: ${formattedPhone}`);
    console.log(`[MockVerify] Use code "123456" to verify`);
    return {
      success: true,
      status: 'pending',
    };
  }

  async checkVerification(to: string, code: string): Promise<VerifyResult> {
    const formattedPhone = formatPhoneForVerify(to);
    console.log(`[MockVerify] Checking code "${code}" for: ${formattedPhone}`);
    // Accept "123456" as valid code in mock mode
    if (code === '123456') {
      return { success: true, status: 'approved' };
    }
    return { success: false, status: 'pending', error: 'INVALID_OTP' };
  }
}

/**
 * Twilio Verify provider for production.
 * Uses Twilio Verify API for secure OTP verification.
 */
export class TwilioVerifyProvider implements VerifyProvider {
  private accountSid: string;
  private authToken: string;
  private serviceSid: string;

  constructor(accountSid: string, authToken: string, serviceSid: string) {
    this.accountSid = accountSid;
    this.authToken = authToken;
    this.serviceSid = serviceSid;
  }

  private getAuthHeader(): string {
    return `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`;
  }

  async sendVerification(to: string): Promise<VerifyResult> {
    const formattedPhone = formatPhoneForVerify(to);

    try {
      const url = `https://verify.twilio.com/v2/Services/${this.serviceSid}/Verifications`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: this.getAuthHeader(),
        },
        body: new URLSearchParams({
          To: formattedPhone,
          Channel: 'sms',
        }),
      });

      const data = await response.json() as { status?: string; message?: string; code?: number };

      if (!response.ok) {
        console.error('[TwilioVerify] Send error:', data);
        return {
          success: false,
          error: data.message || `HTTP ${response.status}`,
        };
      }

      console.log(`[TwilioVerify] Verification sent to ${formattedPhone}, status: ${data.status}`);
      return {
        success: true,
        status: data.status,
      };
    } catch (error) {
      console.error('[TwilioVerify] Send exception:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async checkVerification(to: string, code: string): Promise<VerifyResult> {
    const formattedPhone = formatPhoneForVerify(to);

    try {
      const url = `https://verify.twilio.com/v2/Services/${this.serviceSid}/VerificationCheck`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: this.getAuthHeader(),
        },
        body: new URLSearchParams({
          To: formattedPhone,
          Code: code,
        }),
      });

      const data = await response.json() as { status?: string; message?: string; code?: number; valid?: boolean };

      if (!response.ok) {
        console.error('[TwilioVerify] Check error:', data);
        // Map Twilio errors to our error codes
        if (data.code === 20404) {
          return { success: false, error: 'OTP_EXPIRED' };
        }
        if (data.code === 60202) {
          return { success: false, error: 'TOO_MANY_ATTEMPTS' };
        }
        return {
          success: false,
          error: data.message || `HTTP ${response.status}`,
        };
      }

      const isApproved = data.status === 'approved';
      console.log(`[TwilioVerify] Check for ${formattedPhone}, status: ${data.status}`);

      if (!isApproved) {
        return { success: false, status: data.status, error: 'INVALID_OTP' };
      }

      return {
        success: true,
        status: data.status,
      };
    } catch (error) {
      console.error('[TwilioVerify] Check exception:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

/**
 * Create the appropriate Verify provider based on environment configuration.
 */
export function createVerifyProvider(): VerifyProvider {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

  // Use Twilio Verify if all credentials are configured
  if (accountSid && authToken && serviceSid) {
    console.log('[Verify] Using Twilio Verify provider');
    return new TwilioVerifyProvider(accountSid, authToken, serviceSid);
  }

  // Fallback to mock provider
  console.log('[Verify] Using Mock provider (no Twilio credentials configured)');
  return new MockVerifyProvider();
}

// Singleton instance
let verifyProvider: VerifyProvider | null = null;

/**
 * Get the Verify provider instance (singleton).
 */
export function getVerifyProvider(): VerifyProvider {
  if (!verifyProvider) {
    verifyProvider = createVerifyProvider();
  }
  return verifyProvider;
}

/**
 * Send OTP verification via Twilio Verify.
 */
export async function sendOtpVerification(phone: string): Promise<VerifyResult> {
  const provider = getVerifyProvider();
  return provider.sendVerification(phone);
}

/**
 * Check OTP verification via Twilio Verify.
 */
export async function checkOtpVerification(phone: string, code: string): Promise<VerifyResult> {
  const provider = getVerifyProvider();
  return provider.checkVerification(phone, code);
}

