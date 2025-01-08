/* eslint-disable prettier/prettier */
import '@utils/array.matcher';
import {
  createApplication,
  deleteApplication,
  getRoleSetInvitationsApplications,
  meQuery,
} from '@functional-api/roleset/application/application.request.params';
import {
  deleteInvitation,
  getSpaceInvitation,
  inviteContributors,
} from './invitation.request.params';
import {
  getSpaceData,
  updateSpaceSettings,
} from '../../journey/space/space.request.params';
import { TestUserManager } from '@src/scenario/TestUserManager';
import { readPrivilege } from '@common/constants/privileges';
import {
  removeRoleFromUser,
  assignRoleToUser,
} from '@functional-api/roleset/roles-request.params';
import {
  CommunityMembershipPolicy,
  CommunityRoleType,
  SpacePrivacyMode,
} from '@generated/alkemio-schema';
import { deleteUser } from '../../contributor-management/user/user.request.params';
import { eventOnRoleSetInvitation } from '../roleset-events.request.params';
import { TestUser } from '@alkemio/tests-lib';
import { registerInAlkemioOrFail } from '@src/scenario/registration/register-in-alkemio-or-fail';
import { TestScenarioFactory } from '@src/scenario/TestScenarioFactory';
import { OrganizationWithSpaceModel } from '@src/scenario/models/OrganizationWithSpaceModel';
import { TestScenarioConfig } from '@src/scenario/config/test-scenario-config';

let invitationId = '';
let invitationData: any;

let baseScenario: OrganizationWithSpaceModel;
const scenarioConfig: TestScenarioConfig = {
  name: 'access-invitations',
  space: {
    collaboration: {
      addCallouts: false,
    },
    community: {
      addAdmin: true,
      addMembers: true,
    },
  },
};

beforeAll(async () => {
  baseScenario = await TestScenarioFactory.createBaseScenario(scenarioConfig);

  await updateSpaceSettings(baseScenario.space.id, {
    privacy: {
      mode: SpacePrivacyMode.Private,
    },
    membership: {
      policy: CommunityMembershipPolicy.Applications,
    },
  });
});

afterAll(async () => {
  await TestScenarioFactory.cleanUpBaseScenario(baseScenario);
});

