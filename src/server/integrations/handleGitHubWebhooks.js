import {graphql} from 'graphql';
import secureCompare from 'secure-compare';
import schema from 'server/graphql/rootSchema';
import signPayload from 'server/utils/signPayload';

// TODO when this is all legit, we'll map through the queries & use the ASTs instead of the strings
const eventLookup = {
  organization: {
    _getPublickKey: ({organization: {id}}) => String(id),
    member_added: {
      getVars: ({membership: {user: {login: userName}}, organization: {login: orgName}}) => ({userName, orgName}),
      query: `
        mutation GitHubAddMember($userName: ID! $orgName: ID!) {
          githubAddMember(userName: $userName, orgName: $orgName)
        }
      `
    },
    member_removed: {
      getVars: ({membership: {user: {login: userName}}, organization: {login: orgName}}) => ({userName, orgName}),
      query: `
        mutation GitHubRemoveMember($userName: ID! $orgName: ID!) {
          githubRemoveMember(userName: $userName, orgName: $orgName)
        }
      `
    }
  }
};

export default async (req, res) => {
  res.sendStatus(200);
  const event = req.get('X-GitHub-Event');
  const hexDigest = req.get('X-Hub-Signature');
  const {body} = req;
  const eventHandler = eventLookup[event];
  if (!body || !hexDigest || !eventHandler) return;

  const actionHandler = eventHandler[body.action];
  const publicKey = eventHandler._getPublickKey(body);
  if (!actionHandler || !publicKey) return;

  const [shaType, hash] = hexDigest.split('=');
  const githubSecret = signPayload(process.env.GITHUB_WEBHOOK_SECRET, publicKey);
  const myHash = signPayload(githubSecret, JSON.stringify(body), shaType);
  console.log('Got event', event, publicKey, githubSecret, myHash, hash);
  if (!secureCompare(hash, myHash)) return;

  const {getVars, query} = actionHandler;
  const variables = getVars(body);
  const context = {serverSecret: process.env.AUTH0_CLIENT_SECRET};
  const result = await graphql(schema, query, {}, context, variables);
  if (result.errors) {
    console.log('GITHUB GraphQL Error:', result.errors);
  }
};