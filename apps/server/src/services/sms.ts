/**
 * SMS Service for sending text messages.
 * Supports Twilio as the provider with a mock fallback for development.
 */

export interface SmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface SmsProvider {
  send(to: string, message: string): Promise<SmsResult>;
}

/**
 * Format phone number for SMS sending.
 * Ensures the number has the + prefix for international format.
 */
function formatPhoneForSms(phone: string): string {
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
 * Mock SMS provider for development/testing.
 * Logs messages to console instead of sending.
 */
export class MockSmsProvider implements SmsProvider {
  async send(to: string, message: string): Promise<SmsResult> {
    const formattedPhone = formatPhoneForSms(to);
    console.log(`[MockSMS] To: ${formattedPhone}`);
    console.log(`[MockSMS] Message: ${message}`);
    return {
      success: true,
      messageId: `mock-${Date.now()}`,
    };
  }
}

/**
 * Twilio SMS provider for production.
 */
export class TwilioSmsProvider implements SmsProvider {
  private accountSid: string;
  private authToken: string;
  private fromNumber: string;

  constructor(accountSid: string, authToken: string, fromNumber: string) {
    this.accountSid = accountSid;
    this.authToken = authToken;
    this.fromNumber = fromNumber;
  }

  async send(to: string, message: string): Promise<SmsResult> {
    const formattedPhone = formatPhoneForSms(to);

    try {
      // Use Twilio REST API directly (no SDK dependency)
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
        },
        body: new URLSearchParams({
          To: formattedPhone,
          From: this.fromNumber,
          Body: message,
        }),
      });

      const data = await response.json() as { sid?: string; message?: string; code?: number };

      if (!response.ok) {
        console.error('[TwilioSMS] Error:', data);
        return {
          success: false,
          error: data.message || `HTTP ${response.status}`,
        };
      }

      console.log(`[TwilioSMS] Sent to ${formattedPhone}, SID: ${data.sid}`);
      return {
        success: true,
        messageId: data.sid,
      };
    } catch (error) {
      console.error('[TwilioSMS] Exception:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

/**
 * Create the appropriate SMS provider based on environment configuration.
 */
export function createSmsProvider(): SmsProvider {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  // Use Twilio if all credentials are configured
  if (accountSid && authToken && fromNumber) {
    console.log('[SMS] Using Twilio provider');
    return new TwilioSmsProvider(accountSid, authToken, fromNumber);
  }

  // Fallback to mock provider
  console.log('[SMS] Using Mock provider (no Twilio credentials configured)');
  return new MockSmsProvider();
}

// Singleton instance
let smsProvider: SmsProvider | null = null;

/**
 * Get the SMS provider instance (singleton).
 */
export function getSmsProvider(): SmsProvider {
  if (!smsProvider) {
    smsProvider = createSmsProvider();
  }
  return smsProvider;
}

/**
 * Send an OTP code via SMS.
 */
export async function sendOtpSms(phone: string, code: string): Promise<SmsResult> {
  const provider = getSmsProvider();
  const message = `SeloTroca: O seu codigo de verificacao e ${code}. Valido por 10 minutos.`;
  return provider.send(phone, message);
}