describe('Invitations', () => {
  afterEach(async () => {
    await removeRoleFromUser(
      TestUserManager.users.nonSpaceMember.id,
      baseScenario.space.community.roleSetId,
      CommunityRoleType.Member
    );
    if (invitationId && invitationId.length === 36) {
      await deleteInvitation(invitationId);
      invitationId = '';
    }
  });
  test('should create invitation', async () => {
    // Act
    invitationData = await inviteContributors(
      baseScenario.space.community.roleSetId,
      [TestUserManager.users.nonSpaceMember.id],
      TestUser.GLOBAL_ADMIN
    );

    invitationId = 'invitationIdNotRetrieved';
    const invitationResult =
      invitationData?.data?.inviteContributorsForRoleSetMembership;
    if (invitationResult && invitationResult.length > 0) {
      invitationId = invitationResult[0].id;
    }
    expect(invitationId.length).toEqual(36);

    const getInv = await getSpaceInvitation(
      baseScenario.space.id,
      TestUser.GLOBAL_ADMIN
    );
    const data = getInv?.data?.space?.community?.roleSet.invitations;

    // Assert
    expect(data?.[0].state).toEqual('invited');
  });

  test('should create space invitation, when previous was REJECTED and ARCHIVED', async () => {
    // Arrange
    invitationData = await inviteContributors(
      baseScenario.space.community.roleSetId,
      [TestUserManager.users.nonSpaceMember.id],
      TestUser.GLOBAL_ADMIN
    );

    invitationId = 'invitationIdNotRetrieved';
    const invitationResult =
      invitationData?.data?.inviteContributorsForRoleSetMembership;
    if (invitationResult && invitationResult.length > 0) {
      invitationId = invitationResult[0].id;
    }
    expect(invitationId.length).toEqual(36);

    // Reject and Archive Space invitation
    await eventOnRoleSetInvitation(invitationId, 'REJECT');
    await eventOnRoleSetInvitation(invitationId, 'ARCHIVE');

    // Act
    // Creates invitation second time
    const invitationDataTwo = await inviteContributors(
      baseScenario.space.community.roleSetId,
      [TestUserManager.users.nonSpaceMember.id],
      TestUser.GLOBAL_ADMIN
    );

    let invitationIdTwo = 'invitationId2NotRetrieved';
    const invitationResultTwo =
      invitationDataTwo?.data?.inviteContributorsForRoleSetMembership;
    if (invitationResultTwo && invitationResultTwo.length > 0) {
      invitationIdTwo = invitationResultTwo[0].id;
    }
    expect(invitationIdTwo.length).toEqual(36);

    const userAppsData = await meQuery(TestUser.NON_SPACE_MEMBER);
    const membershipData = userAppsData?.data?.me;

    // Assert
    expect(membershipData?.communityInvitations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          invitation: expect.objectContaining({
            id: invitationIdTwo,
            state: 'invited',
          }),
          spacePendingMembershipInfo: { id: baseScenario.space.id },
        }),
      ])
    );
    await deleteInvitation(invitationIdTwo);
  });

  test('should remove invitation', async () => {
    // Arrange
    invitationData = await inviteContributors(
      baseScenario.space.community.roleSetId,
      [TestUserManager.users.nonSpaceMember.id],
      TestUser.GLOBAL_ADMIN
    );
    invitationId = 'invitationIdNotRetrieved';
    const invitationResult =
      invitationData?.data?.inviteContributorsForRoleSetMembership;
    if (invitationResult && invitationResult.length > 0) {
      invitationId = invitationResult[0].id;
    }
    expect(invitationId.length).toEqual(36);

    // Act
    const removeInv = await deleteInvitation(invitationId);
    const roleSetPendingMemberships = await getRoleSetInvitationsApplications(
      baseScenario.space.community.roleSetId
    );
    // Assert
    expect(removeInv?.data?.deleteInvitation.id).toEqual(invitationId);
    expect(
      roleSetPendingMemberships?.data?.lookup?.roleSet?.invitations
    ).toHaveLength(0);

    // Re-invite to avoid error when deleting in the test setup
    invitationData = await inviteContributors(
      baseScenario.space.community.roleSetId,
      [TestUserManager.users.nonSpaceMember.id],
      TestUser.GLOBAL_ADMIN
    );
    invitationId = 'invitationIdNotRetrieved';
    const invitationResult2 =
      invitationData?.data?.inviteContributorsForRoleSetMembership;
    if (invitationResult2 && invitationResult2.length > 0) {
      invitationId = invitationResult2[0].id;
    }
    expect(invitationId.length).toEqual(36);
  });

  // Skipped until implemented
  test.skip('should throw error for quering not existing invitation', async () => {
    // Act
    const invId = '8bf7752d-59bf-404a-97c8-e906d8377c37';
    const getInv = await getRoleSetInvitationsApplications(
      baseScenario.space.community.roleSetId
    );

    // Assert
    expect(getInv.status).toBe(200);
    expect(getInv?.error?.errors[0].message).toContain(
      `Invitation with ID ${invId} can not be found!`
    );
  });

  test('should throw error for creating the same invitation twice', async () => {
    // Arrange
    invitationData = await inviteContributors(
      baseScenario.space.community.roleSetId,
      [TestUserManager.users.nonSpaceMember.id],
      TestUser.GLOBAL_ADMIN
    );

    invitationId = 'invitationIdNotRetrieved';
    const invitationResult =
      invitationData?.data?.inviteContributorsForRoleSetMembership;
    if (invitationResult && invitationResult.length > 0) {
      invitationId = invitationResult[0].id;
    }
    expect(invitationId.length).toEqual(36);

    // Act
    const invitationDataTwo = await inviteContributors(
      baseScenario.space.community.roleSetId,
      [TestUserManager.users.nonSpaceMember.id],
      TestUser.GLOBAL_ADMIN
    );

    // Assert
    expect(invitationDataTwo?.error?.errors[0].message).toContain(
      `Invitation not possible: An open invitation (ID: ${invitationId}) already exists for contributor ${TestUserManager.users.nonSpaceMember.id} (user) on RoleSet: ${baseScenario.space.community.roleSetId}.`
    );
  });

  test('should return invitations after user is removed', async () => {
    // Act
    invitationData = await inviteContributors(
      baseScenario.space.community.roleSetId,
      [TestUserManager.users.betaTester.id],
      TestUser.GLOBAL_ADMIN
    );

    invitationId = 'invitationIdNotRetrieved';
    const invitationResult =
      invitationData?.data?.inviteContributorsForRoleSetMembership;
    if (invitationResult && invitationResult.length > 0) {
      invitationId = invitationResult[0].id;
    }
    expect(invitationId.length).toEqual(36);

    await deleteUser(TestUserManager.users.betaTester.id);

    const invitationsDataCommunity = await getRoleSetInvitationsApplications(
      baseScenario.space.community.roleSetId
    );

    // Assert
    expect(invitationsDataCommunity.status).toBe(200);
    expect(
      invitationsDataCommunity?.data?.lookup?.roleSet?.invitations
    ).toEqual([]);
    // Immediately re-register, will be a new user - do not want a failing test to leave QA user not registered
    await registerInAlkemioOrFail('beta', 'tester', 'beta.tester@alkem.io');
  });
});

