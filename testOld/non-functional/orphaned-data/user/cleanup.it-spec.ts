import { deleteChallenge } from '@functional-api/journey/challenge/challenge.request.params';
import { deleteSpace } from '@functional-api/journey/space/space.request.params';
import { deleteSubspace } from '@functional-api/journey/opportunity/opportunity.request.params';
import { deleteOrganization } from '@functional-api/contributor-management/organization/organization.request.params';
import { entitiesId } from '@test/types/entities-helper';

afterAll(async () => {
  await deleteSubspace(entitiesId.opportunity.id);
  await deleteSubspace(entitiesId.challenge.id);
  await deleteSpace(entitiesId.spaceId);
  await deleteOrganization(entitiesId.organization.id);
});

describe('User', () => {
  test('test', async () => {
    expect('test').toBe('test');
  });
});
