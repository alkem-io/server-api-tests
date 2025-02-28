/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  deleteMailSlurperMails,
  getMailsData,
} from '@utils/mailslurper.rest.requests';
import { updateSpaceSettings } from '@functional-api/journey/space/space.request.params';
import { delay } from '@alkemio/tests-lib';
import { TestUserManager } from '@src/scenario/TestUserManager';
import {
  deleteInvitation,
  inviteContributors,
} from '@functional-api/roleset/invitations/invitation.request.params';
import { TestUser } from '@alkemio/tests-lib';
import { PreferenceType } from '@generated/graphql';
import { changePreferenceUser } from '@functional-api/contributor-management/user/user-preferences-mutation';
import { TestScenarioFactory } from '@src/scenario/TestScenarioFactory';
import { OrganizationWithSpaceModel } from '@src/scenario/models/OrganizationWithSpaceModel';
import { TestScenarioConfig } from '@src/scenario/config/test-scenario-config';

let invitationId = '';
let preferencesConfig: any[] = [];

let baseScenario: OrganizationWithSpaceModel;
const scenarioConfig: TestScenarioConfig = {
  name: 'notifications-invitation',
  space: {
    collaboration: {
      addPostCallout: true,
      addPostCollectionCallout: true,
      addWhiteboardCallout: true,
    },
    community: {
      admins: [TestUser.SPACE_ADMIN],
      members: [
        TestUser.SPACE_MEMBER,
        TestUser.SPACE_ADMIN,
        TestUser.SUBSPACE_MEMBER,
        TestUser.SUBSPACE_ADMIN,
        TestUser.SUBSUBSPACE_MEMBER,
        TestUser.SUBSUBSPACE_ADMIN,
      ],
    },
    subspace: {
      collaboration: {
        addPostCallout: true,
        addPostCollectionCallout: true,
        addWhiteboardCallout: true,
      },
      community: {
        admins: [TestUser.SUBSPACE_ADMIN],
        members: [
          TestUser.SUBSPACE_MEMBER,
          TestUser.SUBSPACE_ADMIN,
          TestUser.SUBSUBSPACE_MEMBER,
          TestUser.SUBSUBSPACE_ADMIN,
        ],
      },
      subspace: {
        collaboration: {
          addPostCallout: true,
          addPostCollectionCallout: true,
          addWhiteboardCallout: true,
        },
        community: {
          admins: [TestUser.SUBSUBSPACE_ADMIN],
          members: [TestUser.SUBSUBSPACE_MEMBER, TestUser.SUBSUBSPACE_ADMIN],
        },
      },
    },
  },
};

beforeAll(async () => {
  await deleteMailSlurperMails();

  baseScenario = await TestScenarioFactory.createBaseScenario(scenarioConfig);

  await updateSpaceSettings(baseScenario.space.id, {
    membership: {
      allowSubspaceAdminsToInviteMembers: true,
    },
  });

  await updateSpaceSettings(baseScenario.subspace.id, {
    membership: {
      allowSubspaceAdminsToInviteMembers: true,
    },
  });

  preferencesConfig = [
    {
      userID: TestUserManager.users.spaceAdmin.id,
      type: PreferenceType.NotificationCommunityInvitationUser,
    },

    {
      userID: TestUserManager.users.subspaceAdmin.id,
      type: PreferenceType.NotificationCommunityInvitationUser,
    },

    {
      userID: TestUserManager.users.subsubspaceAdmin.id,
      type: PreferenceType.NotificationCommunityInvitationUser,
    },

    {
      userID: TestUserManager.users.nonSpaceMember.id,
      type: PreferenceType.NotificationCommunityInvitationUser,
    },

    {
      userID: TestUserManager.users.qaUser.id,
      type: PreferenceType.NotificationCommunityInvitationUser,
    },
  ];
});

afterAll(async () => {
  await TestScenarioFactory.cleanUpBaseScenario(baseScenario);
});

