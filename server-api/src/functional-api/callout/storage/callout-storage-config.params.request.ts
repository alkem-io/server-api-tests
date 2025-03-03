import { TestUser } from '@alkemio/tests-lib';
import { setAuthHeader } from '@utils/graphql.authorization.header';
import { graphqlErrorWrapper } from '@utils/graphql.wrapper';
import { getGraphqlClient } from '@utils/graphqlClient';

export const calloutStorageConfig = async (
  calloutId: string,
  userRole?: TestUser
) => {
  const graphqlClient = getGraphqlClient();
  const callback = (authToken: string | undefined) =>
    graphqlClient.CalloutStorageConfig(
      {
        calloutId,
      },

      setAuthHeader(authToken)
    );

  return graphqlErrorWrapper(callback, userRole);
};

export const calloutPostCardStorageConfig = async (
  calloutId: string,
  userRole?: TestUser
) => {
  const graphqlClient = getGraphqlClient();
  const callback = (authToken: string | undefined) =>
    graphqlClient.CalloutPostStorageConfig(
      {
        calloutId,
      },

      setAuthHeader(authToken)
    );

  return graphqlErrorWrapper(callback, userRole);
};
export const calloutLinkContributionStorageConfig = async (
  calloutId: string,
  userRole?: TestUser
) => {
  const graphqlClient = getGraphqlClient();
  const callback = (authToken: string | undefined) =>
    graphqlClient.CalloutLinkContributionStorageConfig(
      {
        calloutId,
      },

      setAuthHeader(authToken)
    );

  return graphqlErrorWrapper(callback, userRole);
};

export const calloutWhiteboardStorageConfig = async (
  whiteboardId: string,
  calloutId: string,
  //spaceNameId: string,
  userRole?: TestUser
) => {
  const graphqlClient = getGraphqlClient();
  const callback = (authToken: string | undefined) =>
    graphqlClient.CalloutWhiateboardStorageConfig(
      {
        calloutId,
      },

      setAuthHeader(authToken)
    );

  return graphqlErrorWrapper(callback, userRole);
};

export const whiteboardCalloutStorageConfig = async (
  calloutId: string,
  userRole?: TestUser
) => {
  const graphqlClient = getGraphqlClient();
  const callback = (authToken: string | undefined) =>
    graphqlClient.WhiteboardCalloutStorageConfig(
      {
        calloutId,
      },
      setAuthHeader(authToken)
    );

  return graphqlErrorWrapper(callback, userRole);
};
