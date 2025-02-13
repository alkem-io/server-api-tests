/* eslint-disable @typescript-eslint/no-explicit-any */
import '@utils/array.matcher';
import {
  createVirtualContributorOnAccountKnowledgeBasedWithCallout,
  createVirtualContributorOnAccountSpaceBased,
  deleteVirtualContributorOnAccount,
  queryVCData,
  queryVCKnowledgeBase,
  queryVCKnowledgePrivileges,
  queryVCStorageConfig,
  updateVirtualContributor,
  updateVirtualContributorSettings,
} from './vc.request.params';
import {
  createSpaceAndGetData,
  deleteSpace,
  updateSpacePlatformSettings,
} from '../../journey/space/space.request.params';
import { TestUser } from '@alkemio/tests-lib';
import { TestUserManager } from '@src/scenario/TestUserManager';
import {
  CommunityMembershipPolicy,
  SpacePrivacyMode,
} from '@generated/alkemio-schema';
import {
  assignLicensePlanToAccount,
  getLicensePlanByName,
} from '@functional-api/license/license.params.request';
import { SpaceVisibility } from '@generated/graphql';
import { UniqueIDGenerator } from '@alkemio/tests-lib';
import { OrganizationWithSpaceModel } from '@src/scenario/models/OrganizationWithSpaceModel';
import { TestScenarioFactory } from '@src/scenario/TestScenarioFactory';
import { TestScenarioConfig } from '@src/scenario/config/test-scenario-config';
import { getAccountMainEntities } from '@functional-api/account/account.params.request';
import {
  sorted__create_read_update_delete_contribute_readAbout,
  sorted__create_read_update_delete_contribute_readAbout_fileDelete_fileUpload,
  sorted__create_read_update_delete_contribute_createCallout_readAbout,
  sorted__create_read_update_delete_createCallout_readAbout_transferAccept_transferOffer,
  sorted__create_read_update_delete_grant_platformAdmin_readAbout,
  sorted__create_read_update_delete_grant_readAbout,
  sorted__create_read_update_delete_readAbout_fileDelete_fileUpload,
} from '@common/constants/privileges';
import { SearchVisibility } from '@alkemio/client-lib/dist/types/alkemio-schema';
const uniqueId = UniqueIDGenerator.getID();

const spaceNameId = 'appl-eco-nameid' + uniqueId;
let vcSpaceId = '';
let vcLicensePlanId = '';
const spaceNameVC = 'appl-sp-name' + uniqueId;
const spaceNameIdVC = 'appl-sp-nameid' + uniqueId;

let vcKnowledgeBasedId = '';
let vcSpaceBasedId = '';
let vcSpaceAccountId = '';
const vcSpaceName = 'vcSpaceName1' + uniqueId;
const vcKnowledgeName = 'vcKnowledgeName1' + uniqueId;

let baseScenario: OrganizationWithSpaceModel;

const scenarioConfig: TestScenarioConfig = {
  name: 'virtual-contributor-access',
  space: {
    collaboration: {
      addPostCallout: true,
      addPostCollectionCallout: true,
      addWhiteboardCallout: true,
    },
    community: {
      members: [TestUser.SPACE_MEMBER, TestUser.SPACE_ADMIN],
      admins: [TestUser.SPACE_ADMIN],
    },
    settings: {
      privacy: {
        mode: SpacePrivacyMode.Public,
      },
      membership: {
        policy: CommunityMembershipPolicy.Applications,
      },
    },
  },
};

beforeAll(async () => {
  baseScenario = await TestScenarioFactory.createBaseScenario(scenarioConfig);

  const vcLicensePlan = await getLicensePlanByName(
    'FEATURE_VIRTUAL_CONTRIBUTORS'
  );
  vcLicensePlanId = vcLicensePlan[0].id;

  await assignLicensePlanToAccount(
    baseScenario.organization.accountId,
    vcLicensePlanId
  );

  await updateSpacePlatformSettings(
    baseScenario.space.id,
    spaceNameId,
    SpaceVisibility.Active
  );

  const responceVcSpace = await createSpaceAndGetData(
    spaceNameVC,
    spaceNameIdVC,
    TestUserManager.users.betaTester.accountId
  );
  const vcSpaceData = responceVcSpace?.data?.space;
  vcSpaceId = vcSpaceData?.id ?? '';
  vcSpaceAccountId = vcSpaceData?.account?.id ?? '';

  const vcSpaceBasedData = await createVirtualContributorOnAccountSpaceBased(
    vcSpaceName,
    vcSpaceAccountId,
    vcSpaceId,
    TestUser.GLOBAL_BETA_TESTER
  );
  vcSpaceBasedId = vcSpaceBasedData?.data?.createVirtualContributor?.id ?? '';

  const vcKnowledgeBasedData =
    await createVirtualContributorOnAccountKnowledgeBasedWithCallout(
      vcKnowledgeName,
      TestUserManager.users.betaTester.accountId,
      TestUser.GLOBAL_BETA_TESTER
    );

  vcKnowledgeBasedId = vcKnowledgeBasedData;

  await updateVirtualContributor(vcSpaceBasedId, SearchVisibility.Public);
});

afterAll(async () => {
  const getVirtualContributors = await getAccountMainEntities(
    TestUserManager.users.betaTester.accountId
  );
  const returnedVcs =
    getVirtualContributors.data?.lookup.account?.virtualContributors ?? [];
  for (const entity of returnedVcs) {
    await deleteVirtualContributorOnAccount(entity.id).catch();
  }
  await deleteSpace(vcSpaceId);

  await TestScenarioFactory.cleanUpBaseScenario(baseScenario);
});

