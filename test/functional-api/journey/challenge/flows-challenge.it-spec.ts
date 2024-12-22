import { createSubspace, getSubspaceData } from './challenge.request.params';
import '@utils/array.matcher';
import { deleteOrganization } from '@functional-api/contributor-management/organization/organization.request.params';
import { deleteSpace, updateSpaceContext } from '../space/space.request.params';
import { entitiesId } from '@test/types/entities-helper';
// import { uniqueId } from '@utils/mutations/create-mutation';
import { createOrgAndSpace } from '@utils/data-setup/entities';
//import { uniqueId } from '@utils/mutations/journeys/challenge';
export const uniqueId = Math.random()
  .toString(12)
  .slice(-6);

let challengeName = '';
let challengeId = '';
let additionalChallengeId = '';
const organizationName = 'flowch-org-name' + uniqueId;
const hostNameId = 'flowch-org-nameid' + uniqueId;
const spaceName = 'flowch-sp-name' + uniqueId;
const spaceNameId = 'flowch-sp-nameid' + uniqueId;

beforeAll(async () => {
  await createOrgAndSpace(organizationName, hostNameId, spaceName, spaceNameId);
});

afterAll(async () => {
  await deleteSpace(entitiesId.spaceId);
  await deleteOrganization(entitiesId.organization.id);
});

beforeEach(async () => {
  challengeName = `fl-ch-dname-${uniqueId}`;

  const responseCreateChallenge = await createSubspace(
    challengeName,
    uniqueId,
    entitiesId.spaceId
  );
  challengeId = responseCreateChallenge.data?.createSubspace.id ?? '';
});

afterEach(async () => {
  await deleteSpace(challengeId);
});

describe('Flows challenge', () => {
  // ToDo - update test - failing when run in parallel with other suites
  test.skip('should not result unassigned users to a challenge', async () => {
    // Act
    const responseGroupQuery = await getSubspaceData(
      entitiesId.spaceId,
      challengeId
    );

    // Assert
    expect(responseGroupQuery.status).toBe(200);
    expect(
      responseGroupQuery.data?.space.subspace?.community?.roleSet.memberUsers
    ).toHaveLength(1);
    expect(
      responseGroupQuery.data?.space.subspace?.community?.roleSet.leadUsers
    ).toHaveLength(1);
  });

  test('should  modify challenge name to allready existing challenge name and/or textId', async () => {
    // Arrange
    // Create second challenge and get its id and name
    const responseSecondChallenge = await createSubspace(
      challengeName + challengeName,
      uniqueId + uniqueId,
      entitiesId.spaceId
    );
    const secondchallengeName =
      responseSecondChallenge.data?.createSubspace.profile.displayName ?? '';
    additionalChallengeId =
      responseSecondChallenge.data?.createSubspace.id ?? '';

    // Act
    const responseUpdateChallenge = await updateSpaceContext(
      challengeId,
      secondchallengeName,
      {
        vision: 'test vision update',
        impact: 'test impact update',
        who: 'test who update',
      }
    );

    // Assert
    expect(responseUpdateChallenge.status).toBe(200);
    expect(
      responseUpdateChallenge.data?.updateSpace.profile.displayName
    ).toEqual(secondchallengeName);
    await deleteSpace(additionalChallengeId);
  });

  test('should creating 2 challenges with same name', async () => {
    // Act
    // Create second challenge with same name
    const response = await createSubspace(
      challengeName,
      `${uniqueId}-2`,
      entitiesId.spaceId
    );
    const challengeData = response.data?.createSubspace;
    additionalChallengeId = challengeData?.id ?? '';

    // Assert
    expect(challengeData?.profile.displayName).toContain(challengeName);
    await deleteSpace(additionalChallengeId);
  });

  test('should throw error - creating 2 challenges with different name and same nameId', async () => {
    // Act
    // Create second challenge with same textId
    const response = await createSubspace(
      challengeName + challengeName,
      uniqueId,
      entitiesId.spaceId
    );
    // Assert
    expect(JSON.stringify(response)).toContain(
      `Unable to create entity: the provided nameID is already taken: ${uniqueId}`
    );
  });
});
