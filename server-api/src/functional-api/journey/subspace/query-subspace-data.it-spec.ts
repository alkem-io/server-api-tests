import '@utils/array.matcher';

import {
  createSubspace,
  getSubspaceData,
} from './subspace.request.params';
import {
  createOrganization,
  deleteOrganization,
} from '@functional-api/contributor-management/organization/organization.request.params';
import {
  deleteSpace,
  updateSpaceContext,
} from '../space/space.request.params';
import { entitiesId } from '@src/types/entities-helper';
import { createOrgAndSpace } from '@utils/data-setup/entities';
import { UniqueIDGenerator } from '@alkemio/tests-lib';;

const uniqueId = UniqueIDGenerator.getID();

let subsubspaceName = '';
let subsubspaceNameId = '';
let subsubspaceId = '';
let subspaceName = '';
let subspaceId = '';
const additionalSubspaceId = '';
let uniqueTextId = '';
let organizationNameTest = '';
let organizationIdTest = '';
const organizationName = 'org-name' + uniqueId;
const hostNameId = 'org-nameid' + uniqueId;
const spaceName = 'eco-name' + uniqueId;
const spaceNameId = 'eco-nameid' + uniqueId;

beforeAll(async () => {
  await createOrgAndSpace(
    organizationName,
    hostNameId,
    spaceName,
    spaceNameId
  );

  organizationNameTest = `QA organizationNameTest ${uniqueId}`;

  // Create Organization
  const responseCreateOrganization = await createOrganization(
    organizationNameTest,
    'org' + uniqueId
  );
  organizationIdTest =
    responseCreateOrganization.data?.createOrganization.id ?? '';
});

afterAll(async () => {
  await deleteSpace(entitiesId.spaceId);
  await deleteOrganization(entitiesId.organization.id);
  await deleteOrganization(organizationIdTest);
});

afterEach(async () => {
  await deleteSpace(subsubspaceId);
  await deleteSpace(additionalSubspaceId);
  await deleteSpace(subspaceId);
});

beforeEach(async () => {
  uniqueTextId = Math.random()
    .toString(36)
    .slice(-6);
  subspaceName = `testSubspace ${uniqueTextId}`;
  subsubspaceName = `subsubspaceName ${uniqueTextId}`;
  subsubspaceNameId = `opp${uniqueTextId}`;
  organizationNameTest = `organizationNameTest ${uniqueTextId}`;
  // Create Subspace
  const responseCreateSubspace = await createSubspace(
    subspaceName,
    uniqueTextId,
    entitiesId.spaceId
  );
  subspaceId = responseCreateSubspace.data?.createSubspace.id ?? '';
});

describe('Query Subspace data', () => {
  test('should query community through subspace', async () => {
    // Act
    const responseQueryData = await getSubspaceData(
      entitiesId.spaceId,
      subspaceId
    );

    // Assert
    expect(responseQueryData.data?.space.subspace?.profile.displayName).toEqual(
      subspaceName
    );
  });

  test('should query subsubspace through subspace', async () => {
    // Act
    // Create Subsubspace
    const responseCreateSubsubspaceOnSubspace = await createSubspace(
      subsubspaceName,
      subsubspaceNameId,
      subspaceId
    );

    subsubspaceId =
      responseCreateSubsubspaceOnSubspace.data?.createSubspace.id ?? '';

    // Query Subsubspace data through Subspace query
    const responseQueryData = await getSubspaceData(
      entitiesId.spaceId,
      subspaceId
    );

    // Assert
    expect(responseQueryData.data?.space.subspace?.subspaces).toHaveLength(1);
    expect(
      responseQueryData.data?.space.subspace?.subspaces?.[0].profile.displayName
    ).toEqual(subsubspaceName);
    expect(
      responseQueryData.data?.space.subspace?.subspaces?.[0].nameID
    ).toEqual(subsubspaceNameId);
    expect(responseQueryData.data?.space.subspace?.subspaces?.[0].id).toEqual(
      subsubspaceId
    );
  });

  test('should create subsubspace and query the data', async () => {
    // Act
    // Create Subsubspace
    const responseCreateSubsubspaceOnSubspace = await createSubspace(
      subsubspaceName,
      subsubspaceNameId,
      subspaceId
    );

    const createSubsubspaceData =
      responseCreateSubsubspaceOnSubspace.data?.createSubspace;

    subsubspaceId =
      responseCreateSubsubspaceOnSubspace.data?.createSubspace.id ?? '';

    // Query Subsubspace data
    const requestQuerySubsubspace = await getSubspaceData(
      entitiesId.spaceId,
      subsubspaceId
    );
    const requestSubsubspaceData = requestQuerySubsubspace.data?.space.subspace;

    // Assert
    expect(createSubsubspaceData).toEqual(requestSubsubspaceData);
  });

  test('should update a subspace', async () => {
    // Arrange
    const context = {
      vision: 'test vision update',
      impact: 'test impact update',
      who: 'test who update',
    };
    const response = await updateSpaceContext(
      subspaceId,
      subspaceName + 'change',
      context
    );
    const updatedSubspace = response.data?.updateSpace;

    // Act
    const getSubspaceDatas = await getSubspaceData(
      entitiesId.spaceId,
      subspaceId
    );

    // Assert
    expect(updatedSubspace?.profile.displayName).toEqual(
      subspaceName + 'change'
    );
    expect(getSubspaceDatas.data?.space.subspace?.profile.displayName).toEqual(
      subspaceName + 'change'
    );
    expect(getSubspaceDatas.data?.space.subspace?.context.impact).toEqual(
      context.impact
    );
  });
});