describe('Invitations-flows', () => {
  afterEach(async () => {
    await removeRoleFromUser(
      TestUserManager.users.nonSpaceMember.id,
      baseScenario.space.community.roleSetId,
      CommunityRoleType.Member
    );

    await deleteInvitation(invitationId);
  });

  test('invitee is able to ACCEPT invitation and access space data', async () => {
    // Act
    invitationData = await inviteContributors(
      baseScenario.space.community.roleSetId,
      [TestUserManager.users.nonSpaceMember.id],
      TestUser.GLOBAL_ADMIN
    );
    invitationId = 'invitationIdNotRetrieved';
    const invitationResult =
      invitationData?.data?.inviteContributorsForRoleSetMembership;
    if (invitationResult && invitationResult.length > 0) {
      invitationId = invitationResult[0].id;
    }
    expect(invitationId.length).toEqual(36);

    // Approve Space invitation
    await eventOnRoleSetInvitation(
      invitationId,
      'ACCEPT',
      TestUser.NON_SPACE_MEMBER
    );

    const spaceData = await getSpaceData(
      baseScenario.space.nameId,
      TestUser.NON_SPACE_MEMBER
    );

    // Assert
    expect(spaceData?.data?.space?.authorization?.myPrivileges).toEqual(
      readPrivilege
    );
  });

  test('invitee is able to REJECT and ARCHIVE invitation: no access to space data', async () => {
    // Act
    invitationData = await inviteContributors(
      baseScenario.space.community.roleSetId,
      [TestUserManager.users.nonSpaceMember.id],
      TestUser.GLOBAL_ADMIN
    );
    invitationId = 'invitationIdNotRetrieved';
    const invitationResult =
      invitationData?.data?.inviteContributorsForRoleSetMembership;
    if (invitationResult && invitationResult.length > 0) {
      invitationId = invitationResult[0].id;
    }
    expect(invitationId.length).toEqual(36);

    // Approve Space invitation
    await eventOnRoleSetInvitation(
      invitationId,
      'REJECT',
      TestUser.NON_SPACE_MEMBER
    );

    await eventOnRoleSetInvitation(
      invitationId,
      'ARCHIVE',
      TestUser.NON_SPACE_MEMBER
    );

    const spaceData = await getSpaceData(
      baseScenario.space.nameId,
      TestUser.NON_SPACE_MEMBER
    );

    // Assert
    expect(spaceData?.data?.space?.authorization?.myPrivileges).toEqual(
      undefined
    );
  });

  test('should throw error, when sending invitation to a member', async () => {
    // Arrange
    await assignRoleToUser(
      TestUserManager.users.nonSpaceMember.id,
      baseScenario.space.community.roleSetId,
      CommunityRoleType.Member
    );

    await assignRoleToUser(
      TestUserManager.users.nonSpaceMember.id,
      baseScenario.space.community.roleSetId,
      CommunityRoleType.Member
    );

    // Act
    invitationData = await inviteContributors(
      baseScenario.space.community.roleSetId,
      [TestUserManager.users.nonSpaceMember.id],
      TestUser.GLOBAL_ADMIN
    );

    // Assert
    expect(invitationData?.error?.errors[0].message).toContain(
      `Invitation not possible: Contributor ${TestUserManager.users.nonSpaceMember.id} is already a member of the RoleSet: ${baseScenario.space.community.roleSetId}.`
    );
  });

  test('should fail to send invitation, when user has active application', async () => {
    // Arrange
    const res = await createApplication(
      baseScenario.space.community.roleSetId,
      TestUser.NON_SPACE_MEMBER
    );
    let applicationId = 'applicationIdNotRetrieved';
    if (res?.data?.applyForEntryRoleOnRoleSet) {
      applicationId = res?.data?.applyForEntryRoleOnRoleSet?.id;
    }
    expect(applicationId.length).toEqual(36);

    // Act
    invitationData = await inviteContributors(
      baseScenario.space.community.roleSetId,
      [TestUserManager.users.nonSpaceMember.id],
      TestUser.GLOBAL_ADMIN
    );

    // Assert
    expect(invitationData?.error?.errors[0].message).toContain(
      `Invitation not possible: An open application (ID: ${applicationId}) already exists for contributor ${TestUserManager.users.nonSpaceMember.id} on RoleSet: ${baseScenario.space.community.roleSetId}.`
    );
    await deleteApplication(applicationId);
  });

  test('User with received inviation, cannot apply to the community', async () => {
    // Arrange
    invitationData = await inviteContributors(
      baseScenario.space.community.roleSetId,
      [TestUserManager.users.nonSpaceMember.id],
      TestUser.GLOBAL_ADMIN
    );

    const userDataOrig = await meQuery(TestUser.NON_SPACE_MEMBER);

    const membershipDataOrig = userDataOrig?.data?.me;
    const invitationsCount =
      membershipDataOrig?.communityInvitations?.length ?? 0;
    const applicationsCountOrig =
      membershipDataOrig?.communityApplications?.length ?? 0;

    invitationId = 'invitationIdNotRetrieved';
    const invitationResult =
      invitationData?.data?.inviteContributorsForRoleSetMembership;
    if (invitationResult && invitationResult.length > 0) {
      invitationId = invitationResult[0].id;
    }
    expect(invitationId.length).toEqual(36);

    // Act
    const res = await createApplication(baseScenario.space.community.roleSetId, TestUser.NON_SPACE_MEMBER);
    const userAppsData = await meQuery(TestUser.NON_SPACE_MEMBER);
    console.log('vrushtash li danni?',res.data)

    const membershipData = userAppsData?.data?.me;

    // Assert
    expect(invitationsCount > 0).toBeTruthy();
    expect(membershipData?.communityApplications).toHaveLength(
      applicationsCountOrig
    );
    expect(res.error?.errors[0].message).toContain(
      `Application not possible: An open invitation (ID: ${invitationId}) already exists for contributor ${TestUserManager.users.nonSpaceMember.id} (user) on RoleSet: ${baseScenario.space.community.roleSetId}.`
    );
  });
});

