import { TestUser } from '@common/enum/test.user';
import { getGraphqlClient } from '@utils/graphqlClient';
import { graphqlErrorWrapper } from '@utils/graphql.wrapper';

export const eventOnOrganizationVerification = async (
  organizationVerificationID: string,
  eventName: string,
  userRole: TestUser = TestUser.GLOBAL_ADMIN
) => {
  const graphqlClient = getGraphqlClient();
  const callback = (authToken: string | undefined) =>
    graphqlClient.eventOnOrganizationVerification(
      {
        eventData: {
          organizationVerificationID,
          eventName,
        },
      },
      {
        authorization: `Bearer ${authToken}`,
      }
    );

  return graphqlErrorWrapper(callback, userRole);
};
