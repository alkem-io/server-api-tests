import {
  createPostOnCallout,
  getDataPerSpaceCallout,
} from '@functional-api/callout/post/post.request.params';
import {
  deleteSpace,
  getSpaceData,
} from '@functional-api/journey/space/space.request.params';
import { createRelation } from '@functional-api/relations/relations.request.params';
import { createApplication } from '@functional-api/roleset/application/application.request.params';
import { TestUser } from '@utils/test.user';
import { mutation } from '@utils/graphql.request';
import { uniqueId } from '@utils/uniqueId';
import { changePreferenceSpace } from '@utils/mutations/preferences-mutation';

import {
  sorted_sorted__create_read_update_delete_grant_createComment_Privilege,
  sorted__create_read_update_delete_grant_createDiscussion_Privilege,
  readPrivilege,
  sorted__read_createRelation,
  sorted__create_read_update_delete_grant,
  sorted__create_read_update_delete_grant_createMessage_messageReaction_messageReply,
  sorted__create_read_update_delete_grant_applyToCommunity_joinCommunity_addMember_Invite,
} from '../../common';
import {
  assignUserAsGlobalCommunityAdmin,
  removeUserAsGlobalCommunityAdmin,
} from '@utils/mutations/authorization-mutation';
import { createOrgAndSpace } from '@utils/data-setup/entities';
import { deleteOrganization } from '@functional-api/contributor-management/organization/organization.request.params';
import {
  entitiesId,
  users,
} from '@test/types/entities-helper';
import { SpacePreferenceType } from '@generated/alkemio-schema';
import { sendMessageToRoom } from '@functional-api/communications/communication.params';

const organizationName = 'auth-ga-org-name' + uniqueId;
const hostNameId = 'auth-ga-org-nameid' + uniqueId;
const spaceName = 'auth-ga-eco-name' + uniqueId;
const spaceNameId = 'auth-ga-eco-nameid' + uniqueId;

beforeAll(async () => {
  await createOrgAndSpace(
    organizationName,
    hostNameId,
    spaceName,
    spaceNameId
  );
  await changePreferenceSpace(
    entitiesId.spaceId,
    SpacePreferenceType.AuthorizationAnonymousReadAccess,
    'false'
  );

  await changePreferenceSpace(
    entitiesId.spaceId,
    SpacePreferenceType.MembershipApplicationsFromAnyone,
    'true'
  );
  await changePreferenceSpace(
    entitiesId.spaceId,
    SpacePreferenceType.MembershipJoinSpaceFromAnyone,
    'true'
  );
  await changePreferenceSpace(
    entitiesId.spaceId,
    SpacePreferenceType.MembershipJoinSpaceFromHostOrganizationMembers,
    'true'
  );

  await createApplication(
    entitiesId.space.communityId,
    TestUser.QA_USER
  );

  // await mutation(
  //   createDiscussion,
  //   createDiscussionVariablesData(
  //     entitiesId.space.communicationId,
  //     DiscussionCategory.GENERAL,
  //     'test'
  //   )
  // );

  await sendMessageToRoom(
    entitiesId.space.updateId,
    'test',
    TestUser.GLOBAL_ADMIN
  );

  await createRelation(
    entitiesId.space.collaborationId,
    'incoming',
    'relationDescription',
    'relationActorName',
    'relationActorRole',
    'relationActorType',
    TestUser.GLOBAL_ADMIN
  );

  await createPostOnCallout(
    entitiesId.space.calloutId,
    { displayName: 'postDisplayName' },
    'postnameid',
    TestUser.GLOBAL_ADMIN
  );

  await assignUserAsGlobalCommunityAdmin(users.spaceMember.id);
});
afterAll(async () => {
  await deleteSpace(entitiesId.spaceId);
  await deleteOrganization(entitiesId.organization.id);
  await removeUserAsGlobalCommunityAdmin(users.spaceMember.id);
});