describe('Notifications - invitations', () => {
  beforeAll(async () => {
    await changePreferenceUser(
      TestUserManager.users.globalSupportAdmin.id,
      PreferenceType.NotificationCommunityInvitationUser,
      'false'
    );
    await changePreferenceUser(
      TestUserManager.users.globalAdmin.id,
      PreferenceType.NotificationCommunityInvitationUser,
      'false'
    );
    for (const config of preferencesConfig)
      await changePreferenceUser(config.userID, config.type, 'true');
  });

  afterEach(async () => {
    await deleteInvitation(invitationId);
  });

  beforeEach(async () => {
    await deleteMailSlurperMails();
  });

  test('non space user receive invitation for SPACE community from space admin', async () => {
    // Act
    const invitationData = await inviteContributors(
      baseScenario.space.community.roleSetId,
      [TestUserManager.users.nonSpaceMember.id],
      TestUser.SPACE_ADMIN
    );
    const invitationsInfo =
      invitationData?.data?.inviteContributorsEntryRoleOnRoleSet;
    invitationId = 'invitationsInfoNotRetrieved';
    if (invitationsInfo && invitationsInfo.length > 0) {
      invitationId = invitationsInfo[0].id;
    }

    await delay(6000);

    const getEmailsData = await getMailsData();
    // Assert
    expect(getEmailsData[1]).toEqual(1);
    expect(getEmailsData[0]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          subject: `Invitation to join ${baseScenario.space.about.profile.displayName}`,
          toAddresses: [TestUserManager.users.nonSpaceMember.email],
        }),
      ])
    );
  });

  test('non space user receive invitation for SPACE community from subspace admin', async () => {
    // Act
    const invitationData = await inviteContributors(
      baseScenario.space.community.roleSetId,
      [TestUserManager.users.qaUser.id],
      TestUser.SUBSPACE_ADMIN
    );
    const invitationsInfo =
      invitationData?.data?.inviteContributorsEntryRoleOnRoleSet;
    invitationId = 'invitationsInfoNotRetrieved';
    if (invitationsInfo && invitationsInfo.length > 0) {
      invitationId = invitationsInfo[0].id;
    }

    await delay(6000);

    const getEmailsData = await getMailsData();
    // Assert
    expect(getEmailsData[1]).toEqual(1);
    expect(getEmailsData[0]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          subject: `Invitation to join ${baseScenario.space.about.profile.displayName}`,
          toAddresses: [TestUserManager.users.qaUser.email],
        }),
      ])
    );
  });

  test('non space user receive invitation for CHALLENGE community from subspace admin', async () => {
    // Act
    const invitationData = await inviteContributors(
      baseScenario.subspace.community.roleSetId,
      [TestUserManager.users.qaUser.id],
      TestUser.SUBSPACE_ADMIN
    );
    const invitationsInfo =
      invitationData?.data?.inviteContributorsEntryRoleOnRoleSet;
    invitationId = 'invitationsInfoNotRetrieved';
    if (invitationsInfo && invitationsInfo.length > 0) {
      invitationId = invitationsInfo[0].id;
    }

    await delay(6000);

    const getEmailsData = await getMailsData();
    // Assert
    expect(getEmailsData[1]).toEqual(1);
    expect(getEmailsData[0]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          subject: `Invitation to join ${baseScenario.subspace.about.profile.displayName}`,
          toAddresses: [TestUserManager.users.qaUser.email],
        }),
      ])
    );
  });

  test("non space user don't receive invitation for CHALLENGE community from subsubspace admin", async () => {
    // Act
    const invitationData = await inviteContributors(
      baseScenario.subspace.community.roleSetId,
      [TestUserManager.users.qaUser.id],
      TestUser.SUBSUBSPACE_ADMIN
    );
    const invitationsInfo =
      invitationData?.data?.inviteContributorsEntryRoleOnRoleSet;
    invitationId = 'invitationsInfoNotRetrieved';
    if (invitationsInfo && invitationsInfo.length > 0) {
      invitationId = invitationsInfo[0].id;
    }

    await delay(6000);

    const getEmailsData = await getMailsData();
    // Assert
    expect(getEmailsData[1]).toEqual(0);
    expect(invitationData.error?.errors[0].message).toEqual(
      `Contributor is not a member of the parent community (${baseScenario.space.community.roleSetId}) and the current user does not have the privilege to invite to the parent community`
    );
  });

  test('space member receive invitation for CHALLENGE community from subsubspace admin', async () => {
    // Act
    const invitationData = await inviteContributors(
      baseScenario.subspace.community.roleSetId,
      [TestUserManager.users.spaceMember.id],
      TestUser.SUBSUBSPACE_ADMIN
    );
    const invitationsInfo =
      invitationData?.data?.inviteContributorsEntryRoleOnRoleSet;
    invitationId = 'invitationsInfoNotRetrieved';
    if (invitationsInfo && invitationsInfo.length > 0) {
      invitationId = invitationsInfo[0].id;
    }

    await delay(6000);

    const getEmailsData = await getMailsData();
    // Assert
    expect(getEmailsData[1]).toEqual(1);
    expect(getEmailsData[0]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          subject: `Invitation to join ${baseScenario.subspace.about.profile.displayName}`,
          toAddresses: [TestUserManager.users.spaceMember.email],
        }),
      ])
    );
  });

  test('non space user receive invitation for OPPORTUNITY community from subsubspace admin', async () => {
    // Act
    const invitationData = await inviteContributors(
      baseScenario.subsubspace.community.roleSetId,
      [TestUserManager.users.qaUser.id],
      TestUser.SUBSUBSPACE_ADMIN
    );
    const invitationsInfo =
      invitationData?.data?.inviteContributorsEntryRoleOnRoleSet;
    invitationId = 'invitationsInfoNotRetrieved';
    if (invitationsInfo && invitationsInfo.length > 0) {
      invitationId = invitationsInfo[0].id;
    }

    await delay(6000);

    const getEmailsData = await getMailsData();
    // Assert
    expect(getEmailsData[1]).toEqual(1);
    expect(getEmailsData[0]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          subject: `Invitation to join ${baseScenario.subsubspace.about.profile.displayName}`,
          toAddresses: [TestUserManager.users.qaUser.email],
        }),
      ])
    );
  });
  test("non space user doesn't receive invitation for SPACE community from space admin", async () => {
    // Arrange
    await changePreferenceUser(
      TestUserManager.users.nonSpaceMember.id,
      PreferenceType.NotificationCommunityInvitationUser,
      'false'
    );

    // Act
    const invitationData = await inviteContributors(
      baseScenario.space.community.roleSetId,
      [TestUserManager.users.nonSpaceMember.id],
      TestUser.SPACE_ADMIN
    );
    const invitationsInfo =
      invitationData?.data?.inviteContributorsEntryRoleOnRoleSet;
    invitationId = 'invitationsInfoNotRetrieved';
    if (invitationsInfo && invitationsInfo.length > 0) {
      invitationId = invitationsInfo[0].id;
    }

    await delay(6000);

    const getEmailsData = await getMailsData();
    // Assert
    expect(getEmailsData[1]).toEqual(0);
  });

  test("non space user doesn't receive invitation for CHALLENGE community from subspace admin, flag disabled", async () => {
    // Arrange
    await updateSpaceSettings(baseScenario.subspace.id, {
      membership: {
        allowSubspaceAdminsToInviteMembers: false,
      },
    });

    // Act
    const invitationData = await inviteContributors(
      baseScenario.subspace.community.roleSetId,
      [TestUserManager.users.qaUser.displayName],
      TestUser.SUBSPACE_ADMIN
    );
    const invitationsInfo =
      invitationData?.data?.inviteContributorsEntryRoleOnRoleSet;
    invitationId = 'invitationsInfoNotRetrieved';
    if (invitationsInfo && invitationsInfo.length > 0) {
      invitationId = invitationsInfo[0].id;
    }

    await delay(6000);

    const getEmailsData = await getMailsData();
    // Assert
    expect(getEmailsData[1]).toEqual(0);
  });
});
