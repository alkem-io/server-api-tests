// This is critical to be able to use TypeScript aliases in Jest tests
require('tsconfig-paths/register');
import { TestUser } from '@alkemio/tests-lib';
import { registerInKratosOrFail, verifyInKratosOrFail } from '@utils/kratos';
import { registerInAlkemioOrFail } from '@utils/register-in-alkemio-or-fail';
import { UiText } from '@ory/kratos-client';
import { testConfiguration } from '@src/config/test.configuration';
import { stringifyConfig } from '@src/config/create-config-using-envvars';

const main = async () => {
  const testConfig = testConfiguration;
  console.log(`Test config: ${stringifyConfig(testConfig)}`);

  const userNames = Object.values(TestUser).filter(
    x => x !== TestUser.GLOBAL_ADMIN
  );
  // running register flows in parallel brings 3x less waiting times
  // NOTE: may require limit on amount of flows run in parallel

  //DO NOT MAKE THIS PARALLEL AS NEW FLOW TRIES TO OVERRIDE OLD FLOWS RESULTING IN ERRORS
  for (const username of userNames) {
    try {
      await userRegisterFlow(username);
    } catch (error) {
      console.error(`Unable to register user ${username}: ${error}`);
    }
  }
};



const getUserName = (userName: string): [string, string] => {
  const [first, last] = userName.split('.');
  return [first, last];
};

const userRegisterFlow = async (userName: string) => {
  const [firstName, lastName] = getUserName(userName);
  const email = `${userName}@alkem.io`;
  try {
    await registerInKratosOrFail(firstName, lastName, email);

    console.info(`User ${email} registered in Kratos`);
  } catch (e: any) {
    const errorMessages = (e as any).response?.data.ui
      .messages as UiText[];
    const errorMessage =
      errorMessages.map(x => x.text).join('\n') ?? 'Unknown error';
    const userExists =
      errorMessages.filter((x: { id: number }) => x.id === 4000007).length > 0;

    if (userExists) {
      console.warn(`User ${email} already registered in Kratos`);
    } else {
      throw new Error(errorMessage);
    }
  }

  await verifyInKratosOrFail(email);
  console.info(`User ${email} verified`);
  try {
    await registerInAlkemioOrFail(firstName, lastName, email);
    console.info(`User ${email} registered in Alkemio`);
  } catch (e) {
    const err = e as Error;
    if (err.message.indexOf('already registered') > -1) {
      console.warn(`User ${email} already registered in Alkemio`);
    } else {
      throw new Error(err.message);
    }
  }
};

try {
  main();
} catch (error) {
  console.error(error);
}