describe('Invitations - Authorization', () => {
  const authErrorUpdateInvitationMessage =
    "Authorization: unable to grant 'update' privilege: event on invitation";
  const authErrorCreateInvitationMessage =
    "Authorization: unable to grant 'community-invite' privilege";
  const accepted = 'accepted';
  const invited = 'invited';

  afterEach(async () => {
    await removeRoleFromUser(
      TestUserManager.users.nonSpaceMember.id,
      baseScenario.space.community.roleSetId,
      CommunityRoleType.Member
    );

    await deleteInvitation(invitationId);
  });
  describe('DDT rights to change invitation state', () => {
    // Arrange
    test.each`
      user                             | text
      ${TestUser.NON_SPACE_MEMBER}     | ${accepted}
      ${TestUser.GLOBAL_ADMIN}         | ${invited}
      ${TestUser.GLOBAL_SUPPORT_ADMIN} | ${invited}
      ${TestUser.SPACE_ADMIN}          | ${invited}
    `(
      'User: "$user", should get: "$text" to update invitation of another user',
      async ({ user, text }) => {
        invitationData = await inviteContributors(
          baseScenario.space.community.roleSetId,
          [TestUserManager.users.nonSpaceMember.id],
          TestUser.GLOBAL_ADMIN
        );
        invitationId = 'invitationIdNotRetrieved';
        const invitationResult =
          invitationData?.data?.inviteContributorsForRoleSetMembership;
        if (invitationResult && invitationResult.length > 0) {
          invitationId = invitationResult[0].id;
        }

        expect(invitationId.length).toEqual(36);

        const result = await eventOnRoleSetInvitation(
          invitationId,
          'ACCEPT',
          user
        );

        // Assert
        expect(result?.data?.eventOnInvitation.state).toContain(text);
      }
    );

    test.each`
      user                     | text
      ${TestUser.SPACE_MEMBER} | ${authErrorUpdateInvitationMessage}
      ${TestUser.QA_USER}      | ${authErrorUpdateInvitationMessage}
    `(
      'User: "$user", should get Error: "$text" to update invitation of another user',
      async ({ user, text }) => {
        invitationData = await inviteContributors(
          baseScenario.space.community.roleSetId,
          [TestUserManager.users.nonSpaceMember.id],
          TestUser.GLOBAL_ADMIN
        );
        invitationId = 'invitationIdNotRetrieved';
        const invitationResult =
          invitationData?.data?.inviteContributorsForRoleSetMembership;
        if (invitationResult && invitationResult.length > 0) {
          invitationId = invitationResult[0].id;
        }

        const result = await eventOnRoleSetInvitation(
          invitationId,
          'ACCEPT',
          user
        );

        // Assert
        expect(result?.error?.errors[0].message).toContain(text);
      }
    );
  });

  describe('DDT users with rights to create invitation', () => {
    // Arrange
    test.each`
      user                             | state
      ${TestUser.GLOBAL_ADMIN}         | ${invited}
      ${TestUser.GLOBAL_SUPPORT_ADMIN} | ${invited}
      ${TestUser.SPACE_ADMIN}          | ${invited}
    `(
      'User: "$user", should get: "$text" to create invitation to another user',
      async ({ user, state }) => {
        invitationData = await inviteContributors(
          baseScenario.space.community.roleSetId,
          [TestUserManager.users.nonSpaceMember.id],
          user
        );

        invitationId = 'invitationIdNotRetrieved';
        let invitationState = 'notretrieved';
        const invitationResult =
          invitationData?.data?.inviteContributorsForRoleSetMembership;
        if (invitationResult && invitationResult.length > 0) {
          invitationId = invitationResult[0].id;
          invitationState = invitationResult[0].state;
        }

        // Assert
        expect(invitationState).toContain(state);
      }
    );
  });

  describe('DDT users with NO rights to create invitation', () => {
    // Arrange
    //
    test.each`
      user                             | text
      ${TestUser.GLOBAL_LICENSE_ADMIN} | ${authErrorCreateInvitationMessage}
      ${TestUser.SPACE_MEMBER}         | ${authErrorCreateInvitationMessage}
      ${TestUser.QA_USER}              | ${authErrorCreateInvitationMessage}
      ${TestUser.NON_SPACE_MEMBER}     | ${authErrorCreateInvitationMessage}
    `(
      'User: "$user", should get: "$text" to create invitation to another user',
      async ({ user, text }) => {
        invitationData = await inviteContributors(
          baseScenario.space.community.roleSetId,
          [TestUserManager.users.nonSpaceMember.id],
          user
        );

        // Assert
        expect(invitationData?.error?.errors[0].message).toContain(text);
      }
    );
  });
});