describe('myPrivileges', () => {
  test('GlobalCommunityAdmin privileges to Space', async () => {
    // Act
    const response = await getSpaceData(
      entitiesId.spaceId,
      TestUser.GLOBAL_COMMUNITY_ADMIN
    );
    const data = response.data?.space?.authorization?.myPrivileges ?? [];

    // Assert
    expect(data.sort()).toEqual(readPrivilege);
  });

  describe('Community', () => {
    test('GlobalCommunityAdmin privileges to Space / Community', async () => {
      // Act
      const response = await getSpaceData(
        entitiesId.spaceId,
        TestUser.GLOBAL_COMMUNITY_ADMIN
      );
      const data =
        response.data?.space.community?.authorization?.myPrivileges ?? [];

      // Assert
      expect(data.sort()).toEqual(
        sorted__create_read_update_delete_grant_applyToCommunity_joinCommunity_addMember_Invite
      );
    });

    test('GlobalCommunityAdmin privileges to Space / Community / Application', async () => {
      // Act
      const response = await getSpaceData(
        entitiesId.spaceId,
        TestUser.GLOBAL_COMMUNITY_ADMIN
      );
      const data =
        response.data?.space?.community?.applications?.[0].authorization
          ?.myPrivileges ?? [];

      // Assert
      expect(data.sort()).toEqual(sorted__create_read_update_delete_grant);
    });

    test('GlobalCommunityAdmin privileges to Space / Community / Communication', async () => {
      // Act
      const response = await getSpaceData(
        entitiesId.spaceId,
        TestUser.GLOBAL_COMMUNITY_ADMIN
      );
      const data =
        response.data?.space?.community?.communication?.authorization
          ?.myPrivileges ?? [];

      // Assert
      expect(data.sort()).toEqual(
        sorted__create_read_update_delete_grant_createDiscussion_Privilege
      );
    });

    test.skip('GlobalCommunityAdmin privileges to Space / Community / Communication / Discussion', async () => {
      // Act
      const response = await getSpaceData(
        entitiesId.spaceId,
        TestUser.GLOBAL_COMMUNITY_ADMIN
      );
      const data =
        response.data?.space.community?.communication?.discussions?.[0]
          .authorization?.myPrivileges ?? [];

      // Assert
      expect(data.sort()).toEqual(
        sorted_sorted__create_read_update_delete_grant_createComment_Privilege
      );
    });

    test('GlobalCommunityAdmin privileges to Space / Community / Communication / Updates', async () => {
      // Act
      const response = await getSpaceData(
        entitiesId.spaceId,
        TestUser.GLOBAL_COMMUNITY_ADMIN
      );
      const data =
        response.data?.space?.community?.communication?.updates.authorization
          ?.myPrivileges ?? [];

      // Assert
      expect(data.sort()).toEqual(
        sorted__create_read_update_delete_grant_createMessage_messageReaction_messageReply
      );
    });
  });

  describe('Collaboration', () => {
    test('GlobalCommunityAdmin privileges to Space / Collaboration', async () => {
      // Act
      const response = await getSpaceData(
        entitiesId.spaceId,
        TestUser.GLOBAL_COMMUNITY_ADMIN
      );
      const data =
        response.data?.space?.collaboration?.authorization?.myPrivileges ?? [];

      // Assert
      expect(data.sort()).toEqual(sorted__read_createRelation);
    });

    // Skip due to bug: https://app.zenspace.com/workspaces/alkemio-development-5ecb98b262ebd9f4aec4194c/issues/alkem-io/server/2143
    test.skip('GlobalCommunityAdmin privileges to Space / Collaboration / Relations', async () => {
      // Act
      const response = await getSpaceData(
        entitiesId.spaceId,
        TestUser.GLOBAL_COMMUNITY_ADMIN
      );
      const data =
        response.data?.space?.collaboration?.relations?.[0].authorization
          ?.myPrivileges ?? [];

      // Assert
      expect(data).toEqual([
        'CREATE',
        'GRANT',
        'READ',
        'UPDATE',
        'DELETE',
        'CREATE_RELATION',
        'CREATE_CALLOUT',
      ]);
    });

    test('GlobalCommunityAdmin privileges to Space / Collaboration / Callout', async () => {
      // Act
      const response = await getSpaceData(
        entitiesId.spaceId,
        TestUser.GLOBAL_COMMUNITY_ADMIN
      );
      const data =
        response.data?.space?.collaboration?.callouts?.[0].authorization
          ?.myPrivileges ?? [];

      // Assert
      expect(data.sort()).toEqual(readPrivilege);
    });

    test('GlobalCommunityAdmin privileges to Space / Collaboration / Callout / Post', async () => {
      // Act
      const response = await getDataPerSpaceCallout(
        entitiesId.spaceId,
        entitiesId.space.calloutId,
        TestUser.GLOBAL_COMMUNITY_ADMIN
      );
      const data =
        response.data?.space?.collaboration?.callouts?.[0].contributions?.filter(
          c => c.post !== null
        )[0].post?.authorization?.myPrivileges ?? [];

      // Assert
      expect(data.sort()).toEqual(readPrivilege);
    });

    // ToDo
    test.skip('GlobalCommunityAdmin privileges to Space / Collaboration / Callout / Whiteboard', async () => {
      // Act
      // const response = await getDataPerSpaceCallout(
      //   entitiesId.spaceId,
      //   entitiesId.space.calloutId,
      //   TestUser.GLOBAL_COMMUNITY_ADMIN
      // );
      // const data =
      //   response.body.data.space.collaboration.callouts[0].posts[0]
      //     .authorization.myPrivileges;
      // // Assert
      // expect(data).toEqual([
      //   'CREATE',
      //   'GRANT',
      //   'READ',
      //   'UPDATE',
      //   'DELETE',
      //   'UPDATE_WHITEBOARD',
      //   'CREATE_COMMENT',
      // ]);
    });

    // ToDo
    test.skip('GlobalCommunityAdmin privileges to Space / Collaboration / Callout / Comments', async () => {
      // Act
      // const response = await getDataPerSpaceCallout(
      //   entitiesId.spaceId,
      //   entitiesId.space.calloutId,
      //   TestUser.GLOBAL_COMMUNITY_ADMIN
      // );
      // const data =
      //   response.body.data.space.collaboration.callouts[0].posts[0]
      //     .authorization.myPrivileges;
      // // Assert
      // expect(data).toEqual([
      //   'CREATE',
      //   'GRANT',
      //   'READ',
      //   'UPDATE',
      //   'DELETE',
      //   'UPDATE_WHITEBOARD',
      //   'CREATE_COMMENT',
      // ]);
    });
  });

  describe('Templates', () => {
    test('GlobalCommunityAdmin privileges to Space / Templates', async () => {
      // Act
      const response = await getSpaceData(
        entitiesId.spaceId,
        TestUser.GLOBAL_COMMUNITY_ADMIN
      );
      const data =
        response.data?.space?.library?.authorization?.myPrivileges ??
        [];

      // Assert
      expect(data.sort()).toEqual(readPrivilege);
    });

    test('GlobalCommunityAdmin privileges to Space / Templates / Post', async () => {
      // Act
      const response = await getSpaceData(
        entitiesId.spaceId,
        TestUser.GLOBAL_COMMUNITY_ADMIN
      );
      const data =
        response.data?.space?.library?.postTemplates[0].authorization
          ?.myPrivileges ?? [];

      // Assert
      expect(data.sort()).toEqual(readPrivilege);
    });

    test('GlobalCommunityAdmin privileges to Space / Templates / Lifecycle', async () => {
      // Act
      const response = await getSpaceData(
        entitiesId.spaceId,
        TestUser.GLOBAL_COMMUNITY_ADMIN
      );
      const data =
        response.data?.space?.library?.innovationFlowTemplates[0]
          .authorization?.myPrivileges ?? [];

      // Assert
      expect(data.sort()).toEqual(readPrivilege);
    });

    // ToDo
    test.skip('GlobalCommunityAdmin privileges to Space / Templates / Whiteboard', async () => {
      // Act
      // const response = await getSpaceData(
      //   entitiesId.spaceId,
      //   TestUser.GLOBAL_COMMUNITY_ADMIN
      // );
      // const data =
      //   response.body.data.space.templates.whiteboardTemplates[0].authorization
      //     .myPrivileges;
      // // Assert
      // expect(data).toEqual(['READ']);
    });
  });

  describe('Preferences', () => {
    test('GlobalCommunityAdmin privileges to Space / Preferences', async () => {
      // Act
      const response = await getSpaceData(
        entitiesId.spaceId,
        TestUser.GLOBAL_COMMUNITY_ADMIN
      );
      const data = response.data?.space.preferences ?? [];

      // Assert
      data.map((item: any) => {
        expect(item.authorization.myPrivileges.sort()).toEqual(readPrivilege);
      });
    });
  });
});
