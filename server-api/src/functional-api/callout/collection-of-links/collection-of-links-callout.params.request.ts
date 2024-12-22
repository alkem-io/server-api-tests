import { CalloutType, CalloutVisibility } from '@generated/alkemio-schema';
import { TestUser } from '@common/enum/test.user';
import { graphqlErrorWrapper } from '@utils/graphql.wrapper';
import { getGraphqlClient } from '@utils/graphqlClient';

export const createLinkCollectionCallout = async (
  collaborationID: string,
  nameID: string,
  displayName: string,
  userRole: TestUser = TestUser.GLOBAL_ADMIN
) => {
  const graphqlClient = getGraphqlClient();
  const callback = (authToken: string | undefined) =>
    graphqlClient.CreateCalloutOnCollaboration(
      {
        calloutData: {
          collaborationID,
          nameID,
          type: CalloutType.LinkCollection,

          visibility: CalloutVisibility.Published,
          framing: {
            profile: {
              displayName,
              description: 'Link collection callout',
            },
          },
        },
      },
      {
        authorization: `Bearer ${authToken}`,
      }
    );

  return graphqlErrorWrapper(callback, userRole);
};

export const createLinkOnCallout = async (
  calloutID: string,
  userRole: TestUser = TestUser.GLOBAL_ADMIN
) => {
  const graphqlClient = getGraphqlClient();
  const callback = (authToken: string | undefined) =>
    graphqlClient.CreateContributionOnCallout(
      {
        contributionData: {
          calloutID,
          link: {
            profile: {
              displayName: 'Link Callout reference name',
              description: 'Link Callout reference description',
            },
          },
        },
      },
      {
        authorization: `Bearer ${authToken}`,
      }
    );

  return graphqlErrorWrapper(callback, userRole);
};
