import { TestUser } from '@alkemio/tests-lib';
import { graphqlErrorWrapper } from '@utils/graphql.wrapper';
import { getGraphqlClient } from '@utils/graphqlClient';

export const sendMessageReplyToRoom = async (
  threadID: string,
  roomID: string,
  message: string,
  userRole: TestUser = TestUser.GLOBAL_ADMIN
) => {
  const graphqlClient = getGraphqlClient();
  const callback = (authToken: string | undefined) =>
    graphqlClient.SendMessageReplyToRoom(
      {
        messageData: {
          threadID,
          roomID,
          message,
        },
      },
      {
        authorization: `Bearer ${authToken}`,
      }
    );

  return graphqlErrorWrapper(callback, userRole);
};
