import type { CustomMessageTriggerEvent } from 'aws-lambda';
import { describe, expect, it } from 'vitest';
import { customMessage } from '../src/auth/customMessage';

const trigger = (triggerSource: string) =>
  ({
    triggerSource,
    request: { codeParameter: '{####}', usernameParameter: null, userAttributes: {} },
    response: { smsMessage: null, emailMessage: null, emailSubject: null },
  }) as unknown as CustomMessageTriggerEvent;

describe('customMessage', () => {
  it('brands verification and reset emails with distinct subjects', async () => {
    const signUp = await customMessage(trigger('CustomMessage_SignUp'));
    const reset = await customMessage(trigger('CustomMessage_ForgotPassword'));

    for (const { response } of [signUp, reset]) {
      expect(response.emailMessage).toContain('{####}');
      expect(response.emailMessage).toContain('Jonas AI');
      expect(response.emailMessage!.length).toBeLessThan(20_000);
    }
    expect(signUp.response.emailSubject).toMatch(/verify/i);
    expect(reset.response.emailSubject).toMatch(/reset/i);
  });

  it('leaves admin invitations to the Cognito default', async () => {
    const { response } = await customMessage(trigger('CustomMessage_AdminCreateUser'));
    expect(response.emailMessage).toBeNull();
    expect(response.emailSubject).toBeNull();
  });
});
