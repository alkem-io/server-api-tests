import request from 'supertest';
import { TestUtil } from '../scenario/test.util';
import { TestUser } from '@alkemio/tests-lib';
import { testConfiguration } from '@src/config/test.configuration';

// ToDo
// Add support for connection to the DB and drop/populate DB
//    - GH Issue: https://app.zenspace.com/workspaces/cherrytwist-5ecb98b262ebd9f4aec4194c/issues/cherrytwist/coordination/163
// Add configurations file for environment against which, the tests are going to be run
// Add support for authentication

/**
 * GraphQL request wrapper for unauthenticated scenarios.
 * @param requestParams GraphQL request parameters
 * @api public
 */
export const graphqlRequest = async (requestParams: any) => {
  return await request(testConfiguration.endPoints.graphql.private)
    .post('')
    .send({ ...requestParams })
    .set('Accept', 'application/json');
};

/**
 * GraphQL request wrapper for authenticated scenarios.
 * @param requestParams GraphQL request parameters
 * @param {TestUser} user impersonated user in the authentication scenario
 * @api public
 */
export const graphqlRequestAuth = async (
  requestParams: any,
  user?: TestUser
) => {
  let auth_token = '';

  if (!user) {
    return await graphqlRequest(requestParams);
  } else {
    const res = (await TestUtil.Instance()).userTokenMap.get(user);
    if (!res) throw console.error(`Could not authenticate user ${user}`);
    else auth_token = res as string;
  }

  return await request(testConfiguration.endPoints.graphql.private)
    .post('')
    .send({ ...requestParams })
    .set('Accept', 'application/json')
    .set('Authorization', `Bearer ${auth_token}`);
};

/**
 * Executes a mutation
 * @param mutationData name mutation
 * @param variable name of function containing mutation vriables
 * @param userRole role type
 */
export const mutation = async (
  mutationData: string,
  variablesData: string,
  userRole: TestUser = TestUser.GLOBAL_ADMIN
) => {
  const requestParams = {
    operationName: null,
    query: mutationData,
    variables: variablesData,
  };

  return await graphqlRequestAuth(requestParams, userRole);
};

export const mutationNoAuth = async (
  queryData: string,
  variablesData: string
) => {
  const requestParams = {
    operationName: null,
    query: queryData,
    variables: variablesData,
  };

  return await graphqlRequest(requestParams);
};
