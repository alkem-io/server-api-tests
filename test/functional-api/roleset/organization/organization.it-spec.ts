import { uniqueId } from '@utils/mutations/create-mutation';
import { deleteSpace } from '../../journey/space/space.request.params';
import {
  createChallengeForOrgSpace,
  createOpportunityForChallenge,
  createOrgAndSpace,
} from '@utils/data-setup/entities';
import {
  removeRoleFromOrganization,
  assignRoleToOrganization,
} from '../roles-request.params';
import { entitiesId } from '../../../types/entities-helper';
import { getRoleSetMembersList } from '../roleset.request.params';
import { CommunityRoleType } from '@generated/graphql';
import { deleteOrganization } from '@functional-api/contributor-management/organization/organization.request.params';

const organizationName = 'com-org-name' + uniqueId;
const hostNameId = 'com-org-nameid' + uniqueId;
const spaceName = 'com-eco-name' + uniqueId;
const spaceNameId = 'com-eco-nameid' + uniqueId;
const opportunityName = 'com-opp';
const challengeName = 'com-chal';

beforeAll(async () => {
  await createOrgAndSpace(organizationName, hostNameId, spaceName, spaceNameId);
  await createChallengeForOrgSpace(challengeName);
  await createOpportunityForChallenge(opportunityName);
});

afterAll(async () => {
  await deleteSpace(entitiesId.opportunity.id);
  await deleteSpace(entitiesId.challenge.id);
  await deleteSpace(entitiesId.spaceId);
  await deleteOrganization(entitiesId.organization.id);
});

