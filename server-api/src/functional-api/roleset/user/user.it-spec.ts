import {
  getRoleSetUsersInLeadRole,
  getRoleSetUsersInMemberRole,
  getRoleSetMembersList,
} from '../roleset.request.params';
import { users } from '@utils/queries/users-data';
import { assignRoleToUser, removeRoleFromUser } from '../roles-request.params';
import { CommunityRoleType } from '@generated/graphql';
import { TestScenarioFactory } from '@src/models/TestScenarioFactory';
import { OrganizationWithSpaceModel } from '@src/models/types/OrganizationWithSpaceModel';
import { TestScenarioConfig } from '@src/models/test-scenario-config';

let baseScenario: OrganizationWithSpaceModel;
const scenarioConfig: TestScenarioConfig = {
  name: 'user',
  space: {
    collaboration: {
      addCallouts: true,
    },
    subspace: {
      collaboration: {
        addCallouts: true,
      },
      subspace: {
        collaboration: {
          addCallouts: true,
        },
      },
    }
  }
}

beforeAll(async () => {
  baseScenario =
    await TestScenarioFactory.createBaseScenario(scenarioConfig);

  await removeRoleFromUser(
    users.globalAdmin.id,
    baseScenario.subsubspace.community.roleSetId,
    CommunityRoleType.Lead
  );

  await removeRoleFromUser(
    users.globalAdmin.id,
    baseScenario.subspace.community.roleSetId,
    CommunityRoleType.Lead
  );

  await removeRoleFromUser(
    users.globalAdmin.id,
    baseScenario.space.community.roleSetId,
    CommunityRoleType.Lead
  );
});

afterAll(async () => {
  await TestScenarioFactory.cleanUpBaseScenario(baseScenario);
});

