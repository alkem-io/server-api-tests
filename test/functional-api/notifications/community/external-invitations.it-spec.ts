import { uniqueId } from '@utils/mutations/create-mutation';
import { deleteMailSlurperMails } from '@utils/mailslurper.rest.requests';
import {
  deleteSpace,
  updateSpaceSettings,
} from '@functional-api/journey/space/space.request.params';
import { delay } from '@utils/delay';
import { users } from '@utils/queries/users-data';
import {
  deleteExternalInvitation,
  inviteExternalUser,
} from '@functional-api/roleset/invitations/invitation.request.params';
import { TestUser } from '@utils';
import {
  createChallengeWithUsers,
  createOpportunityWithUsers,
  createOrgAndSpaceWithUsers,
} from '@utils/data-setup/entities';
import { PreferenceType } from '@alkemio/client-lib';
import { changePreferenceUser } from '@utils/mutations/preferences-mutation';

import { deleteOrganization } from '@functional-api/contributor-management/organization/organization.request.params';
import { entitiesId, getMailsData } from '@test/types/entities-helper';

const organizationName = 'not-app-org-name' + uniqueId;
const hostNameId = 'not-app-org-nameid' + uniqueId;
const spaceName = 'not-app-eco-name' + uniqueId;
const spaceNameId = 'not-app-eco-nameid' + uniqueId;
const opportunityName = 'opportunity-name';
const challengeName = 'challlenge-name';
const ecoName = spaceName;

let invitationId = '';
let preferencesConfig: any[] = [];

beforeAll(async () => {
  await deleteMailSlurperMails();

  await createOrgAndSpaceWithUsers(
    organizationName,
    hostNameId,
    spaceName,
    spaceNameId
  );

  await updateSpaceSettings(entitiesId.spaceId, {
    membership: {
      allowSubspaceAdminsToInviteMembers: true,
    },
  });

  await createChallengeWithUsers(challengeName);

  await updateSpaceSettings(entitiesId.challenge.id, {
    membership: {
      allowSubspaceAdminsToInviteMembers: true,
    },
  });

  await createOpportunityWithUsers(opportunityName);

  preferencesConfig = [
    {
      userID: users.spaceAdmin.id,
      type: PreferenceType.NotificationCommunityInvitationUser,
    },

    {
      userID: users.challengeAdmin.id,
      type: PreferenceType.NotificationCommunityInvitationUser,
    },

    {
      userID: users.opportunityAdmin.id,
      type: PreferenceType.NotificationCommunityInvitationUser,
    },

    {
      userID: users.nonSpaceMember.id,
      type: PreferenceType.NotificationCommunityInvitationUser,
    },

    {
      userID: users.qaUser.id,
      type: PreferenceType.NotificationCommunityInvitationUser,
    },
  ];
});

afterAll(async () => {
  await deleteSpace(entitiesId.spaceId);
  await deleteOrganization(entitiesId.organization.id);
});

describe('Notifications - invitations', () => {
  beforeAll(async () => {
    await changePreferenceUser(
      users.notificationsAdmin.id,
      PreferenceType.NotificationCommunityInvitationUser,
      'false'
    );

    await changePreferenceUser(
      users.globalCommunityAdmin.id,
      PreferenceType.NotificationCommunityInvitationUser,
      'false'
    );
    for (const config of preferencesConfig)
      await changePreferenceUser(config.userID, config.type, 'true');
  });

  afterEach(async () => {
    await deleteExternalInvitation(invitationId);
  });

  beforeEach(async () => {
    await deleteMailSlurperMails();
  });

  test('sender and external user receive notifications', async () => {
    // Act
    const emailExternalUser = `external${uniqueId}@alkem.io`;
    const message = 'Hello, feel free to join our community!';

    const invitationData = await inviteExternalUser(
      entitiesId.space.roleSetId,
      emailExternalUser,
      message,
      TestUser.GLOBAL_ADMIN
    );

    const invitationInfo = invitationData?.data?.inviteUserToPlatformAndRoleSet;
    invitationId = invitationInfo?.id ?? '';

    await delay(6000);

    const getEmailsData = await getMailsData();
    // Assert
    expect(getEmailsData[1]).toEqual(2);
    expect(getEmailsData[0]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          subject: `Invitation to join ${ecoName}`,
          toAddresses: [emailExternalUser],
        }),
      ])
    );
    expect(getEmailsData[0]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          subject: `Invitation to join ${ecoName}`,
          toAddresses: [users.globalAdmin.email],
        }),
      ])
    );
  });

  test.only('challenge admin (sender) and external user receive notifications', async () => {
    // Act
    const emailExternalUser = `external${uniqueId}@alkem.io`;
    const message = 'Hello, feel free to join our community!';

    const invitationData = await inviteExternalUser(
      entitiesId.challenge.roleSetId,
      emailExternalUser,
      message,
      TestUser.CHALLENGE_ADMIN
    );

    const invitationInfo = invitationData?.data?.inviteUserToPlatformAndRoleSet;
    invitationId = invitationInfo?.id ?? '';

    await delay(6000);

    const getEmailsData = await getMailsData();
    // Assert
    expect(getEmailsData[1]).toEqual(2);
    expect(getEmailsData[0]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          subject: `Invitation to join ${challengeName}`,
          toAddresses: [emailExternalUser],
        }),
      ])
    );
    expect(getEmailsData[0]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          subject: `Invitation to join ${challengeName}`,
          toAddresses: [users.challengeAdmin.email],
        }),
      ])
    );
  });
});
