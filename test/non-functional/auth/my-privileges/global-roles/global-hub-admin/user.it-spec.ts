import {
  createUser,
  getUserData,
  deleteUser,
} from '@functional-api/contributor-management/user/user.request.params';
import { TestUser } from '@utils/test.user';
import { uniqueId } from '@utils/mutations/create-mutation';
import {
  sorted__create_read_update_delete_authorizationReset,
  sorted__create_read_update_delete,
} from '../../common';

const userEmail = `space${uniqueId}@alkem.io`;
let userId = '';

beforeAll(async () => {
  const res = await createUser({ email: userEmail });
  userId = res?.data?.createUser.id ?? '';
});

afterAll(async () => {
  await deleteUser(userId);
});

describe('myPrivileges User', () => {
  test('GlobalSpaceAdmin privileges to other User', async () => {
    // Act
    const response = await getUserData(
      userEmail,
      TestUser.GLOBAL_HUBS_ADMIN
    );
    const data = response?.data?.user?.authorization?.myPrivileges ?? [];

    // Assert
    expect(data.sort()).toEqual(
      sorted__create_read_update_delete_authorizationReset
    );
  });

  test('GlobalSpaceAdmin privileges to other User / Profile', async () => {
    // Act
    const response = await getUserData(
      userEmail,
      TestUser.GLOBAL_HUBS_ADMIN
    );
    const data =
      response?.data?.user?.profile?.authorization?.myPrivileges ?? [];

    // Assert
    expect(data.sort()).toEqual(sorted__create_read_update_delete);
  });

  test('GlobalSpaceAdmin privileges to other User / References', async () => {
    // Act
    const response = await getUserData(
      userEmail,
      TestUser.GLOBAL_HUBS_ADMIN
    );
    const data =
      response?.data?.user?.profile?.references?.[0].authorization
        ?.myPrivileges ?? [];

    // Assert
    expect(data.sort()).toEqual(sorted__create_read_update_delete);
  });

  test('GlobalSpaceAdmin privileges to other User / Tagsets', async () => {
    // Act
    const response = await getUserData(
      userEmail,
      TestUser.GLOBAL_HUBS_ADMIN
    );
    const data =
      response?.data?.user?.profile?.tagsets?.[0].authorization?.myPrivileges ??
      [];

    // Assert
    expect(data.sort()).toEqual(sorted__create_read_update_delete);
  });

  test('RegisteredUser privileges to my User / Preferences', async () => {
    // Act
    const response = await getUserData(
      userEmail,
      TestUser.GLOBAL_HUBS_ADMIN
    );
    const data = response?.data?.user?.preferences;

    // Assert
    expect(data).toHaveLength(28);
  });
});