describe('Assign / Remove users to community', () => {
  describe('Assign users', () => {
    afterAll(async () => {
      await removeRoleFromUser(
        users.nonSpaceMember.id,
        baseScenario.subsubspace.community.roleSetId,
        CommunityRoleType.Lead
      );

      await removeRoleFromUser(
        users.nonSpaceMember.id,
        baseScenario.subspace.community.roleSetId,
        CommunityRoleType.Lead
      );

      await removeRoleFromUser(
        users.nonSpaceMember.id,
        baseScenario.space.community.roleSetId,
        CommunityRoleType.Lead
      );

      await removeRoleFromUser(
        users.nonSpaceMember.id,
        baseScenario.subsubspace.community.roleSetId,
        CommunityRoleType.Member
      );

      await removeRoleFromUser(
        users.nonSpaceMember.id,
        baseScenario.subspace.community.roleSetId,
        CommunityRoleType.Member
      );

      await removeRoleFromUser(
        users.nonSpaceMember.id,
        baseScenario.space.community.roleSetId,
        CommunityRoleType.Member
      );
    });
    test('Assign user as member to space', async () => {
      // Act
      await assignRoleToUser(
        users.nonSpaceMember.id,
        baseScenario.space.community.roleSetId,
        CommunityRoleType.Member
      );

      const roleSetMembers = await getRoleSetMembersList(
        baseScenario.space.community.roleSetId
      );
      const data = roleSetMembers.data?.lookup.roleSet?.memberUsers;
      // Assert
      expect(data).toHaveLength(2);
      expect(data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            email: users.nonSpaceMember.email,
          }),
        ])
      );
    });

    test('Assign user as member to subspace', async () => {
      // Act
      await assignRoleToUser(
        users.nonSpaceMember.id,
        baseScenario.subspace.community.roleSetId,
        CommunityRoleType.Member
      );

      const roleSetMembers = await getRoleSetMembersList(
        baseScenario.subspace.community.roleSetId
      );
      const data = roleSetMembers.data?.lookup.roleSet?.memberUsers;

      // Assert
      expect(data).toHaveLength(2);
      expect(data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            email: users.nonSpaceMember.email,
          }),
        ])
      );
    });
    test('Assign user as member to subsubspace', async () => {
      // Act
      await assignRoleToUser(
        users.nonSpaceMember.id,
        baseScenario.subsubspace.community.roleSetId,
        CommunityRoleType.Member
      );

      const roleSetMembers = await getRoleSetMembersList(
        baseScenario.subsubspace.community.roleSetId
      );
      const data = roleSetMembers.data?.lookup.roleSet?.memberUsers;

      // Assert
      expect(data).toHaveLength(2);
      expect(data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            email: users.nonSpaceMember.email,
          }),
        ])
      );
    });

    test('Assign user as lead to space', async () => {
      // Act
      await assignRoleToUser(
        users.nonSpaceMember.id,
        baseScenario.space.community.roleSetId,
        CommunityRoleType.Lead
      );

      const roleSetMembers = await getRoleSetMembersList(
        baseScenario.space.community.roleSetId
      );
      const data = roleSetMembers.data?.lookup.roleSet?.leadUsers;

      // Assert
      expect(data).toHaveLength(1);
      expect(data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            email: users.nonSpaceMember.email,
          }),
        ])
      );
    });
    test('Assign user as lead to subspace', async () => {
      // Act
      await assignRoleToUser(
        users.nonSpaceMember.id,
        baseScenario.subspace.community.roleSetId,
        CommunityRoleType.Lead
      );

      const roleSetMembers = await getRoleSetMembersList(
        baseScenario.subspace.community.roleSetId
      );
      const data = roleSetMembers.data?.lookup.roleSet?.leadUsers;

      // Assert
      expect(data).toHaveLength(1);
      expect(data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            email: users.nonSpaceMember.email,
          }),
        ])
      );
    });
    test('Assign user as lead to subsubspace', async () => {
      // Act
      await assignRoleToUser(
        users.nonSpaceMember.id,
        baseScenario.subsubspace.community.roleSetId,
        CommunityRoleType.Lead
      );

      const roleSetMembers = await getRoleSetMembersList(
        baseScenario.subsubspace.community.roleSetId
      );
      const data = roleSetMembers.data?.lookup.roleSet?.leadUsers;

      // Assert
      expect(data).toHaveLength(1);
      expect(data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            email: users.nonSpaceMember.email,
          }),
        ])
      );
    });
  });

  describe('Remove users', () => {
    beforeAll(async () => {
      await assignRoleToUser(
        users.nonSpaceMember.id,
        baseScenario.space.community.roleSetId,
        CommunityRoleType.Member
      );

      await assignRoleToUser(
        users.nonSpaceMember.id,
        baseScenario.subspace.community.roleSetId,
        CommunityRoleType.Member
      );

      await assignRoleToUser(
        users.nonSpaceMember.id,
        baseScenario.subsubspace.community.roleSetId,
        CommunityRoleType.Member
      );

      await assignRoleToUser(
        users.nonSpaceMember.id,
        baseScenario.subsubspace.community.roleSetId,
        CommunityRoleType.Lead
      );

      await assignRoleToUser(
        users.nonSpaceMember.id,
        baseScenario.subspace.community.roleSetId,
        CommunityRoleType.Lead
      );

      await assignRoleToUser(
        users.nonSpaceMember.id,
        baseScenario.space.community.roleSetId,
        CommunityRoleType.Lead
      );
    });
    test('Remove user as lead from subsubspace', async () => {
      // Act
      await removeRoleFromUser(
        users.nonSpaceMember.id,
        baseScenario.subsubspace.community.roleSetId,
        CommunityRoleType.Lead
      );

      const roleSetMembers = await getRoleSetMembersList(
        baseScenario.subsubspace.community.roleSetId
      );
      const data = roleSetMembers.data?.lookup.roleSet?.leadUsers;

      // Assert
      expect(data).toHaveLength(0);
      expect(data).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            email: users.nonSpaceMember.email,
          }),
        ])
      );
    });
    test('Remove user as lead from subspace', async () => {
      // Act
      await removeRoleFromUser(
        users.nonSpaceMember.id,
        baseScenario.subspace.community.roleSetId,
        CommunityRoleType.Lead
      );

      const roleSetMembers = await getRoleSetMembersList(
        baseScenario.subspace.community.roleSetId
      );
      const data = roleSetMembers.data?.lookup.roleSet?.leadUsers;

      // Assert
      expect(data).toHaveLength(0);
      expect(data).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            email: users.nonSpaceMember.email,
          }),
        ])
      );
    });
    test('Remove user as lead from space', async () => {
      // Act
      await removeRoleFromUser(
        users.nonSpaceMember.id,
        baseScenario.space.community.roleSetId,
        CommunityRoleType.Lead
      );

      const roleSetMembers = await getRoleSetMembersList(
        baseScenario.space.community.roleSetId
      );
      const data = roleSetMembers.data?.lookup.roleSet?.leadUsers;

      // Assert
      expect(data).toHaveLength(0);
      expect(data).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            email: users.nonSpaceMember.email,
          }),
        ])
      );
    });

    test('Remove user as member from subsubspace', async () => {
      // Act
      await removeRoleFromUser(
        users.nonSpaceMember.id,
        baseScenario.subsubspace.community.roleSetId,
        CommunityRoleType.Member
      );

      const roleSetMembers = await getRoleSetMembersList(
        baseScenario.subsubspace.community.roleSetId
      );
      const data = roleSetMembers.data?.lookup.roleSet?.memberUsers;

      // Assert
      expect(data).toHaveLength(1);
      expect(data).toEqual(
        expect.not.arrayContaining([
          expect.objectContaining({
            email: users.nonSpaceMember.email,
          }),
        ])
      );
    });
    test('Remove user as member from subspace', async () => {
      // Act
      await removeRoleFromUser(
        users.nonSpaceMember.id,
        baseScenario.subspace.community.roleSetId,
        CommunityRoleType.Member
      );

      const roleSetMembers = await getRoleSetMembersList(
        baseScenario.subspace.community.roleSetId
      );
      const data = roleSetMembers.data?.lookup.roleSet?.memberUsers;

      // Assert
      expect(data).toHaveLength(1);
      expect(data).toEqual(
        expect.not.arrayContaining([
          expect.objectContaining({
            email: users.nonSpaceMember.email,
          }),
        ])
      );
    });
    test('Remove user as member from space', async () => {
      // Act
      await removeRoleFromUser(
        users.nonSpaceMember.id,
        baseScenario.space.community.roleSetId,
        CommunityRoleType.Member
      );

      const roleSetMembers = await getRoleSetMembersList(
        baseScenario.space.community.roleSetId
      );
      const data = roleSetMembers.data?.lookup.roleSet?.memberUsers;

      // Assert
      expect(data).toHaveLength(1);
      expect(data).toEqual(
        expect.not.arrayContaining([
          expect.objectContaining({
            email: users.nonSpaceMember.email,
          }),
        ])
      );
    });
  });
});

