/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestUser } from '@alkemio/tests-lib';
import { getGraphqlClient } from '@utils/graphqlClient';
import { graphqlErrorWrapper } from '@utils/graphql.wrapper';
import { templateDefaultInfo } from './collaboration-template-testdata';
import { getSpaceData } from '../../journey/space/space.request.params';

export const getLifeCycleTemplateForSpaceByLifecycleTitle = async (
  spaceId: string,
  displayName: string
) => {
  const templatesPerSpace = await getSpaceData(spaceId);
  const allTemplates =
    templatesPerSpace?.data?.lookup?.space?.templatesManager?.templatesSet
      ?.collaborationTemplates ?? [];

  const filteredTemplate = allTemplates?.filter(item => {
    return item.profile.displayName === displayName;
  });

  return filteredTemplate;
};

export const getCollaborationTemplatesCountForSpace = async (
  spaceId: string
) => {
  const template = await getSpaceData(spaceId);
  const spaceCollaborationTemplates =
    template?.data?.lookup?.space?.templatesManager?.templatesSet
      ?.collaborationTemplates.length;

  return spaceCollaborationTemplates;
};

export const getCollaborationTemplatesCountByTemplateSetId = async (
  templateSetId: string,
  userRole: TestUser = TestUser.GLOBAL_ADMIN
) => {
  const graphqlClient = getGraphqlClient();
  const callback = (authToken: string | undefined) =>
    graphqlClient.GetCollaborationTemplatesCountByTemplateSetId(
      {
        templateSetId,
      },
      {
        authorization: `Bearer ${authToken}`,
      }
    );

  return graphqlErrorWrapper(callback, userRole);
};

export const getCollaborationTemplatesCount = async (templateSetId: string) => {
  const templates =
    await getCollaborationTemplatesCountByTemplateSetId(templateSetId);
  const collaborationTemplatesCount =
    templates?.data?.lookup?.templatesSet?.collaborationTemplatesCount ?? '';

  return collaborationTemplatesCount;
};

export const createTemplateFromCollaboration = async (
  collaborationId: string,
  templatesSetId: string,
  displayName: string,
  userRole: TestUser = TestUser.GLOBAL_ADMIN
) => {
  const graphqlClient = getGraphqlClient();
  const callback = (authToken: string | undefined) =>
    graphqlClient.CreateTemplateFromCollaboration(
      {
        collaborationId,
        templatesSetId,
        profileData: { displayName },
      },
      {
        authorization: `Bearer ${authToken}`,
      }
    );
  return graphqlErrorWrapper(callback, userRole);
};

export const updateCollaborationTemplate = async (
  templateId: string,
  profile: any = templateDefaultInfo,
  userRole: TestUser = TestUser.GLOBAL_ADMIN
) => {
  const graphqlClient = getGraphqlClient();
  const callback = (authToken: string | undefined) =>
    graphqlClient.UpdateCollaborationTemplate(
      {
        templateId,
        profile,
      },
      {
        authorization: `Bearer ${authToken}`,
      }
    );
  return graphqlErrorWrapper(callback, userRole);
};
