import chalk from 'chalk';
import type Client from '../../util/client';
import { parseArguments } from '../../util/get-args';
import { getFlagsSpecification } from '../../util/get-flags-specification';
import { printError } from '../../util/error';
import { getCommandName } from '../../util/pkg-name';
import { getFlag } from '../../util/flags/get-flags';
import { deleteFlag } from '../../util/flags/delete-flag';
import output from '../../output-manager';
import { FlagsRmTelemetryClient } from '../../util/telemetry/commands/flags/rm';
import { removeSubcommand } from './command';
import { getLinkedFlagsProject, getProjectNameFromFlags } from './project';
import { getFlagSafetyBlockers } from '../../util/flags/safety-check';
import {
  buildCommandWithGlobalFlags,
  outputAgentError,
} from '../../util/agent-output';
import { AGENT_STATUS } from '../../util/agent-output-constants';
import { quoteArg } from '../../util/flags/quote-arg';

export default async function rm(
  client: Client,
  argv: string[]
): Promise<number> {
  const telemetryClient = new FlagsRmTelemetryClient({
    opts: {
      store: client.telemetryEventStore,
    },
  });

  let parsedArgs;
  const flagsSpecification = getFlagsSpecification(removeSubcommand.options);
  try {
    parsedArgs = parseArguments(argv, flagsSpecification);
  } catch (err) {
    printError(err);
    return 1;
  }

  const { args, flags } = parsedArgs;
  const [flagArg] = args;
  const skipConfirmation = flags['--yes'] as boolean | undefined;
  const dangerouslyForce = flags['--dangerously-force'] as boolean | undefined;
  const projectName = getProjectNameFromFlags(flags);

  if (!flagArg) {
    output.error('Please provide a flag slug or ID to delete');
    output.log(`Example: ${getCommandName('flags rm my-feature')}`);
    return 1;
  }

  telemetryClient.trackCliArgumentFlag(flagArg);
  telemetryClient.trackCliOptionProject(projectName);
  telemetryClient.trackCliFlagYes(skipConfirmation);
  telemetryClient.trackCliFlagDangerouslyForce(dangerouslyForce);
  const link = await getLinkedFlagsProject(client, projectName);
  if (link.status === 'error') {
    return link.exitCode;
  } else if (link.status === 'not_linked') {
    output.error(
      `Your codebase isn't linked to a project on Vercel. Pass --project <name>, or run ${getCommandName('link')} to link it.`
    );
    return 1;
  }

  client.config.currentTeam =
    link.org.type === 'team' ? link.org.id : undefined;

  const { project } = link;

  try {
    // First, verify the flag exists
    output.spinner('Fetching flag...');
    const flag = await getFlag(client, project.id, flagArg);
    output.stopSpinner();

    // Flag must be archived before it can be deleted
    if (flag.state !== 'archived') {
      output.error(
        `Flag ${chalk.bold(flag.slug)} must be archived before it can be deleted. Run ${getCommandName(`flags archive ${flag.slug}`)} first.`
      );
      return 1;
    }

    let blockers = await getFlagSafetyBlockers({
      client,
      projectId: project.id,
      ownerId: link.org.id,
      slug: flag.slug,
    });

    if (blockers.length && !dangerouslyForce) {
      const baseCmd = `flags rm ${quoteArg(flag.slug)}`;
      const retryCmd = buildCommandWithGlobalFlags(
        client.argv,
        `${baseCmd}${skipConfirmation || client.nonInteractive ? ' --yes' : ''} --dangerously-force`,
        undefined,
        { preserveProject: true }
      );

      const errorMessage = [
        `Flag ${chalk.bold(flag.slug)} may still be in use in Production and can't be deleted.`,
        ...blockers.map(blocker => `- ${blocker}`),
        '',
        'Remove the production reference and wait for evaluation activity to stop, then try again.',
        `To override this check, rerun with ${retryCmd}`,
      ].join('\n');

      if (client.nonInteractive) {
        outputAgentError(client, {
          status: AGENT_STATUS.ERROR,
          reason: 'production_safety_check_failed',
          message: errorMessage.replace(/\x1b\[[0-9;]*m/g, ''), // Strip ANSI codes
          next: [
            {
              command: retryCmd,
              when: 'override the production safety check',
            },
          ],
        });
        return 1;
      }

      output.error(errorMessage);
      return 1;
    }
    // Confirm deletion
    if (!skipConfirmation) {
      if (!client.stdin.isTTY) {
        output.error(
          'Missing required flag --yes. Use --yes to skip the confirmation prompt in non-interactive mode.'
        );
        return 1;
      }

      const confirmed = await client.input.confirm(
        `Are you sure you want to delete ${chalk.bold(flag.slug)}? This action cannot be undone.`,
        false
      );

      if (!confirmed) {
        output.log('Aborted');
        return 0;
      }

      // Recheck safety after interactive confirmation to catch race conditions
      blockers = await getFlagSafetyBlockers({
        client,
        projectId: project.id,
        ownerId: link.org.id,
        slug: flag.slug,
      });

      if (blockers.length && !dangerouslyForce) {
        const retryCmd = buildCommandWithGlobalFlags(
          client.argv,
          `flags rm ${quoteArg(flag.slug)} --dangerously-force`,
          undefined,
          { preserveProject: true }
        );

        output.error(
          [
            `Flag ${chalk.bold(flag.slug)} is now in use in Production and can't be deleted.`,
            ...blockers.map(blocker => `- ${blocker}`),
            '',
            `To override this check, rerun with ${retryCmd}`,
          ].join('\n')
        );
        return 1;
      }
    }

    if (blockers.length) {
      output.warn(
        `Deleting ${chalk.bold(flag.slug)} despite production activity because --dangerously-force was provided. This action cannot be undone.`
      );
    }

    // Delete the flag
    output.spinner('Deleting flag...');
    await deleteFlag(client, project.id, flagArg);
    output.stopSpinner();

    output.success(`Feature flag ${chalk.bold(flag.slug)} has been deleted`);
  } catch (err) {
    output.stopSpinner();
    printError(err);
    return 1;
  }

  return 0;
}
