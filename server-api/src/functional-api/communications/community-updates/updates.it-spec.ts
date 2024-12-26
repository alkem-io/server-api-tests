import {
  getSpaceData,
  updateSpaceSettings,
} from '@functional-api/journey/space/space.request.params';
import { TestUser } from '@alkemio/tests-lib';
import { users } from '@utils/queries/users-data';
import { assignRoleToUser } from '@functional-api/roleset/roles-request.params';
import { delay } from '@alkemio/tests-lib';
import { CommunityRoleType, SpacePrivacyMode } from '@generated/alkemio-schema';
import {
  removeMessageOnRoom,
  sendMessageToRoom,
} from '../communication.params';
import { TestScenarioFactory } from '@src/scenario/TestScenarioFactory';
import { OrganizationWithSpaceModel } from '@src/scenario/models/OrganizationWithSpaceModel';
import { TestScenarioConfig } from '@src/scenario/config/test-scenario-config';

let baseScenario: OrganizationWithSpaceModel;

const scenarioConfig: TestScenarioConfig = {
  name: 'community-updates',
  space: {
    collaboration: {
      addCallouts: true,
    },
  },
};

beforeAll(async () => {
  baseScenario =
    await TestScenarioFactory.createBaseScenario(scenarioConfig);
});

afterAll(async () => {
  await TestScenarioFactory.cleanUpBaseScenario(baseScenario);
});

describe('Communities', () => {
  describe('Community updates - read access', () => {
    beforeAll(async () => {
      await updateSpaceSettings(baseScenario.space.id, {
        privacy: { mode: SpacePrivacyMode.Private },
      });

      await assignRoleToUser(
        users.spaceMember.id,
        baseScenario.space.community.roleSetId,
        CommunityRoleType.Member
      );

      const res = await sendMessageToRoom(
        baseScenario.space.communication.updatesId,
        'test'
      );
      baseScenario.space.communication.messageId =
        res?.data?.sendMessageToRoom.id;
    });

    afterAll(async () => {
      await removeMessageOnRoom(
        baseScenario.space.communication.updatesId,
        baseScenario.space.communication.messageId
      );
    });
    test('community updates - PRIVATE space - read access - sender / reader (member) / reader (not member)', async () => {
      // Act
      const spaceDataSender = await getSpaceData(
        baseScenario.space.id,
        TestUser.GLOBAL_ADMIN
      );
      const retrievedMessage =
        spaceDataSender?.data?.space?.community?.communication?.updates
          .messages ?? [];

      const spaceDataReaderMember = await getSpaceData(
        baseScenario.space.id,
        TestUser.SPACE_MEMBER
      );

      const getMessageReaderMember =
        spaceDataReaderMember?.data?.space?.community?.communication?.updates
          .messages ?? [];
      await delay(600);
      const spaceDataReader = await getSpaceData(
        baseScenario.space.id,
        TestUser.NON_SPACE_MEMBER
      );

      // Assert
      expect(retrievedMessage).toHaveLength(1);
      expect(retrievedMessage[0]).toEqual({
        id: baseScenario.space.communication.messageId,
        message: 'test',
        sender: { id: users.globalAdmin.id },
        reactions: [],
        threadID: null,
      });

      expect(retrievedMessage).toHaveLength(1);
      expect(getMessageReaderMember[0]).toEqual({
        id: baseScenario.space.communication.messageId,
        message: 'test',
        sender: { id: users.globalAdmin.id },
        reactions: [],
        threadID: null,
      });

      await delay(600);
      expect(spaceDataReader.error?.errors[0].message).toContain(
        `User (${users.nonSpaceMember.email}) does not have credentials that grant 'read' access `
      );
    });

    test('community updates - NOT PRIVATE space - read access - sender / reader (member) / reader (not member)', async () => {
      await updateSpaceSettings(baseScenario.space.id, {
        privacy: { mode: SpacePrivacyMode.Public },
      });

      // Act
      const spaceDataSender = await getSpaceData(
        baseScenario.space.id,
        TestUser.GLOBAL_ADMIN
      );
      const retrievedMessage =
        spaceDataSender?.data?.space?.community?.communication?.updates
          .messages ?? [];

      const spaceDataReaderMember = await getSpaceData(
        baseScenario.space.id,
        TestUser.SPACE_MEMBER
      );
      const getMessageReaderMember =
        spaceDataReaderMember?.data?.space?.community?.communication?.updates
          .messages ?? [];

      const spaceDataReaderNotMemberIn = await getSpaceData(
        baseScenario.space.id,
        TestUser.NON_SPACE_MEMBER
      );
      const spaceDataReaderNotMember =
        spaceDataReaderNotMemberIn?.data?.space?.community?.communication
          ?.updates.messages ?? [];

      // Assert
      expect(retrievedMessage).toHaveLength(1);
      expect(retrievedMessage[0]).toEqual({
        id: baseScenario.space.communication.messageId,
        message: 'test',
        sender: { id: users.globalAdmin.id },
        reactions: [],
        threadID: null,
      });

      expect(getMessageReaderMember[0]).toEqual({
        id: baseScenario.space.communication.messageId,
        message: 'test',
        sender: { id: users.globalAdmin.id },
        reactions: [],
        threadID: null,
      });

      expect(spaceDataReaderNotMember[0]).toEqual({
        id: baseScenario.space.communication.messageId,
        message: 'test',
        sender: { id: users.globalAdmin.id },
        reactions: [],
        threadID: null,
      });
    });
  });

  describe('Community updates - create / delete', () => {
    test('should create community update', async () => {
      // Act
      const res = await sendMessageToRoom(
        baseScenario.space.communication.updatesId,
        'test'
      );
      baseScenario.space.communication.messageId =
        res?.data?.sendMessageToRoom.id;

      const spaceDataSender = await getSpaceData(baseScenario.space.id);
      const retrievedMessage =
        spaceDataSender?.data?.space?.community?.communication?.updates
          .messages ?? [];
      // Assert
      expect(retrievedMessage).toHaveLength(1);
      expect(retrievedMessage[0]).toEqual({
        id: baseScenario.space.communication.messageId,
        message: 'test',
        sender: { id: users.globalAdmin.id },
        reactions: [],
        threadID: null,
      });

      await removeMessageOnRoom(
        baseScenario.space.communication.updatesId,
        baseScenario.space.communication.messageId
      );
    });

    test('should delete community update', async () => {
      // Arrange
      const res = await sendMessageToRoom(
        baseScenario.space.communication.updatesId,
        'test'
      );
      baseScenario.space.communication.messageId =
        res?.data?.sendMessageToRoom.id;
      await delay(600);
      // Act
      await removeMessageOnRoom(
        baseScenario.space.communication.updatesId,
        baseScenario.space.communication.messageId
      );

      await delay(600);

      const spaceDataSender = await getSpaceData(baseScenario.space.id);
      const retrievedMessage =
        spaceDataSender?.data?.space?.community?.communication?.updates
          .messages;

      // Assert
      expect(retrievedMessage).toHaveLength(0);
    });
  });
});