describe('Available users', () => {
  describe('Space available users', () => {
    test('Available members', async () => {
      const availableUsersBeforeAssign = await getRoleSetUsersInMemberRole(
        baseScenario.space.community.roleSetId
      );

      await assignRoleToUser(
        users.nonSpaceMember.id,
        baseScenario.space.community.roleSetId,
        CommunityRoleType.Member
      );

      const availableUsers = await getRoleSetUsersInMemberRole(
        baseScenario.space.community.roleSetId
      );

      // Assert
      expect(availableUsers.length).toEqual(
        availableUsersBeforeAssign.length + 1
      );
      expect(availableUsers).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: users.qaUser.id,
          }),
        ])
      );
    });

    test('Available leads', async () => {
      const availableUsersBeforeAssign = await getRoleSetUsersInLeadRole(
        baseScenario.space.community.roleSetId
      );

      await assignRoleToUser(
        users.nonSpaceMember.id,
        baseScenario.space.community.roleSetId,
        CommunityRoleType.Lead
      );

      const availableUsers = await getRoleSetUsersInLeadRole(
        baseScenario.space.community.roleSetId
      );

      // Assert
      expect(availableUsers.length).toEqual(
        availableUsersBeforeAssign.length + 1
      );
      expect(availableUsers).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: users.qaUser.id,
          }),
        ])
      );
    });
  });
  describe('Subspace available users', () => {
    beforeAll(async () => {
      await assignRoleToUser(
        users.nonSpaceMember.id,
        baseScenario.space.community.roleSetId,
        CommunityRoleType.Member
      );
    });
    test('Available members', async () => {
      const availableUsersBeforeAssign = await getRoleSetUsersInMemberRole(
        baseScenario.subspace.community.roleSetId
      );

      await assignRoleToUser(
        users.nonSpaceMember.id,
        baseScenario.subspace.community.roleSetId,
        CommunityRoleType.Member
      );

      const availableUsers = await getRoleSetUsersInMemberRole(
        baseScenario.subspace.community.roleSetId
      );

      // Assert
      expect(availableUsers.length).toEqual(
        availableUsersBeforeAssign.length + 1
      );
      expect(availableUsers).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: users.spaceMember.id,
          }),
        ])
      );
    });

    test('Available leads', async () => {
      const availableUsersBeforeAssign = await getRoleSetUsersInLeadRole(
        baseScenario.subspace.community.roleSetId
      );

      await assignRoleToUser(
        users.nonSpaceMember.id,
        baseScenario.subspace.community.roleSetId,
        CommunityRoleType.Lead
      );

      const availableUsers = await getRoleSetUsersInLeadRole(
        baseScenario.subspace.community.roleSetId
      );

      // Assert
      expect(availableUsers.length).toEqual(
        availableUsersBeforeAssign.length + 1
      );
      expect(availableUsers).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: users.spaceMember.id,
          }),
        ])
      );
    });
  });
  describe('Subsubspace available users', () => {
    beforeAll(async () => {
      await assignRoleToUser(
        users.nonSpaceMember.id,
        baseScenario.space.community.roleSetId,
        CommunityRoleType.Member
      );

      await assignRoleToUser(
        users.nonSpaceMember.id,
        baseScenario.subspace.community.roleSetId,
        CommunityRoleType.Member
      );
    });
    test('Available members', async () => {
      const availableUsersBeforeAssign = await getRoleSetUsersInMemberRole(
        baseScenario.subsubspace.community.roleSetId
      );

      await assignRoleToUser(
        users.nonSpaceMember.id,
        baseScenario.subsubspace.community.roleSetId,
        CommunityRoleType.Member
      );

      const availableUsers = await getRoleSetUsersInMemberRole(
        baseScenario.subsubspace.community.roleSetId
      );

      // Assert
      expect(availableUsers.length).toEqual(
        availableUsersBeforeAssign.length + 1
      );
      expect(availableUsers).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: users.qaUser.id,
          }),
        ])
      );
    });

    test('Available leads', async () => {
      const availableUsersBeforeAssign = await getRoleSetUsersInLeadRole(
        baseScenario.subsubspace.community.roleSetId
      );

      await assignRoleToUser(
        users.nonSpaceMember.id,
        baseScenario.subsubspace.community.roleSetId,
        CommunityRoleType.Lead
      );

      const availableUsers = await getRoleSetUsersInLeadRole(
        baseScenario.subsubspace.community.roleSetId
      );

      // Assert
      expect(availableUsers.length).toEqual(
        availableUsersBeforeAssign.length + 1
      );
      expect(availableUsers).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: users.qaUser.id,
          }),
        ])
      );
    });
  });
});