describe('Virtual Contributor ACCESS - All Public - Visibility Public / BoK / Public', () => {
  beforeAll(async () => {
    await updateVirtualContributor(vcSpaceBasedId, SearchVisibility.Public);
    await updateVirtualContributor(vcKnowledgeBasedId, SearchVisibility.Public);

    await updateVirtualContributorSettings(vcSpaceBasedId, true);
    await updateVirtualContributorSettings(vcKnowledgeBasedId, true);
  });

  describe('Virtual contributor', () => {
    //   failing    ${undefined}                   | ${['READ', 'READ_ABOUT']}
    test.each`
      userRole                       | privileges
      ${TestUser.NON_SPACE_MEMBER}   | ${['READ_ABOUT']}
      ${TestUser.SPACE_ADMIN}        | ${['READ_ABOUT']}
      ${TestUser.SPACE_MEMBER}       | ${['READ_ABOUT']}
      ${TestUser.GLOBAL_ADMIN}       | ${sorted__create_read_update_delete_grant_platformAdmin_readAbout}
      ${TestUser.GLOBAL_BETA_TESTER} | ${sorted__create_read_update_delete_contribute_readAbout}
    `(
      'User: "$userRole" has this privileges: "$privileges" to spaceBasedVC',
      async ({ userRole, privileges }) => {
        const res = await queryVCData(vcSpaceBasedId, userRole);
        const data =
          res.data?.lookup?.virtualContributor?.authorization?.myPrivileges;

        expect(data?.sort()).toEqual(privileges);
      }
    );
    //   failing    ${undefined}                   | ${['READ', 'READ_ABOUT']}
    test.each`
      userRole                       | privileges
      ${TestUser.NON_SPACE_MEMBER}   | ${['READ_ABOUT']}
      ${TestUser.SPACE_ADMIN}        | ${['READ_ABOUT']}
      ${TestUser.SPACE_MEMBER}       | ${['READ_ABOUT']}
      ${TestUser.GLOBAL_ADMIN}       | ${sorted__create_read_update_delete_grant_platformAdmin_readAbout}
      ${TestUser.GLOBAL_BETA_TESTER} | ${sorted__create_read_update_delete_contribute_readAbout}
    `(
      'User: "$userRole" has this privileges: "$privileges" to knowledgeBasedVC',
      async ({ userRole, privileges }) => {
        const res = await queryVCData(vcKnowledgeBasedId, userRole);
        const data =
          res.data?.lookup?.virtualContributor?.authorization?.myPrivileges;

        expect(data?.sort()).toEqual(privileges);
      }
    );
  });

  describe('VC knowledge privileges', () => {
    //   failing    ${undefined}                   | ${['READ', 'READ_ABOUT']}
    test.each`
      userRole                       | privileges
      ${TestUser.NON_SPACE_MEMBER}   | ${['READ', 'READ_ABOUT']}
      ${TestUser.SPACE_ADMIN}        | ${['READ', 'READ_ABOUT']}
      ${TestUser.SPACE_MEMBER}       | ${['READ', 'READ_ABOUT']}
      ${TestUser.GLOBAL_ADMIN}       | ${sorted__create_read_update_delete_grant_readAbout}
      ${TestUser.GLOBAL_BETA_TESTER} | ${sorted__create_read_update_delete_contribute_readAbout}
    `(
      'User: "$userRole" has this privileges: "$privileges" to spaceBasedVC',
      async ({ userRole, privileges }) => {
        const res = await queryVCKnowledgePrivileges(vcSpaceBasedId, userRole);
        const data =
          res.data?.virtualContributor?.knowledgeBase?.authorization
            ?.myPrivileges;

        expect(data?.sort()).toEqual(privileges);
      }
    );
    //   failing    ${undefined}                   | ${['READ', 'READ_ABOUT']}

    test.each`
      userRole                       | privileges
      ${TestUser.NON_SPACE_MEMBER}   | ${['READ', 'READ_ABOUT']}
      ${TestUser.SPACE_ADMIN}        | ${['READ', 'READ_ABOUT']}
      ${TestUser.SPACE_MEMBER}       | ${['READ', 'READ_ABOUT']}
      ${TestUser.GLOBAL_ADMIN}       | ${sorted__create_read_update_delete_grant_readAbout}
      ${TestUser.GLOBAL_BETA_TESTER} | ${sorted__create_read_update_delete_contribute_readAbout}
    `(
      'User: "$userRole" has this privileges: "$privileges" to knowledgeBasedVC',
      async ({ userRole, privileges }) => {
        const res = await queryVCKnowledgePrivileges(
          vcKnowledgeBasedId,
          userRole
        );
        const data =
          res.data?.virtualContributor?.knowledgeBase?.authorization
            ?.myPrivileges;

        expect(data?.sort()).toEqual(privileges);
      }
    );
  });

  describe('VC knowledge base calloutSet', () => {
    //   failing    ${undefined}                   | ${['READ', 'READ_ABOUT']}
    test.each`
      userRole                       | privileges
      ${TestUser.NON_SPACE_MEMBER}   | ${['READ', 'READ_ABOUT']}
      ${TestUser.SPACE_ADMIN}        | ${['READ', 'READ_ABOUT']}
      ${TestUser.SPACE_MEMBER}       | ${['READ', 'READ_ABOUT']}
      ${TestUser.GLOBAL_ADMIN}       | ${sorted__create_read_update_delete_createCallout_readAbout_transferAccept_transferOffer}
      ${TestUser.GLOBAL_BETA_TESTER} | ${sorted__create_read_update_delete_contribute_createCallout_readAbout}
    `(
      'User: "$userRole" has this privileges: "$privileges" to spaceBasedVC',
      async ({ userRole, privileges }) => {
        const res = await queryVCKnowledgeBase(vcSpaceBasedId, userRole);
        const data =
          res.data?.virtualContributor?.knowledgeBase?.calloutsSet.authorization
            ?.myPrivileges;

        expect(data?.sort()).toEqual(privileges);
      }
    );
    //   failing    ${undefined}                   | ${['READ', 'READ_ABOUT']}

    test.each`
      userRole                       | privileges
      ${TestUser.NON_SPACE_MEMBER}   | ${['READ', 'READ_ABOUT']}
      ${TestUser.SPACE_ADMIN}        | ${['READ', 'READ_ABOUT']}
      ${TestUser.SPACE_MEMBER}       | ${['READ', 'READ_ABOUT']}
      ${TestUser.GLOBAL_ADMIN}       | ${sorted__create_read_update_delete_createCallout_readAbout_transferAccept_transferOffer}
      ${TestUser.GLOBAL_BETA_TESTER} | ${sorted__create_read_update_delete_contribute_createCallout_readAbout}
    `(
      'User: "$userRole" has this privileges: "$privileges" to knowledgeBasedVC',
      async ({ userRole, privileges }) => {
        const res = await queryVCKnowledgeBase(vcKnowledgeBasedId, userRole);
        const data =
          res.data?.virtualContributor?.knowledgeBase?.calloutsSet.authorization
            ?.myPrivileges;

        expect(data?.sort()).toEqual(privileges);
      }
    );
  });

  describe('VC knowledge base storageBucket', () => {
    //   failing    ${undefined}                   | ${['READ', 'READ_ABOUT']}
    test.each`
      userRole                       | privileges
      ${TestUser.NON_SPACE_MEMBER}   | ${['READ', 'READ_ABOUT']}
      ${TestUser.SPACE_ADMIN}        | ${['READ', 'READ_ABOUT']}
      ${TestUser.SPACE_MEMBER}       | ${['READ', 'READ_ABOUT']}
      ${TestUser.GLOBAL_ADMIN}       | ${sorted__create_read_update_delete_readAbout_fileDelete_fileUpload}
      ${TestUser.GLOBAL_BETA_TESTER} | ${sorted__create_read_update_delete_contribute_readAbout_fileDelete_fileUpload}
    `(
      'User: "$userRole" has this privileges: "$privileges" to spaceBasedVC',
      async ({ userRole, privileges }) => {
        const res = await queryVCStorageConfig(vcSpaceBasedId, userRole);
        const data =
          res.data?.lookup?.virtualContributor?.profile.storageBucket
            .authorization?.myPrivileges;

        expect(data?.sort()).toEqual(privileges);
      }
    );
    //   failing    ${undefined}                   | ${['READ', 'READ_ABOUT']}

    test.each`
      userRole                       | privileges
      ${TestUser.NON_SPACE_MEMBER}   | ${['READ', 'READ_ABOUT']}
      ${TestUser.SPACE_ADMIN}        | ${['READ', 'READ_ABOUT']}
      ${TestUser.SPACE_MEMBER}       | ${['READ', 'READ_ABOUT']}
      ${TestUser.GLOBAL_ADMIN}       | ${sorted__create_read_update_delete_readAbout_fileDelete_fileUpload}
      ${TestUser.GLOBAL_BETA_TESTER} | ${sorted__create_read_update_delete_contribute_readAbout_fileDelete_fileUpload}
    `(
      'User: "$userRole" has this privileges: "$privileges" to knowledgeBasedVC',
      async ({ userRole, privileges }) => {
        const res = await queryVCStorageConfig(vcKnowledgeBasedId, userRole);
        const data =
          res.data?.lookup?.virtualContributor?.profile.storageBucket
            .authorization?.myPrivileges;

        expect(data?.sort()).toEqual(privileges);
      }
    );
  });
});

