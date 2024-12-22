import {
  createUser,
  deleteUser,
} from '@functional-api/contributor-management/user/user.request.params';
import {
  assignUserAsGlobalAdmin,
  assignUserAsGlobalCommunityAdmin,
  assignUserAsGlobalSpacesAdmin,
  removeUserAsGlobalAdmin,
  removeUserAsGlobalCommunityAdmin,
  removeUserAsGlobalSpacesAdmin,
} from '@utils/mutations/authorization-mutation';
import { uniqueId } from '@utils/mutations/create-mutation';

const userEmail = `space${uniqueId}@alkem.io`;
const firstName = `fn${uniqueId}`;
const lastName = `ln${uniqueId}`;
let userId = '';

beforeAll(async () => {
  const res = await createUser({
    firstName: firstName,
    lastName: lastName,
    email: userEmail,
  });
  userId = res?.data?.createUser.id ?? '';
});

afterAll(async () => {
  await deleteUser(userId);
});

describe('Grant / Revoke GA', () => {
  test('Grant user GlobalAdmin privileges', async () => {
    // Act
    const { data } = await assignUserAsGlobalAdmin(userId);

    // Assert
    expect(data?.assignUserAsGlobalAdmin.email).toEqual(userEmail);
  });

  test('Revoke user GlobalAdmin privileges', async () => {
    // Act
    const { data } = await removeUserAsGlobalAdmin(userId);

    // Assert
    expect(data?.removeUserAsGlobalAdmin.email).toEqual(userEmail);
  });
});

describe('Grant / Revoke GCA', () => {
  test('Grant user GlobalCommunityAdmin privileges', async () => {
    // Act
    const { data } = await assignUserAsGlobalCommunityAdmin(userId);

    // Assert
    expect(data?.assignUserAsGlobalCommunityAdmin.email).toEqual(userEmail);
  });

  test('Revoke user GlobalCommunityAdmin privileges', async () => {
    // Act
    const { data } = await removeUserAsGlobalCommunityAdmin(userId);

    // Assert
    expect(data?.removeUserAsGlobalCommunityAdmin.email).toEqual(userEmail);
  });
});

describe('Grant / Revoke GHA', () => {
  test('Grant user GlobalSpaceAdmin privileges', async () => {
    // Act
    const res = await assignUserAsGlobalSpacesAdmin(userId);
    const data = res.body.data.assignUserAsGlobalSpacesAdmin.email;

    // Assert
    expect(data).toEqual(userEmail);
  });

  test('Revoke user GlobalCommunityAdmin privileges', async () => {
    // Act
    const res = await removeUserAsGlobalSpacesAdmin(userId);
    const data = res.body.data.removeUserAsGlobalSpacesAdmin.email;

    // Assert
    expect(data).toEqual(userEmail);
  });
});
