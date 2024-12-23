import {
  assignChallengeAdmin,
  removeUserAsChallengeAdmin,
  userAsChallengeAdminVariablesData,
} from '@utils/mutations/authorization-mutation';
import {
  createSpace,
  spaceVariablesData,
  uniqueId,
} from '@utils/mutations/create-mutation';
import {
  updateSpace,
  updateSpaceVariablesData,
} from '@utils/mutations/update-mutation';
import { TestUser } from '@utils/token.helper';
import { mutation } from '../../utils/graphql.request';
import {
  qaUserId,
  challengeId,
  spaceId,
  notAuthorizedCode,
  dataNull,
  forbiddenCode,
  userNotRegistered,
} from './common-auth-variables';

describe('Challenge Admin - authorization test suite', () => {
  beforeAll(async () => {
    await mutation(
      assignChallengeAdmin,
      userAsChallengeAdminVariablesData(qaUserId, challengeId)
    );
  });

  afterAll(async () => {
    await mutation(
      removeUserAsChallengeAdmin,
      userAsChallengeAdminVariablesData(qaUserId, challengeId)
    );
  });

  test.each`
    mutations      | mut              | variables                                                              | expected
    ${createSpace} | ${'createSpace'} | ${spaceVariablesData('ecox-' + uniqueId, 'ecox-' + uniqueId, spaceId)} | ${notAuthorizedCode}
    ${updateSpace} | ${'updateSpace'} | ${updateSpaceVariablesData(spaceId, 'newnameCA')}                      | ${notAuthorizedCode}
  `(
    'Role challengeAdmin get: $expected, when run mutation: $mut',
    async ({ mutations, variables, expected }) => {
      const response = await mutation(mutations, variables, TestUser.QA_USER);

      const responseData = JSON.stringify(response.body).replace('\\', '');
      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(dataNull);
      expect(responseData).not.toContain(expected);
      expect(responseData).toContain(forbiddenCode);
      expect(responseData).not.toContain(userNotRegistered);
    }
  );
});