describe('Virtual Contributor Access - All Private - Visibility Private / BoK / Private', () => {
  beforeAll(async () => {
    await updateVirtualContributor(vcSpaceBasedId, SearchVisibility.Account);
    await updateVirtualContributor(
      vcKnowledgeBasedId,
      SearchVisibility.Account
    );

    await updateVirtualContributorSettings(vcSpaceBasedId, false);
    await updateVirtualContributorSettings(vcKnowledgeBasedId, false);
  });

  describe('Virtualcontributor ', () => {
    //   failing    ${undefined}                   | ${['READ', 'READ_ABOUT']}
    test.each`
      userRole                       | privileges
      ${TestUser.NON_SPACE_MEMBER}   | ${['READ_ABOUT']}
      ${TestUser.SPACE_ADMIN}        | ${['READ_ABOUT']}
      ${TestUser.SPACE_MEMBER}       | ${['READ_ABOUT']}
      ${TestUser.GLOBAL_ADMIN}       | ${sorted__create_read_update_delete_grant_platformAdmin_readAbout}
      ${TestUser.GLOBAL_BETA_TESTER} | ${sorted__create_read_update_delete_contribute_readAbout}
    `(
      'User: "$userRole" has this privileges: "$privileges" to spaceBasedVC',
      async ({ userRole, privileges }) => {
        const res = await queryVCData(vcSpaceBasedId, userRole);
        const data =
          res.data?.lookup?.virtualContributor?.authorization?.myPrivileges;

        expect(data?.sort()).toEqual(privileges);
      }
    );
    //   failing    ${undefined}                   | ${['READ', 'READ_ABOUT']}
    test.each`
      userRole                       | privileges
      ${TestUser.NON_SPACE_MEMBER}   | ${['READ_ABOUT']}
      ${TestUser.SPACE_ADMIN}        | ${['READ_ABOUT']}
      ${TestUser.SPACE_MEMBER}       | ${['READ_ABOUT']}
      ${TestUser.GLOBAL_ADMIN}       | ${sorted__create_read_update_delete_grant_platformAdmin_readAbout}
      ${TestUser.GLOBAL_BETA_TESTER} | ${sorted__create_read_update_delete_contribute_readAbout}
    `(
      'User: "$userRole" has this privileges: "$privileges" to knowledgeBasedVC',
      async ({ userRole, privileges }) => {
        const res = await queryVCData(vcKnowledgeBasedId, userRole);
        const data =
          res.data?.lookup?.virtualContributor?.authorization?.myPrivileges;

        expect(data?.sort()).toEqual(privileges);
      }
    );
  });

  describe('VC knowledge privileges', () => {
    //   failing    ${undefined}                   | ${['READ', 'READ_ABOUT']}
    test.each`
      userRole                       | privileges
      ${TestUser.NON_SPACE_MEMBER}   | ${['READ_ABOUT']}
      ${TestUser.SPACE_ADMIN}        | ${['READ_ABOUT']}
      ${TestUser.SPACE_MEMBER}       | ${['READ_ABOUT']}
      ${TestUser.GLOBAL_ADMIN}       | ${sorted__create_read_update_delete_grant_readAbout}
      ${TestUser.GLOBAL_BETA_TESTER} | ${sorted__create_read_update_delete_contribute_readAbout}
    `(
      'User: "$userRole" has this privileges: "$privileges" to spaceBasedVC',
      async ({ userRole, privileges }) => {
        const res = await queryVCKnowledgePrivileges(vcSpaceBasedId, userRole);
        const data =
          res.data?.virtualContributor?.knowledgeBase?.authorization
            ?.myPrivileges;

        expect(data?.sort()).toEqual(privileges);
      }
    );
    //   failing    ${undefined}                   | ${['READ', 'READ_ABOUT']}

    test.each`
      userRole                       | privileges
      ${TestUser.NON_SPACE_MEMBER}   | ${['READ_ABOUT']}
      ${TestUser.SPACE_ADMIN}        | ${['READ_ABOUT']}
      ${TestUser.SPACE_MEMBER}       | ${['READ_ABOUT']}
      ${TestUser.GLOBAL_ADMIN}       | ${sorted__create_read_update_delete_grant_readAbout}
      ${TestUser.GLOBAL_BETA_TESTER} | ${sorted__create_read_update_delete_contribute_readAbout}
    `(
      'User: "$userRole" has this privileges: "$privileges"  knowledgeBasedVC',
      async ({ userRole, privileges }) => {
        const res = await queryVCKnowledgePrivileges(
          vcKnowledgeBasedId,
          userRole
        );
        const data =
          res.data?.virtualContributor?.knowledgeBase?.authorization
            ?.myPrivileges;

        expect(data?.sort()).toEqual(privileges);
      }
    );
  });

  describe('VC knowledge base calloutSet', () => {
    //   failing    ${undefined}                   | ${['READ', 'READ_ABOUT']}
    test.each`
      userRole                       | privileges
      ${TestUser.NON_SPACE_MEMBER}   | ${undefined}
      ${TestUser.SPACE_ADMIN}        | ${undefined}
      ${TestUser.SPACE_MEMBER}       | ${undefined}
      ${TestUser.GLOBAL_ADMIN}       | ${sorted__create_read_update_delete_createCallout_readAbout_transferAccept_transferOffer}
      ${TestUser.GLOBAL_BETA_TESTER} | ${sorted__create_read_update_delete_contribute_createCallout_readAbout}
    `(
      'User: "$userRole" has this privileges: "$privileges" to spaceBasedVC',
      async ({ userRole, privileges }) => {
        const res = await queryVCKnowledgeBase(vcSpaceBasedId, userRole);
        const data =
          res.data?.virtualContributor?.knowledgeBase?.calloutsSet.authorization
            ?.myPrivileges;

        expect(data?.sort()).toEqual(privileges);
      }
    );
    //   failing    ${undefined}                   | ${['READ', 'READ_ABOUT']}

    test.each`
      userRole                       | privileges
      ${TestUser.NON_SPACE_MEMBER}   | ${undefined}
      ${TestUser.SPACE_ADMIN}        | ${undefined}
      ${TestUser.SPACE_MEMBER}       | ${undefined}
      ${TestUser.GLOBAL_ADMIN}       | ${sorted__create_read_update_delete_createCallout_readAbout_transferAccept_transferOffer}
      ${TestUser.GLOBAL_BETA_TESTER} | ${sorted__create_read_update_delete_contribute_createCallout_readAbout}
    `(
      'User: "$userRole" has this privileges: "$privileges" to knowledgeBasedVC',
      async ({ userRole, privileges }) => {
        const res = await queryVCKnowledgeBase(vcKnowledgeBasedId, userRole);
        const data =
          res.data?.virtualContributor?.knowledgeBase?.calloutsSet.authorization
            ?.myPrivileges;

        expect(data?.sort()).toEqual(privileges);
      }
    );
  });

  describe('VC knowledge base storageBucket', () => {
    //   failing    ${undefined}                   | ${['READ', 'READ_ABOUT']}
    test.each`
      userRole                       | privileges
      ${TestUser.NON_SPACE_MEMBER}   | ${['READ', 'READ_ABOUT']}
      ${TestUser.SPACE_ADMIN}        | ${['READ', 'READ_ABOUT']}
      ${TestUser.SPACE_MEMBER}       | ${['READ', 'READ_ABOUT']}
      ${TestUser.GLOBAL_ADMIN}       | ${sorted__create_read_update_delete_readAbout_fileDelete_fileUpload}
      ${TestUser.GLOBAL_BETA_TESTER} | ${sorted__create_read_update_delete_contribute_readAbout_fileDelete_fileUpload}
    `(
      'User: "$userRole" has this privileges: "$privileges" to spaceBasedVC',
      async ({ userRole, privileges }) => {
        const res = await queryVCStorageConfig(vcSpaceBasedId, userRole);
        const data =
          res.data?.lookup?.virtualContributor?.profile.storageBucket
            .authorization?.myPrivileges;

        expect(data?.sort()).toEqual(privileges);
      }
    );
    //   failing    ${undefined}                   | ${['READ', 'READ_ABOUT']}

    test.each`
      userRole                       | privileges
      ${TestUser.NON_SPACE_MEMBER}   | ${['READ', 'READ_ABOUT']}
      ${TestUser.SPACE_ADMIN}        | ${['READ', 'READ_ABOUT']}
      ${TestUser.SPACE_MEMBER}       | ${['READ', 'READ_ABOUT']}
      ${TestUser.GLOBAL_ADMIN}       | ${sorted__create_read_update_delete_readAbout_fileDelete_fileUpload}
      ${TestUser.GLOBAL_BETA_TESTER} | ${sorted__create_read_update_delete_contribute_readAbout_fileDelete_fileUpload}
    `(
      'User: "$userRole" has this privileges: "$privileges" to knowledgeBasedVC',
      async ({ userRole, privileges }) => {
        const res = await queryVCStorageConfig(vcKnowledgeBasedId, userRole);
        const data =
          res.data?.lookup?.virtualContributor?.profile.storageBucket
            .authorization?.myPrivileges;

        expect(data?.sort()).toEqual(privileges);
      }
    );
  });
});

