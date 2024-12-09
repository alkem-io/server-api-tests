/* eslint-disable quotes */
import { uniqueId } from '@test/utils/mutations/create-mutation';
import { TestUser } from '@test/utils';
import {
  deleteDocument,
  getProfileDocuments,
  uploadFileOnLink,
  uploadFileOnRef,
  uploadFileOnStorageBucket,
  uploadImageOnVisual,
} from '../upload.params';
import path from 'path';
import { deleteOrganization } from '../../contributor-management/organization/organization.request.params';
import {
  createChallengeWithUsers,
  createOrgAndSpaceWithUsers,
} from '@test/utils/data-setup/entities';
import { lookupProfileVisuals } from '../../lookup/lookup-request.params';
import {
  deleteSpace,
  updateSpacePlatformSettings,
  updateSpaceSettings,
} from '../../journey/space/space.request.params';
import {
  sorted__create_read_update_delete_grant,
  sorted__create_read_update_delete_grant_contribute,
  sorted__create_read_update_delete_grant_contribute_updateContent,
  sorted__create_read_update_delete_grant_contribute_updateContentt,
  sorted__create_read_update_delete_grant_fileUp_fileDel,
  sorted__create_read_update_delete_grant_fileUp_fileDel_contribute,
  sorted__create_read_update_delete_grant_fileUp_fileDel_contribute_updateContent,
} from '@test/non-functional/auth/my-privileges/common';
import {
  createLinkCollectionCallout,
  createLinkOnCallout,
} from '../../callout/collection-of-links/collection-of-links-callout.params.request';
import {
  calloutLinkContributionStorageConfig,
  calloutPostCardStorageConfig,
  calloutStorageConfig,
  calloutWhiteboardStorageConfig,
  whiteboardCalloutStorageConfig,
} from '../../callout/storage/callout-storage-config.params.request';
import {
  createPostCardOnCallout,
  createPostCollectionCallout,
} from '../../callout/post/post-collection-callout.params.request';
import {
  createWhiteboardCollectionCallout,
  createWhiteboardOnCallout,
} from '../../callout/call-for-whiteboards/whiteboard-collection-callout.params.request';
import { createWhiteboardCallout } from '../../callout/whiteboard/whiteboard-callout.params.request';
import { SpaceVisibility } from '@alkemio/client-lib/dist/types/alkemio-schema';
import { createReferenceOnProfile } from '../../references/references.request.params';
import { entitiesId } from '../../../types/entities-helper';
import { SpacePrivacyMode } from '@test/generated/alkemio-schema';

const organizationName = 'org-name' + uniqueId;
const hostNameId = 'org-nameid' + uniqueId;
const spaceName = 'lifec-eco-name' + uniqueId;
const spaceNameId = 'lifec-eco-nameid' + uniqueId;
const challengeName = `chName${uniqueId}`;
let refId = '';
let documentId = '';

beforeAll(async () => {
  await createOrgAndSpaceWithUsers(
    organizationName,
    hostNameId,
    spaceName,
    spaceNameId
  );

  await createChallengeWithUsers(challengeName);

  await updateSpacePlatformSettings(
    entitiesId.spaceId,
    spaceNameId,
    SpaceVisibility.Active
  );

  await updateSpaceSettings(entitiesId.spaceId, {
    privacy: { mode: SpacePrivacyMode.Private },
  });

  const a = await updateSpaceSettings(entitiesId.challenge.id, {
    privacy: { mode: SpacePrivacyMode.Private },
    collaboration: {
      inheritMembershipRights: true,
      allowMembersToCreateCallouts: false,
      allowMembersToCreateSubspaces: false,
    },
  });
});
afterAll(async () => {
  await deleteSpace(entitiesId.challenge.id);
  await deleteSpace(entitiesId.spaceId);
  await deleteOrganization(entitiesId.organization.id);
});

