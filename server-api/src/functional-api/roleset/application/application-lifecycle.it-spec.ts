import '@utils/array.matcher';
import {
  getSpaceData,
  updateSpaceSettings,
} from '@functional-api/journey/space/space.request.params';

import {
  deleteApplication,
  createApplication,
  getRoleSetInvitationsApplications,
} from '@functional-api/roleset/application/application.request.params';
import { eventOnRoleSetApplication } from '../roleset-events.request.params';
import { CommunityMembershipPolicy } from '@generated/graphql';
import { TestScenarioFactory } from '@src/scenario/TestScenarioFactory';
import { OrganizationWithSpaceModel } from '@src/scenario/models/OrganizationWithSpaceModel';
import { TestScenarioConfig } from '@src/scenario/config/test-scenario-config';

let applicationId = '';
let applicationData;
let spaceRoleSetId = '';

let baseScenario: OrganizationWithSpaceModel;

const scenarioConfig: TestScenarioConfig = {
  name: 'application-lifecycle',
  space: {
    subspace: {
      collaboration: {
        addPostCallout: true,
        addPostCollectionCallout: true,
        addWhiteboardCallout: true,
      },
    },
  },
};

beforeAll(async () => {
  baseScenario = await TestScenarioFactory.createBaseScenario(scenarioConfig);
});

afterAll(async () => {
  await TestScenarioFactory.cleanUpBaseScenario(baseScenario);
});

describe('Lifecycle', () => {
  describe('Update application entity state - positive path - REJECT', () => {
    beforeAll(async () => {
      await updateSpaceSettings(baseScenario.space.id, {
        membership: {
          policy: CommunityMembershipPolicy.Applications,
        },
      });

      const spaceCommunityIds = await getSpaceData(baseScenario.space.id);
      spaceRoleSetId =
        spaceCommunityIds?.data?.lookup?.space?.community?.roleSet.id ?? '';

      applicationData = await createApplication(spaceRoleSetId);
      applicationId =
        applicationData?.data?.applyForEntryRoleOnRoleSet?.id ?? '';
    });

    afterAll(async () => {
      await deleteApplication(applicationId);
    });

    // Arrange
    test.each`
      setEvent     | state         | nextEvents
      ${'REJECT'}  | ${'rejected'} | ${['REOPEN', 'ARCHIVE']}
      ${'REOPEN'}  | ${'new'}      | ${['APPROVE', 'REJECT']}
      ${'APPROVE'} | ${'approved'} | ${[]}
    `(
      'should update application, when set event: "$setEvent" to state: "$state", nextEvents: "$nextEvents"',
      async ({ setEvent, state, nextEvents }) => {
        // Act
        const eventResponseData = await eventOnRoleSetApplication(
          applicationId,
          setEvent
        );

        const application = eventResponseData?.data?.eventOnApplication;
        const roleSetPendingMemberships =
          await getRoleSetInvitationsApplications(
            baseScenario.space.community.roleSetId
          );

        const roleSetFirstApplication =
          roleSetPendingMemberships?.data?.lookup?.roleSet?.applications[0];
        if (!roleSetFirstApplication) {
          throw new Error('Role set application not found');
        }
        // Assert
        expect(application?.state).toEqual(state);
        expect(application?.nextEvents).toEqual(nextEvents);
        expect(application).toEqual(roleSetFirstApplication);
      }
    );
  });
});
