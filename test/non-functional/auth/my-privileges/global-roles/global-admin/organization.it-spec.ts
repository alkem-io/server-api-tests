import { deleteSpace } from '@functional-api/journey/space/space.request.params';
import { TestUser } from '@utils';
import { uniqueId } from '@utils/mutations/create-mutation';
import {
  sorted__create_read_update_delete_grant_authorizationReset,
  sorted__create_read_update_delete_grant,
} from '../../common';
import { createOrgAndSpace } from '@utils/data-setup/entities';
import {
  deleteOrganization,
  getOrganizationData,
} from '@functional-api/contributor-management/organization/organization.request.params';
import { entitiesId } from '@test/types/entities-helper';

const organizationName = 'auth-ga-org-name' + uniqueId;
const hostNameId = 'auth-ga-org-nameid' + uniqueId;
const spaceName = 'auth-ga-eco-name' + uniqueId;
const spaceNameId = 'auth-ga-eco-nameid' + uniqueId;

beforeAll(async () => {
  await createOrgAndSpace(
    organizationName,
    hostNameId,
    spaceName,
    spaceNameId
  );
});
afterAll(async () => {
  await deleteSpace(entitiesId.spaceId);
  await deleteOrganization(entitiesId.organization.id);
});

describe('myPrivileges', () => {
  test('GlobalAdmin privileges to Organization', async () => {
    // Act
    const response = await getOrganizationData(
      entitiesId.organization.id,
      TestUser.GLOBAL_ADMIN
    );
    const data = response.data?.organization.authorization?.myPrivileges ?? [];

    // Assert
    expect(data.sort()).toEqual(
      sorted__create_read_update_delete_grant_authorizationReset
    );
  });

  test('GlobalAdmin privileges to Organization / Verification', async () => {
    // Act
    const response = await getOrganizationData(
      entitiesId.organization.id,
      TestUser.GLOBAL_ADMIN
    );
    const data =
      response.data?.organization.verification.authorization?.myPrivileges ??
      [];

    // Assert
    expect(data.sort()).toEqual(sorted__create_read_update_delete_grant);
  });

  test('GlobalAdmin privileges to Organization / Profile', async () => {
    // Act
    const response = await getOrganizationData(
      entitiesId.organization.id,
      TestUser.GLOBAL_ADMIN
    );
    const data =
      response.data?.organization.profile.authorization?.myPrivileges ?? [];

    // Assert
    expect(data.sort()).toEqual(sorted__create_read_update_delete_grant);
  });

  test('GlobalAdmin privileges to Organization / Profile / References', async () => {
    // Act
    const response = await getOrganizationData(
      entitiesId.organization.id,
      TestUser.GLOBAL_ADMIN
    );
    const data =
      response.data?.organization.profile.references?.[0].authorization
        ?.myPrivileges ?? [];

    // Assert
    expect(data.sort()).toEqual(sorted__create_read_update_delete_grant);
  });

  test('GlobalAdmin privileges to Organization / Profile / Tagsets', async () => {
    // Act
    const response = await getOrganizationData(
      entitiesId.organization.id,
      TestUser.GLOBAL_ADMIN
    );
    const data =
      response.data?.organization.profile.tagsets?.[0].authorization
        ?.myPrivileges ?? [];

    // Assert
    expect(data.sort()).toEqual(sorted__create_read_update_delete_grant);
  });

  test('GlobalAdmin privileges to Organization / Preferences', async () => {
    // Act
    const response = await getOrganizationData(
      entitiesId.organization.id,
      TestUser.GLOBAL_ADMIN
    );
    const data = response.data?.organization.preferences ?? [];
    // Assert
    data.map((item: any) => {
      expect(item.authorization.myPrivileges.sort()).toEqual(
        sorted__create_read_update_delete_grant
      );
    });
    expect(data).toHaveLength(1);
  });
});