describe('Private Space - Private Challenge - visual on profile', () => {
  describe('Access to Space Profile visual', () => {
    afterAll(async () => {
      await deleteDocument(documentId);
    });
    beforeAll(async () => {
      const visualData = await lookupProfileVisuals(
        entitiesId.challenge.profileId
      );
      const visualId = visualData.data?.lookup.profile?.visuals[0].id ?? '';
      await uploadImageOnVisual(
        path.join(__dirname, 'files-to-upload', '190-410.jpg'),
        visualId
      );

      const getDocId = await getProfileDocuments(
        entitiesId.challenge.profileId,
        TestUser.GLOBAL_ADMIN
      );

      documentId =
        getDocId.data?.lookup?.profile?.storageBucket?.documents[0].id ?? '';
    });

    // Arrange
    test.each`
      userRole                     | privileges                                 | anonymousReadAccess
      ${undefined}                 | ${undefined}                               | ${undefined}
      ${TestUser.NON_HUB_MEMBER}   | ${undefined}                               | ${undefined}
      ${TestUser.GLOBAL_ADMIN}     | ${sorted__create_read_update_delete_grant} | ${true}
      ${TestUser.HUB_ADMIN}        | ${sorted__create_read_update_delete_grant} | ${true}
      ${TestUser.HUB_MEMBER}       | ${['READ']}                                | ${true}
      ${TestUser.CHALLENGE_ADMIN}  | ${sorted__create_read_update_delete_grant} | ${true}
      ${TestUser.CHALLENGE_MEMBER} | ${['READ']}                                | ${true}
    `(
      'User: "$userRole" has this privileges: "$privileges" to space challenge profile visual document',
      async ({ userRole, privileges, anonymousReadAccess }) => {
        const res = await getProfileDocuments(
          entitiesId.challenge.profileId,
          userRole
        );
        const data =
          res.data?.space?.subspace?.profile?.storageBucket?.documents[0];
        const dataAuthorization = data?.authorization;

        expect(dataAuthorization?.myPrivileges?.sort()).toEqual(privileges);
        expect(dataAuthorization?.anonymousReadAccess).toEqual(
          anonymousReadAccess
        );
      }
    );

    test.each`
      userRole                     | privileges                                                | anonymousReadAccess | parentEntityType
      ${undefined}                 | ${undefined}                                              | ${undefined}        | ${undefined}
      ${TestUser.NON_HUB_MEMBER}   | ${undefined}                                              | ${undefined}        | ${undefined}
      ${TestUser.GLOBAL_ADMIN}     | ${sorted__create_read_update_delete_grant_fileUp_fileDel} | ${true}             | ${'CHALLENGE'}
      ${TestUser.HUB_ADMIN}        | ${sorted__create_read_update_delete_grant_fileUp_fileDel} | ${true}             | ${'CHALLENGE'}
      ${TestUser.HUB_MEMBER}       | ${['READ']}                                               | ${true}             | ${'CHALLENGE'}
      ${TestUser.CHALLENGE_ADMIN}  | ${sorted__create_read_update_delete_grant_fileUp_fileDel} | ${true}             | ${'CHALLENGE'}
      ${TestUser.CHALLENGE_MEMBER} | ${['READ']}                                               | ${true}             | ${'CHALLENGE'}
    `(
      'User: "$userRole" has this privileges: "$privileges" to space challenge profile storage bucket',
      async ({
        userRole,
        privileges,
        anonymousReadAccess,
        parentEntityType,
      }) => {
        const res = await getProfileDocuments(
          entitiesId.challenge.profileId,
          userRole
        );
        const data = res.data?.lookup?.profile?.storageBucket;

        expect(data?.authorization?.myPrivileges?.sort()).toEqual(privileges);
        expect(data?.authorization?.anonymousReadAccess).toEqual(
          anonymousReadAccess
        );
        expect(data?.parentEntity?.type).toEqual(parentEntityType);
      }
    );
  });

  describe('Access to Space Profile reference', () => {
    afterAll(async () => {
      await deleteDocument(documentId);
    });
    beforeAll(async () => {
      const refData = await createReferenceOnProfile(
        entitiesId.challenge.profileId
      );
      refId = refData?.data?.createReferenceOnProfile?.id ?? '';
      await uploadFileOnRef(
        path.join(__dirname, 'files-to-upload', 'image.png'),
        refId
      );

      const getDocId = await getProfileDocuments(
        entitiesId.challenge.profileId,
        TestUser.GLOBAL_ADMIN
      );
      documentId =
        getDocId.data?.lookup?.profile?.storageBucket?.documents[0].id ?? '';
    });

    // Arrange
    test.each`
      userRole                     | privileges                                 | anonymousReadAccess
      ${undefined}                 | ${undefined}                               | ${undefined}
      ${TestUser.NON_HUB_MEMBER}   | ${undefined}                               | ${undefined}
      ${TestUser.GLOBAL_ADMIN}     | ${sorted__create_read_update_delete_grant} | ${true}
      ${TestUser.HUB_ADMIN}        | ${sorted__create_read_update_delete_grant} | ${true}
      ${TestUser.HUB_MEMBER}       | ${['READ']}                                | ${true}
      ${TestUser.CHALLENGE_ADMIN}  | ${sorted__create_read_update_delete_grant} | ${true}
      ${TestUser.CHALLENGE_MEMBER} | ${['READ']}                                | ${true}
    `(
      'User: "$userRole" has this privileges: "$privileges" to space challenge profile reference document',
      async ({ userRole, privileges, anonymousReadAccess }) => {
        const res = await getProfileDocuments(
          entitiesId.challenge.profileId,
          userRole
        );

        const data = res.data?.lookup?.profile?.storageBucket?.documents[0];

        const dataAuthorization = data?.authorization;

        expect(dataAuthorization?.myPrivileges?.sort()).toEqual(privileges);
        expect(dataAuthorization?.anonymousReadAccess).toEqual(
          anonymousReadAccess
        );
      }
    );

    test.each`
      userRole                   | privileges                                                | anonymousReadAccess | parentEntityType
      ${undefined}               | ${undefined}                                              | ${undefined}        | ${undefined}
      ${TestUser.NON_HUB_MEMBER} | ${undefined}                                              | ${undefined}        | ${undefined}
      ${TestUser.GLOBAL_ADMIN}   | ${sorted__create_read_update_delete_grant_fileUp_fileDel} | ${true}             | ${'CHALLENGE'}
      ${TestUser.HUB_ADMIN}      | ${sorted__create_read_update_delete_grant_fileUp_fileDel} | ${true}             | ${'CHALLENGE'}
      ${TestUser.HUB_MEMBER}     | ${['READ']}                                               | ${true}             | ${'CHALLENGE'}
      ${TestUser.GLOBAL_ADMIN}   | ${sorted__create_read_update_delete_grant_fileUp_fileDel} | ${true}             | ${'CHALLENGE'}
      ${TestUser.HUB_MEMBER}     | ${['READ']}                                               | ${true}             | ${'CHALLENGE'}
    `(
      'User: "$userRole" has this privileges: "$privileges" to space challenge profile storage bucket',
      async ({
        userRole,
        privileges,
        anonymousReadAccess,
        parentEntityType,
      }) => {
        const res = await getProfileDocuments(
          entitiesId.challenge.profileId,
          userRole
        );

        const data = res.data?.lookup?.profile?.storageBucket;

        expect(data?.authorization?.myPrivileges?.sort()).toEqual(privileges);
        expect(data?.authorization?.anonymousReadAccess).toEqual(
          anonymousReadAccess
        );
        expect(data?.parentEntity?.type).toEqual(parentEntityType);
      }
    );
  });

  describe('Access to Space Context (space storage)', () => {
    afterAll(async () => {
      await deleteDocument(documentId);
    });
    beforeAll(async () => {
      const getSpaceStorageId = await getProfileDocuments(
        entitiesId.challenge.profileId,
        TestUser.GLOBAL_ADMIN
      );

      const storageId =
        getSpaceStorageId.data?.lookup?.profile?.storageBucket?.id ?? '';

      await uploadFileOnStorageBucket(
        path.join(__dirname, 'files-to-upload', 'image.png'),
        storageId
      );

      const getDocId = await getProfileDocuments(
        entitiesId.challenge.profileId,
        TestUser.GLOBAL_ADMIN
      );

      documentId =
        getDocId.data?.lookup?.profile?.storageBucket?.documents[0].id ?? '';
    });

    // Arrange
    test.each`
      userRole                     | privileges                                 | anonymousReadAccess
      ${undefined}                 | ${undefined}                               | ${undefined}
      ${TestUser.NON_HUB_MEMBER}   | ${undefined}                               | ${undefined}
      ${TestUser.GLOBAL_ADMIN}     | ${sorted__create_read_update_delete_grant} | ${true}
      ${TestUser.HUB_ADMIN}        | ${sorted__create_read_update_delete_grant} | ${true}
      ${TestUser.HUB_MEMBER}       | ${['READ']}                                | ${true}
      ${TestUser.CHALLENGE_ADMIN}  | ${sorted__create_read_update_delete_grant} | ${true}
      ${TestUser.CHALLENGE_MEMBER} | ${['READ']}                                | ${true}
    `(
      'User: "$userRole" has this privileges: "$privileges" to space context (storageBucket) document',
      async ({ userRole, privileges, anonymousReadAccess }) => {
        const res = await getProfileDocuments(
          entitiesId.challenge.profileId,
          userRole
        );

        const data = res.data?.lookup?.profile?.storageBucket?.documents[0];

        const dataAuthorization = data?.authorization;

        expect(dataAuthorization?.myPrivileges?.sort()).toEqual(privileges);
        expect(dataAuthorization?.anonymousReadAccess).toEqual(
          anonymousReadAccess
        );
      }
    );

    test.each`
      userRole                     | privileges                                                | anonymousReadAccess | parentEntityType
      ${undefined}                 | ${undefined}                                              | ${undefined}        | ${undefined}
      ${TestUser.NON_HUB_MEMBER}   | ${undefined}                                              | ${undefined}        | ${undefined}
      ${TestUser.GLOBAL_ADMIN}     | ${sorted__create_read_update_delete_grant_fileUp_fileDel} | ${true}             | ${'CHALLENGE'}
      ${TestUser.HUB_ADMIN}        | ${sorted__create_read_update_delete_grant_fileUp_fileDel} | ${true}             | ${'CHALLENGE'}
      ${TestUser.HUB_MEMBER}       | ${['READ']}                                               | ${true}             | ${'CHALLENGE'}
      ${TestUser.CHALLENGE_ADMIN}  | ${sorted__create_read_update_delete_grant_fileUp_fileDel} | ${true}             | ${'CHALLENGE'}
      ${TestUser.CHALLENGE_MEMBER} | ${['READ']}                                               | ${true}             | ${'CHALLENGE'}
    `(
      'User: "$userRole" has this privileges: "$privileges" to space context storage bucket',
      async ({
        userRole,
        privileges,
        anonymousReadAccess,
        parentEntityType,
      }) => {
        const res = await getProfileDocuments(
          entitiesId.challenge.profileId,
          userRole
        );
        const data = res.data?.lookup?.profile?.storageBucket;

        expect(data?.authorization?.myPrivileges?.sort()).toEqual(privileges);
        expect(data?.authorization?.anonymousReadAccess).toEqual(
          anonymousReadAccess
        );
        expect(data?.parentEntity?.type).toEqual(parentEntityType);
      }
    );
  });

  describe('Access to Link collections', () => {
    let calloutId: string;
    afterAll(async () => {
      await deleteDocument(documentId);
    });
    beforeAll(async () => {
      const linkCallout = await createLinkCollectionCallout(
        entitiesId.challenge.collaborationId,
        'link11',
        'Link collection Callout1',
        TestUser.GLOBAL_ADMIN
      );
      calloutId = linkCallout.data?.createCalloutOnCollaboration?.id ?? '';

      const refData = await createLinkOnCallout(calloutId);
      refId = refData?.data?.createContributionOnCallout?.link?.id ?? '';
      await uploadFileOnLink(
        path.join(__dirname, 'files-to-upload', 'image.png'),
        refId
      );
      const res = await calloutLinkContributionStorageConfig(
        refId,
        calloutId,
        TestUser.GLOBAL_ADMIN
      );

      documentId =
        res.data?.lookup?.callout?.contributions?.find(
          c => c.link && c.link.id === refId
        )?.link?.profile.storageBucket.documents[0].id ?? '';
    });

    // Arrange
    test.each`
      userRole                     | privileges                                            | anonymousReadAccess
      ${undefined}                 | ${undefined}                                          | ${undefined}
      ${TestUser.NON_HUB_MEMBER}   | ${undefined}                                          | ${undefined}
      ${TestUser.GLOBAL_ADMIN}     | ${sorted__create_read_update_delete_grant_contribute} | ${false}
      ${TestUser.HUB_ADMIN}        | ${sorted__create_read_update_delete_grant_contribute} | ${false}
      ${TestUser.HUB_MEMBER}       | ${undefined}                                          | ${undefined}
      ${TestUser.CHALLENGE_ADMIN}  | ${sorted__create_read_update_delete_grant_contribute} | ${false}
      ${TestUser.CHALLENGE_MEMBER} | ${['CONTRIBUTE', 'READ']}                             | ${false}
    `(
      'User: "$userRole" has this privileges: "$privileges" to space link collection callout (storageBucket) document',
      async ({ userRole, privileges, anonymousReadAccess }) => {
        const res = await calloutLinkContributionStorageConfig(
          refId,
          calloutId,
          userRole
        );
        const data = res.data?.lookup?.callout?.contributions?.find(
          c => c.link && c.link.id === refId
        )?.link?.profile.storageBucket.documents[0].authorization;

        expect(data?.myPrivileges?.sort()).toEqual(privileges);
        expect(data?.anonymousReadAccess).toEqual(anonymousReadAccess);
      }
    );

    test.each`
      userRole                     | privileges                                                           | anonymousReadAccess | parentEntityType
      ${undefined}                 | ${undefined}                                                         | ${undefined}        | ${undefined}
      ${TestUser.NON_HUB_MEMBER}   | ${undefined}                                                         | ${undefined}        | ${undefined}
      ${TestUser.GLOBAL_ADMIN}     | ${sorted__create_read_update_delete_grant_fileUp_fileDel_contribute} | ${false}            | ${'CALLOUT_FRAMING'}
      ${TestUser.HUB_ADMIN}        | ${sorted__create_read_update_delete_grant_fileUp_fileDel_contribute} | ${false}            | ${'CALLOUT_FRAMING'}
      ${TestUser.HUB_MEMBER}       | ${undefined}                                                         | ${undefined}        | ${undefined}
      ${TestUser.CHALLENGE_ADMIN}  | ${sorted__create_read_update_delete_grant_fileUp_fileDel_contribute} | ${false}            | ${'CALLOUT_FRAMING'}
      ${TestUser.CHALLENGE_MEMBER} | ${['CONTRIBUTE', 'FILE_UPLOAD', 'READ']}                             | ${false}            | ${'CALLOUT_FRAMING'}
    `(
      'User: "$userRole" has this privileges: "$privileges" to space link collection callout storage bucket',
      async ({
        userRole,
        privileges,
        anonymousReadAccess,
        parentEntityType,
      }) => {
        const res = await calloutStorageConfig(calloutId, userRole);
        const data = res.data?.lookup?.callout?.framing.profile.storageBucket;

        expect(data?.authorization?.myPrivileges?.sort()).toEqual(privileges);
        expect(data?.authorization?.anonymousReadAccess).toEqual(
          anonymousReadAccess
        );
        expect(data?.parentEntity?.type).toEqual(parentEntityType);
      }
    );
  });

  describe('Access to Call for Posts Post Card visual(banner) documents', () => {
    let calloutId: string;
    let postCardId: string;

    afterAll(async () => {
      await deleteDocument(documentId);
    });
    beforeAll(async () => {
      const callout = await createPostCollectionCallout(
        entitiesId.challenge.collaborationId,
        'post11',
        'Post collection Callout1',
        TestUser.GLOBAL_ADMIN
      );

      calloutId = callout.data?.createCalloutOnCollaboration?.id ?? '';

      const postData = await createPostCardOnCallout(calloutId);
      const postDataBase = postData.data?.createContributionOnCallout?.post;
      const visualId = postDataBase?.profile?.visual?.id ?? '';
      postCardId = postDataBase?.id ?? '';

      await uploadImageOnVisual(
        path.join(__dirname, 'files-to-upload', '190-410.jpg'),
        visualId
      );

      const res = await calloutPostCardStorageConfig(
        postCardId,
        calloutId,
        TestUser.GLOBAL_ADMIN
      );

      documentId =
        res.data?.lookup?.callout?.contributions?.[0].post?.profile
          .storageBucket.documents[0].id ?? '';
    });

    // Arrange
    test.each`
      userRole                     | privileges                                            | anonymousReadAccess
      ${undefined}                 | ${undefined}                                          | ${undefined}
      ${TestUser.NON_HUB_MEMBER}   | ${undefined}                                          | ${undefined}
      ${TestUser.GLOBAL_ADMIN}     | ${sorted__create_read_update_delete_grant_contribute} | ${false}
      ${TestUser.HUB_ADMIN}        | ${sorted__create_read_update_delete_grant_contribute} | ${false}
      ${TestUser.HUB_MEMBER}       | ${undefined}                                          | ${undefined}
      ${TestUser.CHALLENGE_ADMIN}  | ${sorted__create_read_update_delete_grant_contribute} | ${false}
      ${TestUser.CHALLENGE_MEMBER} | ${['CONTRIBUTE', 'READ']}                             | ${false}
    `(
      'User: "$userRole" has this privileges: "$privileges" to space challenge visual for post of call for post  callout (storageBucket) document',
      async ({ userRole, privileges, anonymousReadAccess }) => {
        const res = await calloutPostCardStorageConfig(
          postCardId,
          calloutId,
          userRole
        );

        const data =
          res.data?.lookup.callout?.contributions?.[0].post?.profile
            .storageBucket.documents[0].authorization;

        expect(data?.myPrivileges?.sort()).toEqual(privileges);
        expect(data?.anonymousReadAccess).toEqual(anonymousReadAccess);
      }
    );

    test.each`
      userRole                     | privileges                                                           | anonymousReadAccess | parentEntityType
      ${undefined}                 | ${undefined}                                                         | ${undefined}        | ${undefined}
      ${TestUser.NON_HUB_MEMBER}   | ${undefined}                                                         | ${undefined}        | ${undefined}
      ${TestUser.GLOBAL_ADMIN}     | ${sorted__create_read_update_delete_grant_fileUp_fileDel_contribute} | ${false}            | ${'POST'}
      ${TestUser.HUB_ADMIN}        | ${sorted__create_read_update_delete_grant_fileUp_fileDel_contribute} | ${false}            | ${'POST'}
      ${TestUser.HUB_MEMBER}       | ${undefined}                                                         | ${undefined}        | ${undefined}
      ${TestUser.CHALLENGE_ADMIN}  | ${sorted__create_read_update_delete_grant_fileUp_fileDel_contribute} | ${false}            | ${'POST'}
      ${TestUser.CHALLENGE_MEMBER} | ${['CONTRIBUTE', 'FILE_UPLOAD', 'READ']}                             | ${false}            | ${'POST'}
    `(
      'User: "$userRole" has this privileges: "$privileges" to space challenge post collection callout storage bucket',
      async ({
        userRole,
        privileges,
        anonymousReadAccess,
        parentEntityType,
      }) => {
        const res = await calloutPostCardStorageConfig(
          postCardId,
          calloutId,
          userRole
        );

        const data =
          res.data?.lookup.callout?.contributions?.[0].post?.profile
            .storageBucket;

        expect(data?.authorization?.myPrivileges?.sort()).toEqual(privileges);
        expect(data?.authorization?.anonymousReadAccess).toEqual(
          anonymousReadAccess
        );
        expect(data?.parentEntity?.type).toEqual(parentEntityType);
      }
    );
  });

  describe('Access to Call for Posts Post Card reference documents', () => {
    let calloutId: string;
    let postCardId: string;

    afterAll(async () => {
      await deleteDocument(documentId);
    });
    beforeAll(async () => {
      const calloutData = await createPostCollectionCallout(
        entitiesId.challenge.collaborationId,
        'post12',
        'Post collection Callout12',
        TestUser.GLOBAL_ADMIN
      );
      calloutId = calloutData.data?.createCalloutOnCollaboration?.id ?? '';

      const postData = await createPostCardOnCallout(calloutId);
      const postDataBase = postData.data?.createContributionOnCallout?.post;
      const postCardProfilelId = postDataBase?.profile?.id ?? '';
      postCardId = postDataBase?.id ?? '';

      const refData = await createReferenceOnProfile(postCardProfilelId);
      refId = refData?.data?.createReferenceOnProfile?.id ?? '';

      await uploadFileOnRef(
        path.join(__dirname, 'files-to-upload', 'image.png'),
        refId
      );

      const res = await calloutPostCardStorageConfig(
        postCardId,
        calloutId,
        TestUser.GLOBAL_ADMIN
      );

      documentId =
        res.data?.lookup.callout?.contributions?.[0].post?.profile.storageBucket
          .documents[0].id ?? '';
    });

    // Arrange
    test.each`
      userRole                     | privileges                                            | anonymousReadAccess
      ${undefined}                 | ${undefined}                                          | ${undefined}
      ${TestUser.NON_HUB_MEMBER}   | ${undefined}                                          | ${undefined}
      ${TestUser.GLOBAL_ADMIN}     | ${sorted__create_read_update_delete_grant_contribute} | ${false}
      ${TestUser.HUB_ADMIN}        | ${sorted__create_read_update_delete_grant_contribute} | ${false}
      ${TestUser.HUB_MEMBER}       | ${undefined}                                          | ${undefined}
      ${TestUser.CHALLENGE_ADMIN}  | ${sorted__create_read_update_delete_grant_contribute} | ${false}
      ${TestUser.CHALLENGE_MEMBER} | ${['CONTRIBUTE', 'READ']}                             | ${false}
    `(
      'User: "$userRole" has this privileges: "$privileges" to space visual for post of call for post  callout (storageBucket) document',
      async ({ userRole, privileges, anonymousReadAccess }) => {
        const res = await calloutPostCardStorageConfig(
          postCardId,
          calloutId,
          userRole
        );
        const data =
          res.data?.lookup.callout?.contributions?.[0].post?.profile
            .storageBucket?.documents[0].authorization;

        expect(data?.myPrivileges?.sort()).toEqual(privileges);
        expect(data?.anonymousReadAccess).toEqual(anonymousReadAccess);
      }
    );

    test.each`
      userRole                     | privileges                                                           | anonymousReadAccess | parentEntityType
      ${undefined}                 | ${undefined}                                                         | ${undefined}        | ${undefined}
      ${TestUser.NON_HUB_MEMBER}   | ${undefined}                                                         | ${undefined}        | ${undefined}
      ${TestUser.GLOBAL_ADMIN}     | ${sorted__create_read_update_delete_grant_fileUp_fileDel_contribute} | ${false}            | ${'POST'}
      ${TestUser.HUB_ADMIN}        | ${sorted__create_read_update_delete_grant_fileUp_fileDel_contribute} | ${false}            | ${'POST'}
      ${TestUser.HUB_MEMBER}       | ${undefined}                                                         | ${undefined}        | ${undefined}
      ${TestUser.CHALLENGE_ADMIN}  | ${sorted__create_read_update_delete_grant_fileUp_fileDel_contribute} | ${false}            | ${'POST'}
      ${TestUser.CHALLENGE_MEMBER} | ${['CONTRIBUTE', 'FILE_UPLOAD', 'READ']}                             | ${false}            | ${'POST'}
    `(
      'User: "$userRole" has this privileges: "$privileges" to space post collection callout storage bucket',
      async ({
        userRole,
        privileges,
        anonymousReadAccess,
        parentEntityType,
      }) => {
        const res = await calloutPostCardStorageConfig(
          postCardId,
          calloutId,
          userRole
        );

        const data =
          res.data?.lookup.callout?.contributions?.[0].post?.profile
            .storageBucket;

        expect(data?.authorization?.myPrivileges?.sort()).toEqual(privileges);
        expect(data?.authorization?.anonymousReadAccess).toEqual(
          anonymousReadAccess
        );
        expect(data?.parentEntity?.type).toEqual(parentEntityType);
      }
    );
  });

  describe('Access to Call for Whitaboards Whiteboard visual(banner) documents', () => {
    let calloutId: string;
    let whiteboardCardId: string;

    afterAll(async () => {
      await deleteDocument(documentId);
    });
    beforeAll(async () => {
      const hu = await createWhiteboardCollectionCallout(
        entitiesId.challenge.collaborationId,
        'whiteboard11',
        'Whiteboard collection Callout1',
        TestUser.GLOBAL_ADMIN
      );

      calloutId = hu.data?.createCalloutOnCollaboration?.id ?? '';

      const whiteboardData = await createWhiteboardOnCallout(calloutId);
      const whiteboardDataBase =
        whiteboardData.data?.createContributionOnCallout?.whiteboard;
      const visualId = whiteboardDataBase?.profile?.visual?.id ?? '';
      whiteboardCardId = whiteboardDataBase?.id ?? '';

      await uploadImageOnVisual(
        path.join(__dirname, 'files-to-upload', '190-410.jpg'),
        visualId
      );

      const res = await calloutWhiteboardStorageConfig(
        whiteboardCardId,
        calloutId,
        TestUser.GLOBAL_ADMIN
      );

      documentId =
        res.data?.lookup.callout?.contributions?.[0].whiteboard?.profile
          .storageBucket.documents[0].id ?? '';
    });

    // Arrange
    test.each`
      userRole                     | privileges                                                          | anonymousReadAccess
      ${undefined}                 | ${undefined}                                                        | ${undefined}
      ${TestUser.NON_HUB_MEMBER}   | ${undefined}                                                        | ${undefined}
      ${TestUser.GLOBAL_ADMIN}     | ${sorted__create_read_update_delete_grant_contribute_updateContent} | ${false}
      ${TestUser.HUB_ADMIN}        | ${sorted__create_read_update_delete_grant_contribute}               | ${false}
      ${TestUser.HUB_MEMBER}       | ${undefined}                                                        | ${undefined}
      ${TestUser.CHALLENGE_ADMIN}  | ${sorted__create_read_update_delete_grant_contribute}               | ${false}
      ${TestUser.CHALLENGE_MEMBER} | ${['CONTRIBUTE', 'READ']}                                           | ${false}
    `(
      'User: "$userRole" has this privileges: "$privileges" to space challenge visual for whiteboard of call for whiteboards callout (storageBucket) document',
      async ({ userRole, privileges, anonymousReadAccess }) => {
        const res = await calloutWhiteboardStorageConfig(
          whiteboardCardId,
          calloutId,
          userRole
        );

        const data =
          res.data?.lookup.callout?.contributions?.[0].whiteboard?.profile
            .storageBucket.documents[0].authorization;

        expect(data?.myPrivileges?.sort()).toEqual(privileges);
        expect(data?.anonymousReadAccess).toEqual(anonymousReadAccess);
      }
    );

    test.each`
      userRole                     | privileges                                                                         | anonymousReadAccess | parentEntityType
      ${undefined}                 | ${undefined}                                                                       | ${undefined}        | ${undefined}
      ${TestUser.NON_HUB_MEMBER}   | ${undefined}                                                                       | ${undefined}        | ${undefined}
      ${TestUser.GLOBAL_ADMIN}     | ${sorted__create_read_update_delete_grant_fileUp_fileDel_contribute_updateContent} | ${false}            | ${'WHITEBOARD'}
      ${TestUser.HUB_ADMIN}        | ${sorted__create_read_update_delete_grant_fileUp_fileDel_contribute}               | ${false}            | ${'WHITEBOARD'}
      ${TestUser.HUB_MEMBER}       | ${undefined}                                                                       | ${undefined}        | ${undefined}
      ${TestUser.CHALLENGE_ADMIN}  | ${sorted__create_read_update_delete_grant_fileUp_fileDel_contribute}               | ${false}            | ${'WHITEBOARD'}
      ${TestUser.CHALLENGE_MEMBER} | ${['CONTRIBUTE', 'FILE_UPLOAD', 'READ']}                                           | ${false}            | ${'WHITEBOARD'}
    `(
      'User: "$userRole" has this privileges: "$privileges" to space challenge whiteboard collection callout storage bucket',
      async ({
        userRole,
        privileges,
        anonymousReadAccess,
        parentEntityType,
      }) => {
        const res = await calloutWhiteboardStorageConfig(
          whiteboardCardId,
          calloutId,
          userRole
        );

        const data =
          res.data?.lookup.callout?.contributions?.[0].whiteboard?.profile
            .storageBucket;

        expect(data?.authorization?.myPrivileges?.sort()).toEqual(privileges);
        expect(data?.authorization?.anonymousReadAccess).toEqual(
          anonymousReadAccess
        );
        expect(data?.parentEntity?.type).toEqual(parentEntityType);
      }
    );
  });

  describe('Access to Call for Posts Callout reference documents', () => {
    let calloutId: string;

    afterAll(async () => {
      await deleteDocument(documentId);
    });
    beforeAll(async () => {
      const callout = await createPostCollectionCallout(
        entitiesId.challenge.collaborationId,
        'post3',
        'Post collection Callout3',
        TestUser.GLOBAL_ADMIN
      );
      const calloutData = callout?.data?.createCalloutOnCollaboration;
      calloutId = calloutData?.id ?? '';
      const calloutProfileId = calloutData?.framing?.profile?.id ?? '';

      const refData = await createReferenceOnProfile(calloutProfileId);
      refId = refData?.data?.createReferenceOnProfile?.id ?? '';

      await uploadFileOnRef(
        path.join(__dirname, 'files-to-upload', 'image.png'),
        refId
      );

      const getDocId = await calloutStorageConfig(
        calloutId,
        TestUser.GLOBAL_ADMIN
      );

      documentId =
        getDocId.data?.lookup.callout?.framing.profile.storageBucket
          ?.documents[0].id ?? '';
    });

    // Arrange
    test.each`
      userRole                     | privileges                                            | anonymousReadAccess
      ${undefined}                 | ${undefined}                                          | ${undefined}
      ${TestUser.NON_HUB_MEMBER}   | ${undefined}                                          | ${undefined}
      ${TestUser.GLOBAL_ADMIN}     | ${sorted__create_read_update_delete_grant_contribute} | ${false}
      ${TestUser.HUB_ADMIN}        | ${sorted__create_read_update_delete_grant_contribute} | ${false}
      ${TestUser.HUB_MEMBER}       | ${undefined}                                          | ${undefined}
      ${TestUser.CHALLENGE_ADMIN}  | ${sorted__create_read_update_delete_grant_contribute} | ${false}
      ${TestUser.CHALLENGE_MEMBER} | ${['CONTRIBUTE', 'READ']}                             | ${false}
    `(
      'User: "$userRole" has this privileges: "$privileges" to space challenge visual for post of call for post  callout (storageBucket) document',
      async ({ userRole, privileges, anonymousReadAccess }) => {
        const res = await calloutStorageConfig(calloutId, userRole);

        const data =
          res.data?.lookup.callout?.framing.profile.storageBucket.documents[0]
            .authorization;

        expect(data?.myPrivileges?.sort()).toEqual(privileges);
        expect(data?.anonymousReadAccess).toEqual(anonymousReadAccess);
      }
    );

    test.each`
      userRole                     | privileges                                                           | anonymousReadAccess | parentEntityType
      ${undefined}                 | ${undefined}                                                         | ${undefined}        | ${undefined}
      ${TestUser.NON_HUB_MEMBER}   | ${undefined}                                                         | ${undefined}        | ${undefined}
      ${TestUser.GLOBAL_ADMIN}     | ${sorted__create_read_update_delete_grant_fileUp_fileDel_contribute} | ${false}            | ${'CALLOUT_FRAMING'}
      ${TestUser.HUB_ADMIN}        | ${sorted__create_read_update_delete_grant_fileUp_fileDel_contribute} | ${false}            | ${'CALLOUT_FRAMING'}
      ${TestUser.HUB_MEMBER}       | ${undefined}                                                         | ${undefined}        | ${undefined}
      ${TestUser.CHALLENGE_ADMIN}  | ${sorted__create_read_update_delete_grant_fileUp_fileDel_contribute} | ${false}            | ${'CALLOUT_FRAMING'}
      ${TestUser.CHALLENGE_MEMBER} | ${['CONTRIBUTE', 'FILE_UPLOAD', 'READ']}                             | ${false}            | ${'CALLOUT_FRAMING'}
    `(
      'User: "$userRole" has this privileges: "$privileges" to space challenge link collection callout storage bucket',
      async ({
        userRole,
        privileges,
        anonymousReadAccess,
        parentEntityType,
      }) => {
        const res = await calloutStorageConfig(calloutId, userRole);
        const data = res.data?.lookup.callout?.framing.profile.storageBucket;

        expect(data?.authorization?.myPrivileges?.sort()).toEqual(privileges);
        expect(data?.authorization?.anonymousReadAccess).toEqual(
          anonymousReadAccess
        );
        expect(data?.parentEntity?.type).toEqual(parentEntityType);
      }
    );
  });

  describe('Access to Call for Posts Callout visual(banner) documents', () => {
    let calloutId: string;

    afterAll(async () => {
      await deleteDocument(documentId);
    });
    beforeAll(async () => {
      const callout = await createPostCollectionCallout(
        entitiesId.challenge.collaborationId,
        'post4',
        'Post collection Callout4',
        TestUser.GLOBAL_ADMIN
      );

      const calloutData = callout?.data?.createCalloutOnCollaboration;
      calloutId = calloutData?.id ?? '';
      const calloutStorageBucketId =
        calloutData?.framing?.profile?.storageBucket?.id ?? '';

      await uploadFileOnStorageBucket(
        path.join(__dirname, 'files-to-upload', 'image.png'),
        calloutStorageBucketId
      );

      const getDocId = await calloutStorageConfig(
        calloutId,
        TestUser.GLOBAL_ADMIN
      );

      documentId =
        getDocId.data?.lookup.callout?.framing.profile.storageBucket
          ?.documents[0].id ?? '';
    });

    // Arrange
    test.each`
      userRole                     | privileges                                            | anonymousReadAccess
      ${undefined}                 | ${undefined}                                          | ${undefined}
      ${TestUser.NON_HUB_MEMBER}   | ${undefined}                                          | ${undefined}
      ${TestUser.GLOBAL_ADMIN}     | ${sorted__create_read_update_delete_grant_contribute} | ${false}
      ${TestUser.HUB_ADMIN}        | ${sorted__create_read_update_delete_grant_contribute} | ${false}
      ${TestUser.HUB_MEMBER}       | ${undefined}                                          | ${undefined}
      ${TestUser.CHALLENGE_ADMIN}  | ${sorted__create_read_update_delete_grant_contribute} | ${false}
      ${TestUser.CHALLENGE_MEMBER} | ${['CONTRIBUTE', 'READ']}                             | ${false}
    `(
      'User: "$userRole" has this privileges: "$privileges" to space challenge visual for post of call for post  callout (storageBucket) document',
      async ({ userRole, privileges, anonymousReadAccess }) => {
        const res = await calloutStorageConfig(calloutId, userRole);
        const data =
          res.data?.lookup.callout?.framing.profile.storageBucket.documents[0]
            .authorization;

        expect(data?.myPrivileges?.sort()).toEqual(privileges);
        expect(data?.anonymousReadAccess).toEqual(anonymousReadAccess);
      }
    );

    test.each`
      userRole                     | privileges                                                           | anonymousReadAccess | parentEntityType
      ${undefined}                 | ${undefined}                                                         | ${undefined}        | ${undefined}
      ${TestUser.NON_HUB_MEMBER}   | ${undefined}                                                         | ${undefined}        | ${undefined}
      ${TestUser.GLOBAL_ADMIN}     | ${sorted__create_read_update_delete_grant_fileUp_fileDel_contribute} | ${false}            | ${'CALLOUT_FRAMING'}
      ${TestUser.HUB_ADMIN}        | ${sorted__create_read_update_delete_grant_fileUp_fileDel_contribute} | ${false}            | ${'CALLOUT_FRAMING'}
      ${TestUser.HUB_MEMBER}       | ${undefined}                                                         | ${undefined}        | ${undefined}
      ${TestUser.CHALLENGE_ADMIN}  | ${sorted__create_read_update_delete_grant_fileUp_fileDel_contribute} | ${false}            | ${'CALLOUT_FRAMING'}
      ${TestUser.CHALLENGE_MEMBER} | ${['CONTRIBUTE', 'FILE_UPLOAD', 'READ']}                             | ${false}            | ${'CALLOUT_FRAMING'}
    `(
      'User: "$userRole" has this privileges: "$privileges" to challenge space link collection callout storage bucket',
      async ({
        userRole,
        privileges,
        anonymousReadAccess,
        parentEntityType,
      }) => {
        const res = await calloutStorageConfig(calloutId, userRole);
        const data = res.data?.lookup.callout?.framing.profile.storageBucket;

        expect(data?.authorization?.myPrivileges?.sort()).toEqual(privileges);
        expect(data?.authorization?.anonymousReadAccess).toEqual(
          anonymousReadAccess
        );
        expect(data?.parentEntity?.type).toEqual(parentEntityType);
      }
    );
  });

  describe('Access to Whiteboard Callout visual(banner) documents', () => {
    let calloutId: string;

    afterAll(async () => {
      await deleteDocument(documentId);
    });
    beforeAll(async () => {
      const callout = await createWhiteboardCallout(
        entitiesId.challenge.collaborationId,
        'whiteboard1',
        'Whiteboard Callout1',
        TestUser.GLOBAL_ADMIN
      );

      const calloutData = callout?.data?.createCalloutOnCollaboration;
      calloutId = calloutData?.id ?? '';
      const calloutStorageBucketId =
        calloutData?.framing?.whiteboard?.profile.storageBucket?.id ?? '';

      await uploadFileOnStorageBucket(
        path.join(__dirname, 'files-to-upload', 'image.png'),
        calloutStorageBucketId
      );

      const getDocId = await whiteboardCalloutStorageConfig(
        calloutId,
        TestUser.GLOBAL_ADMIN
      );

      documentId =
        getDocId.data?.lookup.callout?.framing.whiteboard?.profile.storageBucket
          ?.documents[0].id ?? '';
    });

    // Arrange
    test.each`
      userRole                     | privileges                                                          | anonymousReadAccess
      ${undefined}                 | ${undefined}                                                        | ${undefined}
      ${TestUser.NON_HUB_MEMBER}   | ${undefined}                                                        | ${undefined}
      ${TestUser.GLOBAL_ADMIN}     | ${sorted__create_read_update_delete_grant_contribute_updateContent} | ${false}
      ${TestUser.HUB_ADMIN}        | ${sorted__create_read_update_delete_grant_contribute}               | ${false}
      ${TestUser.HUB_MEMBER}       | ${undefined}                                                        | ${undefined}
      ${TestUser.CHALLENGE_ADMIN}  | ${sorted__create_read_update_delete_grant_contribute}               | ${false}
      ${TestUser.CHALLENGE_MEMBER} | ${['CONTRIBUTE', 'READ']}                                           | ${false}
    `(
      'User: "$userRole" has this privileges: "$privileges" to space challenge visual for whiteboard callout (storageBucket) document',
      async ({ userRole, privileges, anonymousReadAccess }) => {
        const res = await whiteboardCalloutStorageConfig(calloutId, userRole);
        const data =
          res.data?.lookup.callout?.framing.whiteboard?.profile.storageBucket
            .documents[0].authorization;

        expect(data?.myPrivileges?.sort()).toEqual(privileges);
        expect(data?.anonymousReadAccess).toEqual(anonymousReadAccess);
      }
    );

    test.each`
      userRole                     | privileges                                                                         | anonymousReadAccess | parentEntityType
      ${undefined}                 | ${undefined}                                                                       | ${undefined}        | ${undefined}
      ${TestUser.NON_HUB_MEMBER}   | ${undefined}                                                                       | ${undefined}        | ${undefined}
      ${TestUser.GLOBAL_ADMIN}     | ${sorted__create_read_update_delete_grant_fileUp_fileDel_contribute_updateContent} | ${false}            | ${'WHITEBOARD'}
      ${TestUser.HUB_ADMIN}        | ${sorted__create_read_update_delete_grant_fileUp_fileDel_contribute}               | ${false}            | ${'WHITEBOARD'}
      ${TestUser.HUB_MEMBER}       | ${undefined}                                                                       | ${undefined}        | ${undefined}
      ${TestUser.CHALLENGE_ADMIN}  | ${sorted__create_read_update_delete_grant_fileUp_fileDel_contribute}               | ${false}            | ${'WHITEBOARD'}
      ${TestUser.CHALLENGE_MEMBER} | ${['CONTRIBUTE', 'FILE_UPLOAD', 'READ']}                                           | ${false}            | ${'WHITEBOARD'}
    `(
      'User: "$userRole" has this privileges: "$privileges" to space challenge whiteboard callout storage bucket',
      async ({
        userRole,
        privileges,
        anonymousReadAccess,
        parentEntityType,
      }) => {
        const res = await whiteboardCalloutStorageConfig(calloutId, userRole);
        const data =
          res.data?.lookup.callout?.framing.whiteboard?.profile.storageBucket;

        expect(data?.authorization?.myPrivileges?.sort()).toEqual(privileges);
        expect(data?.authorization?.anonymousReadAccess).toEqual(
          anonymousReadAccess
        );
        expect(data?.parentEntity?.type).toEqual(parentEntityType);
      }
    );
  });

  describe('Access to WhiteboardRt Callout visual(banner) documents', () => {
    let calloutId: string;

    afterAll(async () => {
      await deleteDocument(documentId);
    });
    beforeAll(async () => {
      const callout = await createWhiteboardCallout(
        entitiesId.challenge.collaborationId,
        'whiteboard2',
        'Whiteboard Callout2',
        TestUser.GLOBAL_ADMIN
      );

      const calloutData = callout?.data?.createCalloutOnCollaboration;
      calloutId = calloutData?.id ?? '';
      const calloutStorageBucketId =
        calloutData?.framing?.whiteboard?.profile.storageBucket?.id ?? '';

      await uploadFileOnStorageBucket(
        path.join(__dirname, 'files-to-upload', 'image.png'),
        calloutStorageBucketId
      );

      const getDocId = await whiteboardCalloutStorageConfig(
        calloutId,
        TestUser.GLOBAL_ADMIN
      );

      documentId =
        getDocId.data?.lookup.callout?.framing.whiteboard?.profile.storageBucket
          ?.documents[0].id ?? '';
    });

    // Arrange
    test.each`
      userRole                     | privileges                                                           | anonymousReadAccess
      ${undefined}                 | ${undefined}                                                         | ${undefined}
      ${TestUser.NON_HUB_MEMBER}   | ${undefined}                                                         | ${undefined}
      ${TestUser.GLOBAL_ADMIN}     | ${sorted__create_read_update_delete_grant_contribute_updateContentt} | ${false}
      ${TestUser.HUB_ADMIN}        | ${sorted__create_read_update_delete_grant_contribute}                | ${false}
      ${TestUser.HUB_MEMBER}       | ${undefined}                                                         | ${undefined}
      ${TestUser.CHALLENGE_ADMIN}  | ${sorted__create_read_update_delete_grant_contribute}                | ${false}
      ${TestUser.CHALLENGE_MEMBER} | ${['CONTRIBUTE', 'READ']}                                            | ${false}
    `(
      'User: "$userRole" has this privileges: "$privileges" to space challenge visual for whiteboardRt callout (storageBucket) document',
      async ({ userRole, privileges, anonymousReadAccess }) => {
        const res = await whiteboardCalloutStorageConfig(calloutId, userRole);
        const data =
          res.data?.lookup.callout?.framing.whiteboard?.profile.storageBucket
            .documents[0].authorization;

        expect(data?.myPrivileges?.sort()).toEqual(privileges);
        expect(data?.anonymousReadAccess).toEqual(anonymousReadAccess);
      }
    );

    test.each`
      userRole                     | privileges                                                                         | anonymousReadAccess | parentEntityType
      ${undefined}                 | ${undefined}                                                                       | ${undefined}        | ${undefined}
      ${TestUser.NON_HUB_MEMBER}   | ${undefined}                                                                       | ${undefined}        | ${undefined}
      ${TestUser.GLOBAL_ADMIN}     | ${sorted__create_read_update_delete_grant_fileUp_fileDel_contribute_updateContent} | ${false}            | ${'WHITEBOARD'}
      ${TestUser.HUB_ADMIN}        | ${sorted__create_read_update_delete_grant_fileUp_fileDel_contribute}               | ${false}            | ${'WHITEBOARD'}
      ${TestUser.HUB_MEMBER}       | ${undefined}                                                                       | ${undefined}        | ${undefined}
      ${TestUser.CHALLENGE_ADMIN}  | ${sorted__create_read_update_delete_grant_fileUp_fileDel_contribute}               | ${false}            | ${'WHITEBOARD'}
      ${TestUser.CHALLENGE_MEMBER} | ${['CONTRIBUTE', 'FILE_UPLOAD', 'READ']}                                           | ${false}            | ${'WHITEBOARD'}
    `(
      'User: "$userRole" has this privileges: "$privileges" to space challenge whiteboardRt callout storage bucket',
      async ({
        userRole,
        privileges,
        anonymousReadAccess,
        parentEntityType,
      }) => {
        const res = await whiteboardCalloutStorageConfig(calloutId, userRole);
        const data =
          res.data?.lookup.callout?.framing.whiteboard?.profile.storageBucket;

        expect(data?.authorization?.myPrivileges?.sort()).toEqual(privileges);
        expect(data?.authorization?.anonymousReadAccess).toEqual(
          anonymousReadAccess
        );
        expect(data?.parentEntity?.type).toEqual(parentEntityType);
      }
    );
  });
});
