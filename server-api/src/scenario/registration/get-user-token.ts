import { AlkemioClient } from '@alkemio/client-lib';
import { testConfiguration } from '@src/config/test.configuration';


export const getUserToken = async (userEmail: string) => {
  const server = testConfiguration.endPoints.graphql.private;

  if (!server) {
    throw new Error('server url not provided');
  }

  const alkemioClientConfig = {
    apiEndpointPrivateGraphql: server,
    authInfo: {
      credentials: {
        email: userEmail,
        password: testConfiguration.identities.admin.password,
      },
    },
  };

  const alkemioClient = new AlkemioClient(alkemioClientConfig);
  try {
    await alkemioClient.enableAuthentication();
  } catch (e) {
    console.error(
      (e as Error).message,
      `>> identifier: ${userEmail}`
    );
    throw new Error(`Unable to retrieve access token for user ${userEmail}: ${e}`);
  }

  return alkemioClient.apiToken;
};
