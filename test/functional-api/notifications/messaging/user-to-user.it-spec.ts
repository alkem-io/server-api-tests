/* eslint-disable prettier/prettier */
import { deleteMailSlurperMails } from '@utils/mailslurper.rest.requests';
import { delay } from '@utils/delay';
import { TestUser } from '@utils';
import { users } from '@utils/queries/users-data';
import { PreferenceType } from '@alkemio/client-lib';
import { changePreferenceUser } from '@utils/mutations/preferences-mutation';
import { sendMessageToUser } from '@functional-api/communications/communication.params';
import { getMailsData } from '@test/types/entities-helper';

let receiver_userDisplayName = '';
let sender_userDisplayName = '';
let preferencesConfig: any[] = [];
let receiver = '';
let sender = '';

const receivers = (senderDisplayName: string) => {
  return `${senderDisplayName} sent you a message!`;
};

beforeAll(async () => {
  await deleteMailSlurperMails();

  receiver_userDisplayName = users.globalAdmin.displayName;
  sender_userDisplayName = users.nonSpaceMember.displayName;

  receiver = `${sender_userDisplayName} sent you a message!`;
  sender = `You have sent a message to ${receiver_userDisplayName}!`;

  preferencesConfig = [
    {
      userID: users.globalAdmin.id,
      type: PreferenceType.NotificationCommunicationMessage,
    },
    {
      userID: users.nonSpaceMember.id,
      type: PreferenceType.NotificationCommunicationMessage,
    },
    {
      userID: users.qaUser.id,
      type: PreferenceType.NotificationCommunicationMessage,
    },
  ];
});

describe('Notifications - user to user messages', () => {
  beforeAll(async () => {
    for (const config of preferencesConfig)
      await changePreferenceUser(config.userID, config.type, 'true');
  });

  beforeEach(async () => {
    await deleteMailSlurperMails();
  });

  test("User 'A'(pref:true) send message to user 'B'(pref:true) - 2 messages are sent", async () => {
    // Act
    await sendMessageToUser(
      [users.globalAdmin.id],
      'Test message',
      TestUser.NON_HUB_MEMBER
    );
    await delay(3000);

    const getEmailsData = await getMailsData();

    // Assert
    expect(getEmailsData[1]).toEqual(2);
    expect(getEmailsData[0]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          subject: receiver,
          toAddresses: [users.globalAdmin.email],
        }),
        expect.objectContaining({
          subject: sender,
          toAddresses: [users.nonSpaceMember.email],
        }),
      ])
    );
  });

  // Skipping until behavior is cleared, whather the bahavior of receiving email for each sent message is right
  test.skip("User 'A'(pref:true) send message to 2 users: 'B' and 'C'(pref:true) - 3 messages are sent", async () => {
    // Act
    await sendMessageToUser(
      [users.globalAdmin.id, users.qaUser.id],
      'Test message',
      TestUser.NON_HUB_MEMBER
    );
    await delay(3000);

    const getEmailsData = await getMailsData();

    // Assert
    expect(getEmailsData[1]).toEqual(3);
    expect(getEmailsData[0]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          subject: receivers(users.nonSpaceMember.displayName),
          toAddresses: [users.qaUser.email],
        }),
        expect.objectContaining({
          subject: receivers(users.nonSpaceMember.displayName),
          toAddresses: [users.globalAdmin.email],
        }),
        expect.objectContaining({
          subject: sender,
          toAddresses: [users.nonSpaceMember.email],
        }),
      ])
    );
  });

  // Skipping until behavior is cleared, whather the bahavior of receiving email for each sent message is right
  test.skip("User 'A'(pref:true) send message to 2 users: 'B'(pref:true) and 'C'(pref:false) - 2 messages are sent", async () => {
    // Arrange
    await changePreferenceUser(
      users.qaUser.id,
      PreferenceType.NotificationCommunicationMessage,
      'false'
    );

    // Act
    await sendMessageToUser(
      [users.globalAdmin.id, users.qaUser.id],
      'Test message',
      TestUser.NON_HUB_MEMBER
    );
    await delay(3000);

    const getEmailsData = await getMailsData();

    // Assert
    expect(getEmailsData[1]).toEqual(2);
    expect(getEmailsData[0]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          subject: receivers(users.nonSpaceMember.displayName),
          toAddresses: [users.globalAdmin.email],
        }),
        expect.objectContaining({
          subject: sender,
          toAddresses: [users.nonSpaceMember.email],
        }),
      ])
    );
    await changePreferenceUser(
      users.qaUser.id,
      PreferenceType.NotificationCommunicationMessage,
      'true'
    );
  });

  test("User 'A'(pref:true) send message to user 'B'(pref:false) - 1 messages are sent", async () => {
    // Arrange
    await changePreferenceUser(
      users.globalAdmin.id,
      PreferenceType.NotificationCommunicationMessage,
      'false'
    );

    // Act
    await sendMessageToUser(
      [users.globalAdmin.id],
      'Test message',
      TestUser.NON_HUB_MEMBER
    );
    await delay(3000);

    const getEmailsData = await getMailsData();

    // Assert
    expect(getEmailsData[1]).toEqual(1);
    expect(getEmailsData[0]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          subject: sender,
          toAddresses: [users.nonSpaceMember.email],
        }),
      ])
    );
  });

  test("User 'A'(pref:false) send message to user 'B'(pref:true) - 2 messages are sent", async () => {
    // Arrange
    await changePreferenceUser(
      users.globalAdmin.id,
      PreferenceType.NotificationCommunicationMessage,
      'true'
    );

    await changePreferenceUser(
      users.nonSpaceMember.id,
      PreferenceType.NotificationCommunicationMessage,
      'false'
    );

    // Act
    await sendMessageToUser(
      [users.globalAdmin.id],
      'Test message',
      TestUser.NON_HUB_MEMBER
    );
    await delay(3000);

    const getEmailsData = await getMailsData();

    // Assert
    expect(getEmailsData[1]).toEqual(2);
    expect(getEmailsData[0]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          subject: receiver,
          toAddresses: [users.globalAdmin.email],
        }),
        expect.objectContaining({
          subject: sender,
          toAddresses: [users.nonSpaceMember.email],
        }),
      ])
    );
  });
});
