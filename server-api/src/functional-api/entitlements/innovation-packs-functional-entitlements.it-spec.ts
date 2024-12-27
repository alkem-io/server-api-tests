/**
 * Functional tests for Innovation Pack feature.
 *
 * This test suite verifies the creation and deletion of innovation packs by a VC Campaign user.
 *
 * The tests include:
 * - Assigning and removing platform roles to/from TestUserManager.users.
 * - Creating innovation packs with different names.
 * - Verifying entitlements before and after creating innovation packs.
 * - Handling errors when creating innovation packs over the license limit.
 *
 * The tests use the following utilities and queries:
 * - `assignPlatformRoleToUser` and `removePlatformRoleFromUser` for role management.
 * - `getMyEntitlementsQuery` to fetch user entitlements.
 * - `createInnovationPack` and `deleteInnovationPack` for innovation pack management.
 * - `getAccountMainEntities` to fetch account-related data.
 *
 * The tests are organized as follows:
 * - `beforeAll` hook assigns the VC Campaign role to a non-space member user.
 * - `afterAll` hook cleans up by deleting created innovation packs and removing the assigned role.
 * - Parameterized tests to create innovation packs and verify entitlements.
 * - A test to handle the scenario where the innovation pack creation exceeds the license limit.
 */

import { TestUser } from '@alkemio/tests-lib';
import { TestUserManager } from '@src/scenario/test.user.manager';
import { getMyEntitlementsQuery } from './entitlements-request.params';
import {
  createInnovationPack,
  deleteInnovationPack,
} from '@functional-api/innovation-pack/innovation_pack.request.params';
import { getAccountMainEntities } from '../account/account.params.request';
import { UniqueIDGenerator } from '@alkemio/tests-lib';;
const uniqueId = UniqueIDGenerator.getID();
import { PlatformRole } from '@generated/graphql';
import { assignPlatformRoleToUser, removePlatformRoleFromUser } from '@functional-api/platform/authorization-platform-mutation';

let packId = '';
const packName = `packname-${uniqueId}`;

describe('Functional tests - Innovation Pack', () => {
  afterEach(async () => {
    const spaceData = await getAccountMainEntities(
      TestUserManager.users.nonSpaceMember.accountId,
      TestUser.NON_SPACE_MEMBER
    );
    const packs = spaceData.data?.account?.innovationPacks;
    for (const pack of packs || []) {
      const packId = pack.id;
      await deleteInnovationPack(packId, TestUser.GLOBAL_ADMIN);
    }
  });
  describe('VC Campaign user innovation pack creation', () => {
    beforeAll(async () => {
      await assignPlatformRoleToUser(
        TestUserManager.users.nonSpaceMember.id,
        PlatformRole.VcCampaign
      );
    });
    const allPrivileges = [
      'ACCOUNT_SPACE_FREE',
      'ACCOUNT_INNOVATION_HUB',
      'ACCOUNT_VIRTUAL_CONTRIBUTOR',
      'ACCOUNT_INNOVATION_PACK',
    ].sort();
    const withoutPack = [
      'ACCOUNT_SPACE_FREE',
      'ACCOUNT_VIRTUAL_CONTRIBUTOR',
      'ACCOUNT_INNOVATION_HUB',
    ].sort();

    afterAll(async () => {
      await removePlatformRoleFromUser(
        TestUserManager.users.nonSpaceMember.id,
        PlatformRole.VcCampaign
      );
    });

    test.each`
      packName               | availableEntitlements | error
      ${`pack1-${uniqueId}`} | ${allPrivileges}      | ${undefined}
      ${`pack2-${uniqueId}`} | ${allPrivileges}      | ${undefined}
      ${`pack3-${uniqueId}`} | ${allPrivileges}      | ${undefined}
    `(
      'User: VC campaign has license $availableEntitlements to creates an innovation pack with name: $packName',
      async ({ packName, availableEntitlements, error }) => {
        // Arrange
        const response = await getMyEntitlementsQuery(TestUser.NON_SPACE_MEMBER);

        // Act
        const createPack = await createInnovationPack(
          packName,
          packName,
          TestUserManager.users.nonSpaceMember.accountId,
          TestUser.NON_SPACE_MEMBER
        );
        packId = createPack?.data?.createInnovationPack?.id ?? '';

        // Assert
        expect(
          response?.data?.me.user?.account?.license?.availableEntitlements?.sort()
        ).toEqual(availableEntitlements);
        expect(createPack?.error?.errors?.[0].message).toEqual(error);
      }
    );

    test('Create a innovation pack over the license limit', async () => {
      // Arrange
      // Create maximum allowed packs first
      const maxPacks = 3;
      for (let i = 0; i < maxPacks; i++) {
        const a = await createInnovationPack(
          `setup-pack-${i}-${uniqueId}`,
          `setup-pack-${i}-${uniqueId}`,
          TestUserManager.users.nonSpaceMember.accountId,
          TestUser.NON_SPACE_MEMBER
        );
      }
      const response = await getMyEntitlementsQuery(TestUser.NON_SPACE_MEMBER);

      // Act
      const createPack = await createInnovationPack(
        `excess-pack-${uniqueId}`,
        `excess-pack-${uniqueId}`,
        TestUserManager.users.nonSpaceMember.accountId,
        TestUser.NON_SPACE_MEMBER
      );

      // Assert
      expect(createPack?.error?.errors).toHaveLength(1);
      expect(
        response?.data?.me.user?.account?.license?.availableEntitlements?.sort()
      ).toEqual(withoutPack);
      expect(createPack?.error?.errors?.[0].message).toEqual(
        `Unable to create account-innovation-pack on account: ${TestUserManager.users.nonSpaceMember.accountId}. Entitlement limit of 3 of type account-innovation-pack reached`
      );
    });
  });
});
