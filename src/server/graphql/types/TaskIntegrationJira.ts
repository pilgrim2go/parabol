import {GraphQLID, GraphQLNonNull, GraphQLObjectType} from 'graphql'
import TaskIntegration, {taskIntegrationFields} from 'server/graphql/types/TaskIntegration'

const TaskIntegrationJira = new GraphQLObjectType({
  name: 'TaskIntegrationJira',
  description: 'The details associated with a task integrated with Jira',
  interfaces: () => [TaskIntegration],
  fields: () => ({
    ...taskIntegrationFields(),
    projectKey: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The project key used by jira as a more human readable proxy for a projectId'
    },
    projectName: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The name of the project as defined by jira'
    },
    cloudId: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The cloud ID that the project lives on'
    },
    issueKey: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The issue key used by jira as a more human readable proxy for the id field'
    }
  })
})

export default TaskIntegrationJira