describe('Virtual Contributor Access - All Private - Visibility Private / BoK / Public', () => {
  beforeAll(async () => {
    await updateVirtualContributor(vcSpaceBasedId, SearchVisibility.Account);
    await updateVirtualContributor(
      vcKnowledgeBasedId,
      SearchVisibility.Account
    );

    await updateVirtualContributorSettings(vcSpaceBasedId, true);
    await updateVirtualContributorSettings(vcKnowledgeBasedId, true);
  });

  describe('Virtualcontributor ', () => {
    //   failing    ${undefined}                   | ${['READ', 'READ_ABOUT']}
    test.each`
      userRole                       | privileges
      ${TestUser.NON_SPACE_MEMBER}   | ${['READ_ABOUT']}
      ${TestUser.SPACE_ADMIN}        | ${['READ_ABOUT']}
      ${TestUser.SPACE_MEMBER}       | ${['READ_ABOUT']}
      ${TestUser.GLOBAL_ADMIN}       | ${sorted__create_read_update_delete_grant_platformAdmin_readAbout}
      ${TestUser.GLOBAL_BETA_TESTER} | ${sorted__create_read_update_delete_contribute_readAbout}
    `(
      'User: "$userRole" has this privileges: "$privileges" to spaceBasedVC',
      async ({ userRole, privileges }) => {
        const res = await queryVCData(vcSpaceBasedId, userRole);
        const data =
          res.data?.lookup?.virtualContributor?.authorization?.myPrivileges;

        expect(data?.sort()).toEqual(privileges);
      }
    );
    //   failing    ${undefined}                   | ${['READ', 'READ_ABOUT']}
    test.each`
      userRole                       | privileges
      ${TestUser.NON_SPACE_MEMBER}   | ${['READ_ABOUT']}
      ${TestUser.SPACE_ADMIN}        | ${['READ_ABOUT']}
      ${TestUser.SPACE_MEMBER}       | ${['READ_ABOUT']}
      ${TestUser.GLOBAL_ADMIN}       | ${sorted__create_read_update_delete_grant_platformAdmin_readAbout}
      ${TestUser.GLOBAL_BETA_TESTER} | ${sorted__create_read_update_delete_contribute_readAbout}
    `(
      'User: "$userRole" has this privileges: "$privileges" to knowledgeBasedVC',
      async ({ userRole, privileges }) => {
        const res = await queryVCData(vcKnowledgeBasedId, userRole);
        const data =
          res.data?.lookup?.virtualContributor?.authorization?.myPrivileges;

        expect(data?.sort()).toEqual(privileges);
      }
    );
  });

  describe('VC knowledge privileges', () => {
    //   failing    ${undefined}                   | ${['READ', 'READ_ABOUT']}
    test.each`
      userRole                       | privileges
      ${TestUser.NON_SPACE_MEMBER}   | ${['READ', 'READ_ABOUT']}
      ${TestUser.SPACE_ADMIN}        | ${['READ', 'READ_ABOUT']}
      ${TestUser.SPACE_MEMBER}       | ${['READ', 'READ_ABOUT']}
      ${TestUser.GLOBAL_ADMIN}       | ${sorted__create_read_update_delete_grant_readAbout}
      ${TestUser.GLOBAL_BETA_TESTER} | ${sorted__create_read_update_delete_contribute_readAbout}
    `(
      'User: "$userRole" has this privileges: "$privileges" to spaceBasedVC',
      async ({ userRole, privileges }) => {
        const res = await queryVCKnowledgePrivileges(vcSpaceBasedId, userRole);
        const data =
          res.data?.virtualContributor?.knowledgeBase?.authorization
            ?.myPrivileges;

        expect(data?.sort()).toEqual(privileges);
      }
    );
    //   failing    ${undefined}                   | ${['READ', 'READ_ABOUT']}

    test.each`
      userRole                       | privileges
      ${TestUser.NON_SPACE_MEMBER}   | ${['READ', 'READ_ABOUT']}
      ${TestUser.SPACE_ADMIN}        | ${['READ', 'READ_ABOUT']}
      ${TestUser.SPACE_MEMBER}       | ${['READ', 'READ_ABOUT']}
      ${TestUser.GLOBAL_ADMIN}       | ${sorted__create_read_update_delete_grant_readAbout}
      ${TestUser.GLOBAL_BETA_TESTER} | ${sorted__create_read_update_delete_contribute_readAbout}
    `(
      'User: "$userRole" has this privileges: "$privileges"  knowledgeBasedVC',
      async ({ userRole, privileges }) => {
        const res = await queryVCKnowledgePrivileges(
          vcKnowledgeBasedId,
          userRole
        );
        const data =
          res.data?.virtualContributor?.knowledgeBase?.authorization
            ?.myPrivileges;

        expect(data?.sort()).toEqual(privileges);
      }
    );
  });

  describe('VC knowledge base calloutSet', () => {
    //   failing    ${undefined}                   | ${['READ', 'READ_ABOUT']}
    test.each`
      userRole                       | privileges
      ${TestUser.NON_SPACE_MEMBER}   | ${['READ', 'READ_ABOUT']}
      ${TestUser.SPACE_ADMIN}        | ${['READ', 'READ_ABOUT']}
      ${TestUser.SPACE_MEMBER}       | ${['READ', 'READ_ABOUT']}
      ${TestUser.GLOBAL_ADMIN}       | ${sorted__create_read_update_delete_createCallout_readAbout_transferAccept_transferOffer}
      ${TestUser.GLOBAL_BETA_TESTER} | ${sorted__create_read_update_delete_contribute_createCallout_readAbout}
    `(
      'User: "$userRole" has this privileges: "$privileges" to spaceBasedVC',
      async ({ userRole, privileges }) => {
        const res = await queryVCKnowledgeBase(vcSpaceBasedId, userRole);
        const data =
          res.data?.virtualContributor?.knowledgeBase?.calloutsSet.authorization
            ?.myPrivileges;

        expect(data?.sort()).toEqual(privileges);
      }
    );
    //   failing    ${undefined}                   | ${['READ', 'READ_ABOUT']}

    test.each`
      userRole                       | privileges
      ${TestUser.NON_SPACE_MEMBER}   | ${['READ', 'READ_ABOUT']}
      ${TestUser.SPACE_ADMIN}        | ${['READ', 'READ_ABOUT']}
      ${TestUser.SPACE_MEMBER}       | ${['READ', 'READ_ABOUT']}
      ${TestUser.GLOBAL_ADMIN}       | ${sorted__create_read_update_delete_createCallout_readAbout_transferAccept_transferOffer}
      ${TestUser.GLOBAL_BETA_TESTER} | ${sorted__create_read_update_delete_contribute_createCallout_readAbout}
    `(
      'User: "$userRole" has this privileges: "$privileges" to knowledgeBasedVC',
      async ({ userRole, privileges }) => {
        const res = await queryVCKnowledgeBase(vcKnowledgeBasedId, userRole);
        const data =
          res.data?.virtualContributor?.knowledgeBase?.calloutsSet.authorization
            ?.myPrivileges;

        expect(data?.sort()).toEqual(privileges);
      }
    );
  });

  describe('VC knowledge base storageBucket', () => {
    //   failing    ${undefined}                   | ${['READ', 'READ_ABOUT']}
    test.each`
      userRole                       | privileges
      ${TestUser.NON_SPACE_MEMBER}   | ${['READ', 'READ_ABOUT']}
      ${TestUser.SPACE_ADMIN}        | ${['READ', 'READ_ABOUT']}
      ${TestUser.SPACE_MEMBER}       | ${['READ', 'READ_ABOUT']}
      ${TestUser.GLOBAL_ADMIN}       | ${sorted__create_read_update_delete_readAbout_fileDelete_fileUpload}
      ${TestUser.GLOBAL_BETA_TESTER} | ${sorted__create_read_update_delete_contribute_readAbout_fileDelete_fileUpload}
    `(
      'User: "$userRole" has this privileges: "$privileges" to spaceBasedVC',
      async ({ userRole, privileges }) => {
        const res = await queryVCStorageConfig(vcSpaceBasedId, userRole);
        const data =
          res.data?.lookup?.virtualContributor?.profile.storageBucket
            .authorization?.myPrivileges;

        expect(data?.sort()).toEqual(privileges);
      }
    );
    //   failing    ${undefined}                   | ${['READ', 'READ_ABOUT']}

    test.each`
      userRole                       | privileges
      ${TestUser.NON_SPACE_MEMBER}   | ${['READ', 'READ_ABOUT']}
      ${TestUser.SPACE_ADMIN}        | ${['READ', 'READ_ABOUT']}
      ${TestUser.SPACE_MEMBER}       | ${['READ', 'READ_ABOUT']}
      ${TestUser.GLOBAL_ADMIN}       | ${sorted__create_read_update_delete_readAbout_fileDelete_fileUpload}
      ${TestUser.GLOBAL_BETA_TESTER} | ${sorted__create_read_update_delete_contribute_readAbout_fileDelete_fileUpload}
    `(
      'User: "$userRole" has this privileges: "$privileges" to knowledgeBasedVC',
      async ({ userRole, privileges }) => {
        const res = await queryVCStorageConfig(vcKnowledgeBasedId, userRole);
        const data =
          res.data?.lookup?.virtualContributor?.profile.storageBucket
            .authorization?.myPrivileges;

        expect(data?.sort()).toEqual(privileges);
      }
    );
  });
});