describe('Assign / Remove organization to community', () => {
  describe('Assign organization', () => {
    afterAll(async () => {
      await removeRoleFromOrganization(
        entitiesId.organization.id,
        entitiesId.opportunity.roleSetId,
        CommunityRoleType.Member
      );
      await removeRoleFromOrganization(
        entitiesId.organization.id,
        entitiesId.challenge.roleSetId,
        CommunityRoleType.Member
      );

      await removeRoleFromOrganization(
        entitiesId.organization.id,
        entitiesId.space.roleSetId,
        CommunityRoleType.Member
      );

      await removeRoleFromOrganization(
        entitiesId.organization.id,
        entitiesId.opportunity.roleSetId,
        CommunityRoleType.Lead
      );
      await removeRoleFromOrganization(
        entitiesId.organization.id,
        entitiesId.challenge.roleSetId,
        CommunityRoleType.Lead
      );

      await removeRoleFromOrganization(
        entitiesId.organization.id,
        entitiesId.space.roleSetId,
        CommunityRoleType.Lead
      );
    });
    test('Assign organization as member to space', async () => {
      // Act
      await assignRoleToOrganization(
        entitiesId.organization.id,
        entitiesId.space.roleSetId,
        CommunityRoleType.Member
      );

      const roleSetMembers = await getRoleSetMembersList(
        entitiesId.space.roleSetId
      );
      const data = roleSetMembers.data?.lookup.roleSet?.memberOrganizations;

      // Assert
      expect(data).toHaveLength(1);
      expect(data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            nameID: hostNameId,
          }),
        ])
      );
    });
    test('Assign organization as member to challenge', async () => {
      // Act
      await assignRoleToOrganization(
        entitiesId.organization.id,
        entitiesId.challenge.roleSetId,
        CommunityRoleType.Member
      );

      const roleSetMembers = await getRoleSetMembersList(
        entitiesId.challenge.roleSetId
      );
      const data = roleSetMembers.data?.lookup.roleSet?.memberOrganizations;

      // Assert
      expect(data).toHaveLength(1);
      expect(data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            nameID: hostNameId,
          }),
        ])
      );
    });
    test('Assign organization as member to opportunity', async () => {
      // Act
      await assignRoleToOrganization(
        entitiesId.organization.id,
        entitiesId.opportunity.roleSetId,
        CommunityRoleType.Member
      );

      const roleSetMembers = await getRoleSetMembersList(
        entitiesId.opportunity.roleSetId
      );
      const data = roleSetMembers.data?.lookup.roleSet?.memberOrganizations;

      // Assert
      expect(data).toHaveLength(1);
      expect(data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            nameID: hostNameId,
          }),
        ])
      );
    });

    test('Assign organization as lead to space', async () => {
      // Act
      await assignRoleToOrganization(
        entitiesId.organization.id,
        entitiesId.space.roleSetId,
        CommunityRoleType.Lead
      );

      const roleSetMembers = await getRoleSetMembersList(
        entitiesId.space.roleSetId
      );
      const data = roleSetMembers.data?.lookup.roleSet?.leadOrganizations;

      // Assert
      expect(data).toHaveLength(1);

      expect(data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            nameID: hostNameId,
          }),
        ])
      );
    });
    test('Assign organization as lead to challenge', async () => {
      // Act
      await assignRoleToOrganization(
        entitiesId.organization.id,
        entitiesId.challenge.roleSetId,
        CommunityRoleType.Lead
      );

      const roleSetMembers = await getRoleSetMembersList(
        entitiesId.challenge.roleSetId
      );
      const data = roleSetMembers.data?.lookup.roleSet?.leadOrganizations;

      // Assert
      expect(data).toHaveLength(1);
      expect(data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            nameID: hostNameId,
          }),
        ])
      );
    });
    test('Assign organization as lead to opportunity', async () => {
      // Act
      await assignRoleToOrganization(
        entitiesId.organization.id,
        entitiesId.opportunity.roleSetId,
        CommunityRoleType.Lead
      );

      const roleSetMembers = await getRoleSetMembersList(
        entitiesId.opportunity.roleSetId
      );
      const data = roleSetMembers.data?.lookup.roleSet?.leadOrganizations;

      // Assert
      expect(data).toHaveLength(1);
      expect(data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            nameID: hostNameId,
          }),
        ])
      );
    });
  });

  describe('Remove organization', () => {
    beforeAll(async () => {
      await assignRoleToOrganization(
        entitiesId.organization.id,
        entitiesId.opportunity.roleSetId,
        CommunityRoleType.Member
      );
      await assignRoleToOrganization(
        entitiesId.organization.id,
        entitiesId.challenge.roleSetId,
        CommunityRoleType.Member
      );

      await assignRoleToOrganization(
        entitiesId.organization.id,
        entitiesId.space.roleSetId,
        CommunityRoleType.Member
      );

      await assignRoleToOrganization(
        entitiesId.organization.id,
        entitiesId.opportunity.roleSetId,
        CommunityRoleType.Lead
      );
      await assignRoleToOrganization(
        entitiesId.organization.id,
        entitiesId.challenge.roleSetId,
        CommunityRoleType.Lead
      );

      await assignRoleToOrganization(
        entitiesId.organization.id,
        entitiesId.space.roleSetId,
        CommunityRoleType.Lead
      );
    });
    test('Remove organization as member from opportunity', async () => {
      // Act
      await removeRoleFromOrganization(
        entitiesId.organization.id,
        entitiesId.opportunity.roleSetId,
        CommunityRoleType.Member
      );

      const roleSetMembers = await getRoleSetMembersList(
        entitiesId.opportunity.roleSetId
      );
      const data = roleSetMembers.data?.lookup.roleSet?.memberOrganizations;

      // Assert
      expect(data).toHaveLength(0);
    });
    test('Remove organization as member from challenge', async () => {
      // Act
      await removeRoleFromOrganization(
        entitiesId.organization.id,
        entitiesId.challenge.roleSetId,
        CommunityRoleType.Member
      );

      const roleSetMembers = await getRoleSetMembersList(
        entitiesId.challenge.roleSetId
      );
      const data = roleSetMembers.data?.lookup.roleSet?.memberOrganizations;

      // Assert
      expect(data).toHaveLength(0);
    });
    test('Remove organization as member from space', async () => {
      // Act
      await removeRoleFromOrganization(
        entitiesId.organization.id,
        entitiesId.space.roleSetId,
        CommunityRoleType.Member
      );

      const roleSetMembers = await getRoleSetMembersList(
        entitiesId.space.roleSetId
      );
      const data = roleSetMembers.data?.lookup.roleSet?.memberOrganizations;

      // Assert
      expect(data).toHaveLength(0);
    });

    test('Remove organization as lead from opportunity', async () => {
      // Act
      await removeRoleFromOrganization(
        entitiesId.organization.id,
        entitiesId.opportunity.roleSetId,
        CommunityRoleType.Lead
      );

      const roleSetMembers = await getRoleSetMembersList(
        entitiesId.opportunity.roleSetId
      );
      const data = roleSetMembers.data?.lookup.roleSet?.leadOrganizations;

      // Assert
      expect(data).toHaveLength(0);
    });
    test('Remove organization as lead from challenge', async () => {
      // Act
      await removeRoleFromOrganization(
        entitiesId.organization.id,
        entitiesId.challenge.roleSetId,
        CommunityRoleType.Lead
      );

      const roleSetMembers = await getRoleSetMembersList(
        entitiesId.challenge.roleSetId
      );
      const data = roleSetMembers.data?.lookup.roleSet?.leadOrganizations;

      // Assert
      expect(data).toHaveLength(0);
    });
    test('Remove organization as lead from space', async () => {
      // Act
      await removeRoleFromOrganization(
        entitiesId.organization.id,
        entitiesId.space.roleSetId,
        CommunityRoleType.Lead
      );

      const roleSetMembers = await getRoleSetMembersList(
        entitiesId.space.roleSetId
      );
      const data = roleSetMembers.data?.lookup.roleSet?.leadOrganizations;

      // Assert
      expect(data).toHaveLength(0);
    });
  });
});
