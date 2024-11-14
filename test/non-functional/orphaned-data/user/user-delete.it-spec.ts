import { uniqueId } from '@test/utils/mutations/create-mutation';
import {
  deleteUser,
  getUserData,
  registerVerifiedUser,
} from '@test/functional-api/contributor-management/user/user.request.params';
import { orgId } from '@test/non-functional/auth/common-auth-variables';

import { entitiesId } from '@test/types/entities-helper';
import {
  assignRoleToUser,
  assignUserToOrganization,
} from '@test/functional-api/roleset/roles-request.params';
import { CommunityRoleType } from '@test/generated/graphql';
import {
  assignUserAsOrganizationAdmin,
  assignUserAsOrganizationOwner,
  removeUserAsOrganizationOwner,
} from '@test/utils/mutations/authorization-organization-mutation';

const domain = 'alkem.io';
const firstName = `fn${uniqueId}`;
const lastName = `ln${uniqueId}`;
let userId = '';

describe('Full User Deletion', () => {
  test('should delete all user related data', async () => {
    // Act
    const email = `dis${uniqueId}@${domain}`;
    await registerVerifiedUser(email, firstName, lastName);

    const userData = await getUserData(email);
    userId = userData?.data?.user.id ?? '';

    // User application to space community
    // const a = await createApplication(entitiesId.space.communityId, userId);
    // console.log(a.body);

    await assignRoleToUser(
      userId,
      entitiesId.space.communityId,
      CommunityRoleType.Member
    );

    await assignRoleToUser(
      userId,
      entitiesId.challenge.communityId,
      CommunityRoleType.Member
    );

    await assignRoleToUser(
      userId,
      entitiesId.opportunity.communityId,
      CommunityRoleType.Member
    );

    await assignRoleToUser(
      userId,
      entitiesId.space.communityId,
      CommunityRoleType.Lead
    );

    await assignRoleToUser(
      userId,
      entitiesId.challenge.communityId,
      CommunityRoleType.Lead
    );

    await assignRoleToUser(
      userId,
      entitiesId.opportunity.communityId,
      CommunityRoleType.Lead
    );

    // Assign user as organization member
    await assignUserToOrganization(orgId, userId);

    // Assign organization owner
    await assignUserAsOrganizationOwner(userId, orgId);

    // Assign organization admin
    await assignUserAsOrganizationAdmin(userId, orgId);

    // Remove user as organization owner
    await removeUserAsOrganizationOwner(userId, orgId);

    // Act
    const resDelete = await deleteUser(userId);

    // Assert
    expect(resDelete?.data?.deleteUser.id).toEqual(userId);
  });
});