describe('Virtual Contributor Access - All Private - Visibility Public / BoK / Private', () => {
  beforeAll(async () => {
    await updateVirtualContributor(vcSpaceBasedId, SearchVisibility.Public);
    await updateVirtualContributor(vcKnowledgeBasedId, SearchVisibility.Public);

    await updateVirtualContributorSettings(vcSpaceBasedId, false);
    await updateVirtualContributorSettings(vcKnowledgeBasedId, false);
  });

  describe('Virtualcontributor ', () => {
    //   failing    ${undefined}                   | ${['READ', 'READ_ABOUT']}
    test.each`
      userRole                       | privileges
      ${TestUser.NON_SPACE_MEMBER}   | ${['READ_ABOUT']}
      ${TestUser.SPACE_ADMIN}        | ${['READ_ABOUT']}
      ${TestUser.SPACE_MEMBER}       | ${['READ_ABOUT']}
      ${TestUser.GLOBAL_ADMIN}       | ${sorted__create_read_update_delete_grant_platformAdmin_readAbout}
      ${TestUser.GLOBAL_BETA_TESTER} | ${sorted__create_read_update_delete_contribute_readAbout}
    `(
      'User: "$userRole" has this privileges: "$privileges" to spaceBasedVC',
      async ({ userRole, privileges }) => {
        const res = await queryVCData(vcSpaceBasedId, userRole);
        const data =
          res.data?.lookup?.virtualContributor?.authorization?.myPrivileges;

        expect(data?.sort()).toEqual(privileges);
      }
    );
    //   failing    ${undefined}                   | ${['READ', 'READ_ABOUT']}
    test.each`
      userRole                       | privileges
      ${TestUser.NON_SPACE_MEMBER}   | ${['READ_ABOUT']}
      ${TestUser.SPACE_ADMIN}        | ${['READ_ABOUT']}
      ${TestUser.SPACE_MEMBER}       | ${['READ_ABOUT']}
      ${TestUser.GLOBAL_ADMIN}       | ${sorted__create_read_update_delete_grant_platformAdmin_readAbout}
      ${TestUser.GLOBAL_BETA_TESTER} | ${sorted__create_read_update_delete_contribute_readAbout}
    `(
      'User: "$userRole" has this privileges: "$privileges" to knowledgeBasedVC',
      async ({ userRole, privileges }) => {
        const res = await queryVCData(vcKnowledgeBasedId, userRole);
        const data =
          res.data?.lookup?.virtualContributor?.authorization?.myPrivileges;

        expect(data?.sort()).toEqual(privileges);
      }
    );
  });

  describe('VC knowledge privileges', () => {
    //   failing    ${undefined}                   | ${['READ', 'READ_ABOUT']}
    test.each`
      userRole                       | privileges
      ${TestUser.NON_SPACE_MEMBER}   | ${['READ_ABOUT']}
      ${TestUser.SPACE_ADMIN}        | ${['READ_ABOUT']}
      ${TestUser.SPACE_MEMBER}       | ${['READ_ABOUT']}
      ${TestUser.GLOBAL_ADMIN}       | ${sorted__create_read_update_delete_grant_readAbout}
      ${TestUser.GLOBAL_BETA_TESTER} | ${sorted__create_read_update_delete_contribute_readAbout}
    `(
      'User: "$userRole" has this privileges: "$privileges" to spaceBasedVC',
      async ({ userRole, privileges }) => {
        const res = await queryVCKnowledgePrivileges(vcSpaceBasedId, userRole);
        const data =
          res.data?.virtualContributor?.knowledgeBase?.authorization
            ?.myPrivileges;

        expect(data?.sort()).toEqual(privileges);
      }
    );
    //   failing    ${undefined}                   | ${['READ', 'READ_ABOUT']}

    test.each`
      userRole                       | privileges
      ${TestUser.NON_SPACE_MEMBER}   | ${['READ_ABOUT']}
      ${TestUser.SPACE_ADMIN}        | ${['READ_ABOUT']}
      ${TestUser.SPACE_MEMBER}       | ${['READ_ABOUT']}
      ${TestUser.GLOBAL_ADMIN}       | ${sorted__create_read_update_delete_grant_readAbout}
      ${TestUser.GLOBAL_BETA_TESTER} | ${sorted__create_read_update_delete_contribute_readAbout}
    `(
      'User: "$userRole" has this privileges: "$privileges"  knowledgeBasedVC',
      async ({ userRole, privileges }) => {
        const res = await queryVCKnowledgePrivileges(
          vcKnowledgeBasedId,
          userRole
        );
        const data =
          res.data?.virtualContributor?.knowledgeBase?.authorization
            ?.myPrivileges;

        expect(data?.sort()).toEqual(privileges);
      }
    );
  });

  describe('VC knowledge base calloutSet', () => {
    //   failing    ${undefined}                   | ${['READ', 'READ_ABOUT']}
    test.each`
      userRole                       | privileges
      ${TestUser.NON_SPACE_MEMBER}   | ${undefined}
      ${TestUser.SPACE_ADMIN}        | ${undefined}
      ${TestUser.SPACE_MEMBER}       | ${undefined}
      ${TestUser.GLOBAL_ADMIN}       | ${sorted__create_read_update_delete_createCallout_readAbout_transferAccept_transferOffer}
      ${TestUser.GLOBAL_BETA_TESTER} | ${sorted__create_read_update_delete_contribute_createCallout_readAbout}
    `(
      'User: "$userRole" has this privileges: "$privileges" to spaceBasedVC',
      async ({ userRole, privileges }) => {
        const res = await queryVCKnowledgeBase(vcSpaceBasedId, userRole);
        const data =
          res.data?.virtualContributor?.knowledgeBase?.calloutsSet.authorization
            ?.myPrivileges;

        expect(data?.sort()).toEqual(privileges);
      }
    );
    //   failing    ${undefined}                   | ${['READ', 'READ_ABOUT']}

    test.each`
      userRole                       | privileges
      ${TestUser.NON_SPACE_MEMBER}   | ${undefined}
      ${TestUser.SPACE_ADMIN}        | ${undefined}
      ${TestUser.SPACE_MEMBER}       | ${undefined}
      ${TestUser.GLOBAL_ADMIN}       | ${sorted__create_read_update_delete_createCallout_readAbout_transferAccept_transferOffer}
      ${TestUser.GLOBAL_BETA_TESTER} | ${sorted__create_read_update_delete_contribute_createCallout_readAbout}
    `(
      'User: "$userRole" has this privileges: "$privileges" to knowledgeBasedVC',
      async ({ userRole, privileges }) => {
        const res = await queryVCKnowledgeBase(vcKnowledgeBasedId, userRole);
        const data =
          res.data?.virtualContributor?.knowledgeBase?.calloutsSet.authorization
            ?.myPrivileges;

        expect(data?.sort()).toEqual(privileges);
      }
    );
  });

  describe('VC knowledge base storageBucket', () => {
    //   failing    ${undefined}                   | ${['READ', 'READ_ABOUT']}
    test.each`
      userRole                       | privileges
      ${TestUser.NON_SPACE_MEMBER}   | ${['READ', 'READ_ABOUT']}
      ${TestUser.SPACE_ADMIN}        | ${['READ', 'READ_ABOUT']}
      ${TestUser.SPACE_MEMBER}       | ${['READ', 'READ_ABOUT']}
      ${TestUser.GLOBAL_ADMIN}       | ${sorted__create_read_update_delete_readAbout_fileDelete_fileUpload}
      ${TestUser.GLOBAL_BETA_TESTER} | ${sorted__create_read_update_delete_contribute_readAbout_fileDelete_fileUpload}
    `(
      'User: "$userRole" has this privileges: "$privileges" to spaceBasedVC',
      async ({ userRole, privileges }) => {
        const res = await queryVCStorageConfig(vcSpaceBasedId, userRole);
        const data =
          res.data?.lookup?.virtualContributor?.profile.storageBucket
            .authorization?.myPrivileges;

        expect(data?.sort()).toEqual(privileges);
      }
    );
    //   failing    ${undefined}                   | ${['READ', 'READ_ABOUT']}

    test.each`
      userRole                       | privileges
      ${TestUser.NON_SPACE_MEMBER}   | ${['READ', 'READ_ABOUT']}
      ${TestUser.SPACE_ADMIN}        | ${['READ', 'READ_ABOUT']}
      ${TestUser.SPACE_MEMBER}       | ${['READ', 'READ_ABOUT']}
      ${TestUser.GLOBAL_ADMIN}       | ${sorted__create_read_update_delete_readAbout_fileDelete_fileUpload}
      ${TestUser.GLOBAL_BETA_TESTER} | ${sorted__create_read_update_delete_contribute_readAbout_fileDelete_fileUpload}
    `(
      'User: "$userRole" has this privileges: "$privileges" to knowledgeBasedVC',
      async ({ userRole, privileges }) => {
        const res = await queryVCStorageConfig(vcKnowledgeBasedId, userRole);
        const data =
          res.data?.lookup?.virtualContributor?.profile.storageBucket
            .authorization?.myPrivileges;

        expect(data?.sort()).toEqual(privileges);
      }
    );
  });
});
